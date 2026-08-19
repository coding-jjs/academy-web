"use server"; // 원장 쓰기. 목록 읽기는 data.getPermissionMembers.

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

import { revalidatePath } from "next/cache"; // 토글이 영향 주는 출석·성적·원생·상담·수납 경로.
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit"; // PERMISSION_CHANGED. 트랜잭션 안.
import { auth } from "@/lib/auth"; // JWT. layout 밖 직접 호출도 DIRECTOR만.
import { prisma } from "@/lib/db"; // PermissionGrant upsert. User.role은 건드리지 않는다.
import { PERMISSION_KEYS } from "@/lib/permissions"; // 빠진 키는 false. 키 집합의 단일 소스.
import type { PermissionKey } from "@/types/roles"; // 토글 맵. JWT에 심지 않는다.

/**
 * 권한 저장 결과. throw 대신 `{ ok }`로 UI 메시지를 돌린다.
 */
type ActionResult = // Screen이 토스트로 그린다. redirect 페이로드가 아니다.
    | { ok: true; message?: string } // 저장 성공. 교사면 billing은 이미 false로 들어갔다.
    | { ok: false; message: string }; // 권한·대상 검증 실패. grant 행을 만들지 않는다.

async function requireDirector() { // throw 대신 null. 호출 측이 { ok: false }를 만든다.
    const session = await auth(); // JWT. 원장이 아니면 null — throw 대신 호출 측이 { ok: false }.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") { // PARENT/TEACHER 직접 호출 방어.
        return null; // Screen이 "원장 권한이 필요합니다"를 보여 준다.
    }
    return session; // actorUserId·감사 로그에 쓴다.
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
export async function saveMemberPermissions(input: { // 역할 부여가 아니다. grant 행만 upsert.
    userId: string; // ACTIVE TEACHER/STAFF. DIRECTOR grant는 만들지 않는다.
    permissions: Record<PermissionKey, boolean>; // 빠진 키는 아래에서 false. 교사 billing은 강제 false.
}): Promise<ActionResult> { // throw 없음. Screen이 ok/message를 그린다.
    const session = await requireDirector(); // layout 밖 직접 호출도 여기서 막는다.
    if (!session) { // PARENT가 이 액션을 쳐도 grant를 만들지 않는다.
        return { ok: false, message: "원장 권한이 필요합니다." }; // layout 밖 직접 호출 방어.
    }

    const userId = String(input.userId ?? "").trim(); // 빈 값이면 Prisma unique를 치지 않는다.
    if (!userId) { // 화면이 대상을 안 고른 상태.
        return { ok: false, message: "사용자를 선택해 주세요." }; // 빈 값이면 Prisma unique를 치지 않는다.
    }

    const user = await prisma.user.findUnique({ // 역할·상태만. grant 존재 여부는 upsert가 처리.
        where: { id: userId }, // 대상 User.
        select: { id: true, role: true, status: true }, // BLOCKED·학부모는 아래에서 거절.
    });

    if (!user || user.status !== "ACTIVE") { // BLOCKED에게 grant를 남기지 않는다.
        return { ok: false, message: "사용자를 찾을 수 없습니다." }; // 없는 id·차단 계정.
    }

    if (user.role !== "TEACHER" && user.role !== "STAFF") { // 원장/학부모/학생 grant 행을 만들지 않는다.
        return { // DIRECTOR는 전권이라 grant가 필요 없다.
            ok: false, // 역할을 바꾸지 않는다. assignUserRole 몫.
            message: "선생님·직원에게만 권한을 부여할 수 있습니다.", // DIRECTOR/PARENT/STUDENT grant 행을 만들지 않는다.
        };
    }

    const data: Record<PermissionKey, boolean> = {} as Record< // 화면 토글을 키 집합에 맞춰 채운다.
        PermissionKey, // PERMISSION_KEYS가 단일 소스.
        boolean // 빠진 키는 false.
    >; // 빈 맵. 바로 아래에서 채운다.

    for (const key of PERMISSION_KEYS) { // 화면에 빠진 키는 false. 키 집합은 PERMISSION_KEYS가 단일 소스.
        data[key] = Boolean(input.permissions?.[key]); // 화면에 빠진 키는 false. 키 집합은 PERMISSION_KEYS가 단일 소스.
    }

    if (user.role === "TEACHER") { // 직원은 billing 토글을 허용. 선생님만 강제 false.
        data.billing = false; // 입력·토글과 무관. 선생님은 수납 권한을 가질 수 없다.
    }

    const metadata = await getAuditRequestMetadata(); // IP·UA.
    await prisma.$transaction(async (tx) => { // upsert와 감사 로그를 한 트랜잭션.
        await tx.permissionGrant.upsert({ // JWT에 권한을 심지 않는다. 다음 요청이 DB를 본다.
            where: { userId }, // 한 User당 grant 한 행.
            create: { userId, ...data }, // 행이 없으면 프리셋 대신 명시 grant.
            update: { ...data }, // JWT에 권한을 심지 않는다. 다음 요청 userHasPermission이 DB를 본다.
        });

        await writeAuditLog(tx, { // PERMISSION_CHANGED. 같은 트랜잭션.
            actorUserId: session.user.id, // 원장.
            action: "PERMISSION_CHANGED", // 역할 부여와 다른 액션.
            targetType: "USER", // grant 대상 User.
            targetId: userId, // 교사·직원 id.
            details: { role: user.role, permissions: data }, // 교사면 billing false가 이미 반영됨.
            metadata, // IP·UA.
        });
    });

    revalidatePath("/director/permissions"); // 토글 화면.
    revalidatePath("/employee/billing"); // 직원 billing 토글.
    revalidatePath("/teacher/grades"); // own/other 성적 키.
    revalidatePath("/teacher/students"); // viewAllStudents 스코프.
    revalidatePath("/employee/students"); // viewAllStudents 스코프.
    revalidatePath("/teacher/reports"); // writeAiReport 등.
    revalidatePath("/teacher/counseling"); // editLifeCounseling.
    revalidatePath("/employee/counseling"); // 직원 상담.

    return { ok: true, message: "권한을 저장했습니다." }; // Screen 피드백. redirect 없음.
}
