"use server";

/**
 * 원장이 교사·직원의 PermissionGrant를 upsert로 저장한다.
 *
 * 호출: `(director)/director/permissions/PermissionManagementScreen.tsx`.
 * 선생님(TEACHER)은 스펙상 수납(`billing`)을 항상 false로 고정한다.
 * 저장 후 출석·성적·원생·상담·수납 등 권한에 영향받는 경로를 재검증한다.
 *
 * 의도적으로 하지 않는 일:
 * - 원장/학부모/학생 grant를 만들지 않는다.
 * - 역할 자체를 바꾸지 않는다 → `assignUserRole`.
 * - JWT에 권한을 심지 않는다 → 매 요청 `userHasPermission`이 DB를 본다.
 *
 * 관련: `lib/permissions.ts`의 PERMISSION_KEYS, `lib/permission-guard.ts`.
 */

import { revalidatePath } from "next/cache";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSION_KEYS } from "@/lib/permissions";
import type { PermissionKey } from "@/types/roles";

/**
 * 권한 저장 결과. throw 대신 `{ ok }`로 UI 메시지를 돌린다.
 */
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

/**
 * 한 교사·직원의 권한 맵을 PermissionGrant에 upsert한다.
 *
 * @param input.userId 대상 User.id. ACTIVE TEACHER/STAFF만 허용.
 * @param input.permissions 화면 토글 전체. 빠진 키는 false.
 * @returns 성공/실패 메시지. 교사면 billing은 입력과 무관하게 false로 저장된다.
 * @auth DIRECTOR. 아니면 `{ ok: false }`.
 * @sideEffects PermissionGrant upsert, PERMISSION_CHANGED 감사 로그, 관련 경로 revalidate.
 */
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
    revalidatePath("/employee/billing");
    revalidatePath("/teacher/grades");
    revalidatePath("/teacher/students");
    revalidatePath("/employee/students");
    revalidatePath("/teacher/reports");
    revalidatePath("/teacher/counseling");
    revalidatePath("/employee/counseling");

    return { ok: true, message: "권한을 저장했습니다." };
}
