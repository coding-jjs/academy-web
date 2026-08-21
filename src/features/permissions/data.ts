import "server-only"; // 읽기 전용. grant 쓰기는 actions.saveMemberPermissions.

/**
 * 권한 관리 화면에 쓸 ACTIVE 교사·직원과 현재 grant를 읽는다.
 *
 * 호출: `(director)/director/permissions/page.tsx`가 서버에서 불러
 * `PermissionManagementScreen`에 넘긴다.
 *
 * grant 행이 없으면 `resolvePermissions`가 역할 프리셋(교사/직원)을 채운다.
 * 교사는 프리셋·저장 모두에서 `billing`이 항상 false다.
 *
 * 의도적으로 하지 않는 일:
 * - BLOCKED 계정은 목록에 넣지 않는다.
 * - 원장 PermissionGrant를 만들지 않는다 → 원장은 전권.
 *
 * 관련: `features/permissions/types.ts`, `lib/permissions.ts`,
 * `features/permissions/actions.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. upsert는 actions.
import { resolvePermissions } from "@/lib/permissions"; // grant null이면 역할 프리셋. 교사 billing은 강제 false.
import type { PermissionMember } from "@/features/permissions/types"; // 화면 토글 행. 원장/학부모는 없다.

/**
 * 권한 토글 화면에 쓸 교사·직원 목록.
 *
 * @returns 역할·이름순. `permissions`는 프리셋+grant 병합 결과.
 * @auth 페이지가 DIRECTOR만 통과. 이 함수는 재검사하지 않는다.
 * @sideEffects 없음. 읽기 전용.
 */
export async function getPermissionMembers(): Promise<PermissionMember[]> { // 토글 초기값. 쓰기는 saveMemberPermissions.
    const users = await prisma.user.findMany({ // BLOCKED·원장·학부모는 목록에 안 올린다.
        where: { // 원장 grant는 만들지 않는다. 학부모·학생은 PermissionGrant 대상이 아님.
            role: { in: ["TEACHER", "STAFF"] }, // 원장 grant는 만들지 않는다. 학부모·학생은 PermissionGrant 대상이 아님.
            status: "ACTIVE", // BLOCKED는 토글해도 업무 화면에 못 들어가므로 목록에서 뺀다.
        },
        select: { // grant 컬럼 전부. 없으면 resolve가 프리셋을 채운다.
            id: true, // saveMemberPermissions의 대상.
            name: true, // 권한 화면 행 라벨.
            email: true, // 동명이인 구분.
            role: true, // TEACHER면 billing을 resolve가 false로.
            permissionGrant: { // 행이 없으면 null. 프리셋으로 채운다.
                select: { // 키 목록은 PERMISSION_KEYS와 맞춰 둔다.
                    viewAllStudents: true, // 없으면 staff-scope가 담당반만.
                    viewParentContact: true, // 원생 화면 연락처.
                    editLifeCounseling: true, // 상담 메모.
                    writeAiReport: true, // AI 리포트 작성.
                    aiDirectSend: true, // 학부모 직접 발송.
                    ownClassAttendanceGrade: true, // 담당반 출결·성적.
                    otherTeacherAttendanceGrade: true, // 타반 출결·성적.
                    sendMessage: true, // 메시지.
                    billing: true, // 교사면 resolve가 강제 false.
                    linkParentStudent: true, // 학부모-원생 연결. 원장 화면과 별개 키.
                },
            },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }], // 교사·직원 묶음 뒤 이름순.
    });

    return users.map((user) => { // grant null이어도 모든 키가 존재하게 병합.
        const role = user.role as PermissionMember["role"]; // findMany where가 TEACHER/STAFF만 보장.
        return { // Screen 토글이 바로 쓰는 맵.
            id: user.id, // saveMemberPermissions의 대상.
            name: user.name, // 행 라벨.
            email: user.email, // 동명이인.
            role, // 교사면 저장 시에도 billing false.
            permissions: resolvePermissions(role, user.permissionGrant), // grant null이면 역할 프리셋. 교사 billing은 여기서 false.
        };
    });
}
