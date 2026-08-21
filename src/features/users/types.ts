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

import type { StudentStatus } from "@/features/students/types"; // ENROLLED/PAUSED만 후보. WITHDRAWN은 data where.

/**
 * 온보딩을 끝낸 ACTIVE GUEST 한 명.
 * `hasStudentProfile`이 true면 이미 Student 카드가 있어 STUDENT 역할 연결 UI를 막는다.
 */
export type PendingRoleUser = { // 대기 큐 한 줄. 이미 역할 있는 계정은 data가 안 넣는다.
    id: string; // User.id. RoleAssignmentForm hidden input.
    name: string; // 온보딩 이름. 출석 명단·역할 부여 라벨에 그대로.
    email: string; // Google 이메일. 역할과 무관하게 계정 키.
    phone: string | null; // 온보딩 전화. 원장이 대기 목록에서 확인.
    address: string | null; // 온보딩 주소. 학원 연락용.
    schoolName: string | null; // STUDENT 부여 전에도 온보딩 학교를 보여 준다.
    grade: string | null; // 1~12 문자열. 유치원/재수는 null일 수 있다.
    joinedAt: string; // User.createdAt ISO. 가입 대기 순 정렬 표시.
    hasStudentProfile: boolean; // true면 이미 Student.userId가 있어 STUDENT 부여 UI를 막는다.
};

/**
 * Google 계정이 아직 없는 학생 카드(userId: null).
 * STUDENT 역할 부여 시 이 id만 `assignUserRole`에 넘긴다. 신규 Student를 만들지 않는다.
 */
export type UnlinkedStudentOption = { // 빈 카드. 신규 원생 생성이 아니다.
    id: string; // 기존 Student.id. assignUserRole이 이 카드에 userId를 붙인다.
    name: string; // 원생 카드 이름. User.name과 나중에 같아질 수 있다.
    schoolName: string | null; // 카드에 적힌 학교. 온보딩 값과 별개일 수 있다.
    grade: string | null; // 카드 학년.
    status: StudentStatus; // ENROLLED/PAUSED만 data가 채운다. WITHDRAWN은 후보가 아니다.
};
