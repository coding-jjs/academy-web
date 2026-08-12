"use server";

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const assignableRoles = ["TEACHER", "STAFF", "PARENT", "STUDENT"] as const;

type AssignableRole = (typeof assignableRoles)[number];

export async function assignUserRole(formData: FormData) {
    const session = await auth();

    // 원장만 역할을 부여할 수 있음
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
