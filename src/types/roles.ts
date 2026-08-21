/**
 * 앱 전역 역할·권한 키 타입.
 * URL prefix, 사이드바 NavItem, PermissionKey를 한곳에서 맞춰 오타로 권한 구멍이 나지 않게 한다.
 *
 * 호출: `auth-guard`, `proxy`, `navigation`, `permissions`, 셸 레이아웃 전부.
 * 런타임 값이 아니라 타입만. 클라이언트·서버 모두 import 가능.
 *
 * DB `UserRole`과 AppRole 문자열을 같게 유지한다. STAFF만 URL이 `/employee`다
 * (옛 `/staff`와 교사 `/teacher`를 가르기 위함).
 *
 * 의도적으로 하지 않는 일:
 * - 역할 → 홈 경로 맵은 두지 않는다 → `role-routes.ts`.
 * - grant 기본 boolean은 두지 않는다 → `permissions.ts`.
 *
 * 관련: Prisma `UserRole` / `PermissionGrant`, `next-auth.d.ts`.
 */

/**
 * JWT·DB에 실리는 역할. GUEST는 Google 가입 직후·온보딩 전, 또는 퇴원 확정 후.
 * DIRECTOR만 `roleHasAllPermissions`.
 */
export type AppRole =
    | "DIRECTOR"
    | "TEACHER"
    | "STAFF"
    | "PARENT"
    | "STUDENT"
    | "GUEST";

/**
 * URL·셸 prefix. STAFF → `employee`.
 * `roleNavigation` 키와 `(director)|...` 라우트 그룹 이름이 이 유니온과 같아야 한다.
 */
export type RolePrefix =
    | "director"
    | "teacher"
    | "employee"
    | "parent"
    | "student"
    | "guest";

/** 사이드바 한 줄. icon은 장식(aria-hidden), 실제 이름은 label. */
export type NavItem = {
    href: string;
    label: string;
    icon: string;
};

/**
 * 교사/직원 grant 컬럼과 1:1. `PERMISSION_KEYS`와 Prisma 모델이 이 이름을 쓴다.
 * 새 키를 넣으면 permissions.ts 프리셋과 grant 테이블 마이그레이션이 같이 필요하다.
 */
export type PermissionKey =
    | "viewAllStudents"
    | "viewParentContact"
    | "editLifeCounseling"
    | "writeAiReport"
    | "aiDirectSend"
    | "ownClassAttendanceGrade"
    | "otherTeacherAttendanceGrade"
    | "sendMessage"
    | "billing"
    | "linkParentStudent";
