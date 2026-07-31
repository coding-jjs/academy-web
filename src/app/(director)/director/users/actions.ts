"use server";

import { revalidatePath } from "next/cache";
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

    if (typeof userId !== "string" || !userId) {
        throw new Error("사용자 정보가 올바르지 않습니다.");
    }

    if (
        typeof requestedRole !== "string" ||
        !assignableRoles.includes(requestedRole as AssignableRole)
    ) {
        throw new Error("부여할 수 없는 역할입니다.");
    }

    const result = await prisma.user.updateMany({
        where: {
            id: userId,
            role: "GUEST",
            status: "ACTIVE",
        },
        data: {
            role: requestedRole as AssignableRole,
        },
    });

    if (result.count === 0) {
        throw new Error("역할을 부여할 수 없는 사용자입니다.");
    }

    revalidatePath("/director/users");
}
