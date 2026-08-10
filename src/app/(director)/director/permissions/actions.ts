"use server";

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSION_KEYS } from "@/lib/permissions";
import type { PermissionKey } from "@/types/roles";

type ActionResult =
    | { ok: true; message?: string }
    | { ok: false; message: string };

async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

export async function saveMemberPermissions(input: {
    userId: string;
    permissions: Record<PermissionKey, boolean>;
}): Promise<ActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const userId = String(input.userId ?? "").trim();
    if (!userId) {
        return { ok: false, message: "사용자를 선택해 주세요." };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
        return { ok: false, message: "사용자를 찾을 수 없습니다." };
    }

    if (user.role !== "TEACHER" && user.role !== "STAFF") {
        return {
            ok: false,
            message: "선생님·직원에게만 권한을 부여할 수 있습니다.",
        };
    }

    const data: Record<PermissionKey, boolean> = {} as Record<
        PermissionKey,
        boolean
    >;

    for (const key of PERMISSION_KEYS) {
        data[key] = Boolean(input.permissions?.[key]);
    }

    // 선생님에게 수납 권한은 스펙상 불가
    if (user.role === "TEACHER") {
        data.billing = false;
    }

    const metadata = await getAuditRequestMetadata();
    await prisma.$transaction(async (tx) => {
        await tx.permissionGrant.upsert({
            where: { userId },
            create: { userId, ...data },
            update: { ...data },
        });

        await writeAuditLog(tx, {
            actorUserId: session.user.id,
            action: "PERMISSION_CHANGED",
            targetType: "USER",
            targetId: userId,
            details: { role: user.role, permissions: data },
            metadata,
        });
    });

    revalidatePath("/director/permissions");
    revalidatePath("/staff/billing");
    revalidatePath("/staff/grades");
    revalidatePath("/staff/students");
    revalidatePath("/staff/reports");
    revalidatePath("/staff/counseling");

    return { ok: true, message: "권한을 저장했습니다." };
}
