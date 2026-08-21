/**
 * 원장 역할 부여 화면의 대기 사용자·연결 가능 원생 타입.
 *
 * 호출: `features/users/director-data.ts`가 채우고
 * `(director)/director/users/DirectorUsersScreen.tsx`·`RoleAssignmentForm.tsx`가 그린다.
 *
 * 의도적으로 하지 않는 일:
 * - 이미 역할이 있는 TEACHER/STAFF/PARENT/STUDENT 목록을 담지 않는다 → 대기 큐만.
 * - 퇴원(WITHDRAWN) 학생을 연결 후보에 넣지 않는다 → data 레이어 where.
 *
 * 관련: `features/users/actions.ts`, `features/users/director-data.ts`,
 * `features/students/types.ts`의 `StudentStatus`.
 */

import type { StudentStatus } from "@/features/students/types";

/**
 * 온보딩을 끝낸 ACTIVE GUEST 한 명.
 * `hasStudentProfile`이 true면 이미 Student 카드가 있어 STUDENT 역할 연결 UI를 막는다.
 */
export type PendingRoleUser = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    schoolName: string | null;
    grade: string | null;
    joinedAt: string;
    hasStudentProfile: boolean;
};

/**
 * Google 계정이 아직 없는 학생 카드(userId: null).
 * STUDENT 역할 부여 시 이 id만 `assignUserRole`에 넘긴다. 신규 Student를 만들지 않는다.
 */
export type UnlinkedStudentOption = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: StudentStatus;
};
