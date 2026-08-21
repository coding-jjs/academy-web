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
export type AppRole = // JWT·URL·권한 키 타입. STAFF URL은 /employee.
    | "DIRECTOR" // 원장. /director. grant 없이 모든 권한 키 true.
    | "TEACHER" // 교사. /teacher. billing은 항상 false.
    | "STAFF" // 직원. URL prefix는 /employee. 일부 교사 Screen을 재사용.
    | "PARENT" // 학부모. 자녀 링크(endedAt null)만 본다. 권한 키 없음.
    | "STUDENT" // 학생. Student.userId가 본인인 행만. 권한 키 없음.
    | "GUEST"; // 온보딩 전·역할 부여 대기·퇴원 확정 후. /guest.

/**
 * URL·셸 prefix. STAFF → `employee`.
 * `roleNavigation` 키와 `(director)|...` 라우트 그룹 이름이 이 유니온과 같아야 한다.
 */
export type RolePrefix = // JWT·URL·권한 키 타입. STAFF URL은 /employee.
    | "director" // requireRole("DIRECTOR") + AdminShell.
    | "teacher" // requireRole("TEACHER") + AdminShell.
    | "employee" // requireRole("STAFF"). DB enum은 STAFF.
    | "parent" // requireRole("PARENT") + MemberShell.
    | "student" // requireRole("STUDENT") + MemberShell.
    | "guest"; // requireRole("GUEST"). 사이드바 없이 소개형 내비.

/** 사이드바 한 줄. icon은 장식(aria-hidden), 실제 이름은 label. */
export type NavItem = { // 사이드바 한 줄. 권한 키로 숨기지 않는다.
    href: string; // 해당 역할 URL 그룹 안. proxy가 prefix로 1차 가드.
    label: string; // 화면 이름. 권한 키로 숨기지 않는다.
    icon: string; // 장식. NavLink가 aria-hidden.
};

/**
 * 교사/직원 grant 컬럼과 1:1. `PERMISSION_KEYS`와 Prisma 모델이 이 이름을 쓴다.
 * 새 키를 넣으면 permissions.ts 프리셋과 grant 테이블 마이그레이션이 같이 필요하다.
 */
export type PermissionKey = // JWT·URL·권한 키 타입. STAFF URL은 /employee.
    | "viewAllStudents" // 꺼지면 담임 반만. staff-scope where.
    | "viewParentContact" // 학부모 연락처. 원생 상세.
    | "editLifeCounseling" // 상담 메모 작성.
    | "writeAiReport" // 리포트 초안 저장·재생성·승인요청.
    | "aiDirectSend" // 원장 승인 없이 발송. 교사 기본 false.
    | "ownClassAttendanceGrade" // 담당 반 출석·성적 쓰기.
    | "otherTeacherAttendanceGrade" // 타반 출석·성적. 기본 false.
    | "sendMessage" // 쪽지 작성. 직원은 승인 대기.
    | "billing" // 수납. 교사는 grant가 true여도 끈다.
    | "linkParentStudent"; // 학부모-원생 연결. 교사 기본 false.
