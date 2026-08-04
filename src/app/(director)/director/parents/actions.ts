"use server";

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
