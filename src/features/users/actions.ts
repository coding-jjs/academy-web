"use server";

/**
 * 원장이 온보딩을 마친 GUEST에게 업무 역할을 부여한다.
 *
 * 호출: `(director)/director/users/RoleAssignmentForm.tsx`가 form action으로 제출한다.
 * STUDENT는 새 원생을 만들지 않고 `userId`가 비어 있는 기존 학생 카드에만 연결한다.
 * TEACHER/STAFF/PARENT는 User.role만 바꾸고 Student 행은 건드리지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - DIRECTOR를 부여하지 않는다 → `assignableRoles`에 없음.
 * - GUEST가 아닌 계정의 역할을 바꾸지 않는다 → where에 role=GUEST.
 * - JWT를 직접 갱신하지 않는다 → 다음 요청의 jwt 콜백이 DB를 다시 읽는다.
 *
 * 관련: `features/users/director-data.ts`, `lib/audit.ts`, Prisma Student.userId.
 */

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const assignableRoles = ["TEACHER", "STAFF", "PARENT", "STUDENT"] as const;

type AssignableRole = (typeof assignableRoles)[number];

/**
 * GUEST → 업무 역할. STUDENT면 빈 학생 카드(userId: null)에 연결한다.
 *
 * @param formData `userId`, `role`, STUDENT일 때만 `studentId`.
 * @returns void. 실패는 throw. 성공 시 원장 사용자·원생·학부모·리포트 경로를 재검증한다.
 * @auth DIRECTOR만. 그 외는 throw.
 * @sideEffects User.role 갱신, STUDENT면 Student.userId 연결, USER_ROLE_ASSIGNED 감사 로그.
 */
export async function assignUserRole(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "DIRECTOR") {
        throw new Error("역할을 부여할 권한이 없습니다.");
    }

    const userId = formData.get("userId");
    const requestedRole = formData.get("role");
    const studentId = formData.get("studentId");

    if (typeof userId !== "string" || !userId) {
        throw new Error("사용자 정보가 올바르지 않습니다.");
    }

    if (
        typeof requestedRole !== "string" ||
        !assignableRoles.includes(requestedRole as AssignableRole)
    ) {
        throw new Error("부여할 수 없는 역할입니다.");
    }

    if (
        requestedRole === "STUDENT" &&
        (typeof studentId !== "string" || !studentId)
    ) {
        throw new Error("연결할 기존 학생을 선택해 주세요.");
    }

    const metadata = await getAuditRequestMetadata();
    await prisma.$transaction(async (tx) => {
        const targetUser = await tx.user.findFirst({
            where: { id: userId, role: "GUEST", status: "ACTIVE" },
            select: {
                id: true,
                studentProfile: { select: { id: true } },
            },
        });

        if (!targetUser) {
            throw new Error("역할을 부여할 수 없는 사용자입니다.");
        }

        if (requestedRole === "STUDENT" && targetUser.studentProfile) {
            throw new Error(
                "이미 학생 프로필이 연결된 계정입니다. 학생 관리에서 재원 상태로 변경해 주세요.",
            );
        }

        const userResult = await tx.user.updateMany({
            where: {
                id: userId,
                role: "GUEST",
                status: "ACTIVE",
            },
            data: {
                role: requestedRole as AssignableRole,
            },
        });

        if (userResult.count === 0) {
            throw new Error("역할을 부여할 수 없는 사용자입니다.");
        }

        if (requestedRole === "STUDENT") {
            const studentResult = await tx.student.updateMany({
                where: {
                    id: studentId as string,
                    userId: null,
                    status: { in: ["ENROLLED", "PAUSED"] },
                },
                data: { userId },
            });

            if (studentResult.count === 0) {
                throw new Error(
                    "이미 다른 계정에 연결됐거나 연결할 수 없는 학생입니다.",
                );
            }
        }

        await writeAuditLog(tx, {
            actorUserId: session.user.id,
            action: "USER_ROLE_ASSIGNED",
            targetType: "USER",
            targetId: userId,
            details: {
                previousRole: "GUEST",
                nextRole: requestedRole,
                studentId:
                    requestedRole === "STUDENT"
                        ? (studentId as string)
                        : null,
            },
            metadata,
        });
    });

    revalidatePath("/director/users");
    revalidatePath("/director/students");
    revalidatePath("/director/parents");
    revalidatePath("/director/reports");
}
