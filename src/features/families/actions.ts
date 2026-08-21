"use server";

/**
 * 원장만 학부모-원생 ParentStudentLink를 연결하거나 해제한다.
 *
 * 호출:
 * - 연결: `(director)/director/parents/ParentStudentLinkForm.tsx`
 * - 해제: `(director)/director/parents/UnlinkParentStudentButton.tsx`
 *
 * 학부모가 임의로 자녀를 추가하지 못하게 하고,
 * 해제는 행 삭제가 아니라 `endedAt`을 남겨 이력을 보존한다.
 * 마지막 활성 링크가 끊긴 학부모는 PARENT에서 GUEST로 되돌린다.
 *
 * 의도적으로 하지 않는 일:
 * - 한 학생에 활성 링크를 두 개 두지 않는다.
 * - 휴원/퇴원 학생·미온보딩 학부모는 연결하지 않는다.
 *
 * 관련: `features/families/director-data.ts`, `lib/audit.ts`.
 */

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * `useActionState`가 주고받는 연결/해제 UI 상태.
 * idle은 초기값용이며 이 파일의 성공·실패 반환에는 쓰지 않는다.
 */
export type ParentLinkState = {
    status: "idle" | "success" | "error";
    message: string;
};

const allowedRelationships = new Set([
    "어머니",
    "아버지",
    "조부모",
    "기타 보호자",
]);

const allowedEndReasons = new Set([
    "잘못된 연결",
    "보호자 변경",
    "원장 수동 해제",
]);

async function requireDirector() {
    const session = await auth();
    if (!session?.user || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

/**
 * 활성 ParentStudentLink를 하나 만든다. 학생당 활성 링크는 최대 1개.
 *
 * @param _previousState useActionState 직전 상태. 서버는 폼만 본다.
 * @param formData `parentUserId`, `studentId`, `relationship`(허용 집합만).
 * @returns 성공/실패 메시지. redirect하지 않는다.
 * @auth DIRECTOR. 아니면 error.
 * @sideEffects 링크 create, PARENT_STUDENT_LINKED 감사 로그, parents/students revalidate.
 */
export async function linkParentStudent(
    _previousState: ParentLinkState,
    formData: FormData,
): Promise<ParentLinkState> {
    const session = await requireDirector();

    if (!session) {
        return {
            status: "error",
            message: "학부모와 학생을 연결할 권한이 없습니다.",
        };
    }

    const parentUserId = formData.get("parentUserId");
    const studentId = formData.get("studentId");
    const relationship = formData.get("relationship");

    if (typeof parentUserId !== "string" || !parentUserId) {
        return { status: "error", message: "학부모를 선택해 주세요." };
    }

    if (typeof studentId !== "string" || !studentId) {
        return { status: "error", message: "학생을 선택해 주세요." };
    }

    if (
        typeof relationship !== "string" ||
        !allowedRelationships.has(relationship)
    ) {
        return {
            status: "error",
            message: "학생과의 관계를 다시 선택해 주세요.",
        };
    }

    try {
        const metadata = await getAuditRequestMetadata();
        await prisma.$transaction(async (tx) => {
            const [parent, student, activeLink] = await Promise.all([
                tx.user.findFirst({
                    where: {
                        id: parentUserId,
                        role: "PARENT",
                        status: "ACTIVE",
                        onboardingCompleteAt: { not: null },
                    },
                    select: { id: true },
                }),
                tx.student.findFirst({
                    where: {
                        id: studentId,
                        status: "ENROLLED",
                        user: {
                            is: {
                                role: "STUDENT",
                                status: "ACTIVE",
                            },
                        },
                    },
                    select: { id: true },
                }),
                tx.parentStudentLink.findFirst({
                    where: {
                        studentId,
                        endedAt: null,
                    },
                    select: { id: true },
                }),
            ]);

            if (!parent) {
                throw new Error("연결할 수 없는 학부모 계정입니다.");
            }

            if (!student) {
                throw new Error("연결할 수 없는 학생 계정입니다.");
            }

            if (activeLink) {
                throw new Error("이미 학부모가 연결된 학생입니다.");
            }

            const link = await tx.parentStudentLink.create({
                data: {
                    parentUserId: parent.id,
                    studentId: student.id,
                    relationship,
                    linkedBy: session.user.id,
                },
                select: { id: true },
            });

            await writeAuditLog(tx, {
                actorUserId: session.user.id,
                action: "PARENT_STUDENT_LINKED",
                targetType: "PARENT_STUDENT_LINK",
                targetId: link.id,
                details: {
                    parentUserId: parent.id,
                    studentId: student.id,
                    relationship,
                },
                metadata,
            });
        });

        revalidatePath("/director/parents");
        revalidatePath("/director/students");

        return {
            status: "success",
            message: "학부모와 학생을 연결했습니다.",
        };
    } catch (error) {
        console.error("학부모-학생 연결 실패", error);

        return {
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "연결 처리 중 오류가 발생했습니다.",
        };
    }
}

/**
 * 활성 링크에 endedAt을 찍는다. 행을 삭제하지 않아 연결 이력을 남긴다.
 *
 * 마지막 활성 링크가 없으면 해당 User.role을 PARENT → GUEST로 내린다.
 * 학부모 화면이 자녀 없이 PARENT로 남는 것을 막기 위함이다.
 *
 * @param _previousState useActionState 직전 상태.
 * @param formData `linkId`, `reason`(허용 해제 사유만).
 * @returns 성공/실패 메시지.
 * @auth DIRECTOR.
 * @sideEffects endedAt/endedBy/endReason, 조건적 role=GUEST, UNLINKED 감사 로그.
 */
export async function unlinkParentStudent(
    _previousState: ParentLinkState,
    formData: FormData,
): Promise<ParentLinkState> {
    const session = await requireDirector();

    if (!session) {
        return {
            status: "error",
            message: "연결을 해제할 권한이 없습니다.",
        };
    }

    const linkId = formData.get("linkId");
    const reason = formData.get("reason");

    if (typeof linkId !== "string" || !linkId) {
        return {
            status: "error",
            message: "연결 정보가 올바르지 않습니다.",
        };
    }

    if (typeof reason !== "string" || !allowedEndReasons.has(reason)) {
        return {
            status: "error",
            message: "연결 해제 사유를 선택해 주세요.",
        };
    }

    try {
        const metadata = await getAuditRequestMetadata();
        await prisma.$transaction(async (tx) => {
            const link = await tx.parentStudentLink.findFirst({
                where: {
                    id: linkId,
                    endedAt: null,
                },
                select: {
                    id: true,
                    parentUserId: true,
                    studentId: true,
                },
            });

            if (!link) {
                throw new Error("이미 해제됐거나 존재하지 않는 연결입니다.");
            }

            await tx.parentStudentLink.update({
                where: { id: link.id },
                data: {
                    endedAt: new Date(),
                    endedBy: session.user.id,
                    endReason: reason,
                },
            });

            const remainingParentLinks = await tx.parentStudentLink.count({
                where: {
                    parentUserId: link.parentUserId,
                    endedAt: null,
                },
            });

            if (remainingParentLinks === 0) {
                await tx.user.updateMany({
                    where: {
                        id: link.parentUserId,
                        role: "PARENT",
                    },
                    data: { role: "GUEST" },
                });
            }

            await writeAuditLog(tx, {
                actorUserId: session.user.id,
                action: "PARENT_STUDENT_UNLINKED",
                targetType: "PARENT_STUDENT_LINK",
                targetId: link.id,
                details: {
                    parentUserId: link.parentUserId,
                    studentId: link.studentId,
                    reason,
                },
                metadata,
            });
        });

        revalidatePath("/director/parents");
        revalidatePath("/director/students");

        return {
            status: "success",
            message: "학부모와 학생의 연결을 해제했습니다.",
        };
    } catch (error) {
        console.error("학부모-학생 연결 해제 실패", error);

        return {
            status: "error",
            message:
                error instanceof Error
                    ? error.message
                    : "연결 해제 중 오류가 발생했습니다.",
        };
    }
}
