/**
 * 역할 → 홈 URL·한글 라벨.
 * 로그인 직후와 셸 헤더가 같은 경로/문구를 쓰게 한다.
 *
 * 호출:
 * - `(auth)/post-login/page.tsx` → `getRoleHomePath` (역할 홈으로 redirect)
 * - `AdminShell` → `adminRoleLabels` (헤더 "원장 페이지")
 * - 로그인 페이지 → `roleLabels` (개발 계정 목록 한글명)
 *
 * 읽기 전용. 클라이언트·서버 모두 import 가능. DB를 치지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - URL 접근 권한은 보지 않는다 → `proxy.ts` / `requireRole`.
 * - 사이드바 메뉴 목록은 두지 않는다 → `navigation.ts`.
 * - STAFF의 URL prefix는 `employee`다. `/staff`는 옛 경로라 proxy가 보낸다.
 *
 * 관련: `navigation.ts`, `types/roles.ts`, `proxy.ts`.
 */

import type { AppRole } from "@/types/roles"; // JWT·DB 역할. STAFF만 URL이 /employee.

/** 세션 role → 화면 한글. 헤더·개발 로그인 select가 같은 문구를 쓴다. */
export const roleLabels: Record<AppRole, string> = { // 헤더·개발 로그인 select. URL 가드는 하지 않는다.
    DIRECTOR: "원장", // /director. AdminShell 헤더.
    TEACHER: "선생님", // /teacher.
    STAFF: "직원", // URL은 /employee. DB enum은 STAFF.
    PARENT: "학부모", // MemberShell.
    STUDENT: "학생", // MemberShell.
    GUEST: "게스트", // 셸 라벨은 memberLabel이 "학원 안내"로 바꿀 수 있다.
};

/**
 * AdminShell URL prefix → 한글. STAFF는 경로가 `/employee`라 키도 employee.
 * teacher/director와 달리 DB enum은 STAFF다.
 */
export const adminRoleLabels = { // AdminShell 헤더. requireRole 이후 셸이 읽는다.
    director: roleLabels.DIRECTOR, // requireRole("DIRECTOR") 레이아웃.
    teacher: roleLabels.TEACHER, // requireRole("TEACHER").
    employee: roleLabels.STAFF, // requireRole("STAFF"). /staff가 아님.
} as const; // adminRoleLabels 끝.

/**
 * 로그인 직후 보낼 홈. GUEST는 `/`(소개)이지 `/guest`가 아니다.
 * 온보딩 미완료 GUEST는 post-login이 여기 오기 전에 `/signup`으로 보낸다.
 */
const roleHomePaths: Record<AppRole, string> = { // post-login만 호출. proxy matcher와 맞춤.
    DIRECTOR: "/director/dashboard", // 원장 카드 홈. proxy가 DIRECTOR만 통과.
    TEACHER: "/teacher/dashboard", // 교사 홈. 수납 메뉴는 없다.
    STAFF: "/employee/dashboard", // /staff가 아니다. proxy가 옛 URL을 여기로 보낸다.
    PARENT: "/parent/dashboard", // 자녀 링크 범위는 page·data.ts.
    STUDENT: "/student/dashboard", // 본인 Student.userId만.
    GUEST: "/", // 소개. /guest가 아님. 온보딩 미완료는 post-login이 /signup.
};

/** 해당 역할의 기본 랜딩 경로. post-login만 호출한다. */
export function getRoleHomePath(role: AppRole) { // 로그인 직후. URL 가드는 proxy·requireRole.
    return roleHomePaths[role]; // GUEST는 `/`(소개)이지 `/guest`가 아니다. URL 가드는 하지 않는다.
}
