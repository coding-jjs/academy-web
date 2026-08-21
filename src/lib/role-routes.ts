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

import type { AppRole } from "@/types/roles";

/** 세션 role → 화면 한글. 헤더·개발 로그인 select가 같은 문구를 쓴다. */
export const roleLabels: Record<AppRole, string> = {
    DIRECTOR: "원장",
    TEACHER: "선생님",
    STAFF: "직원",
    PARENT: "학부모",
    STUDENT: "학생",
    GUEST: "게스트",
};

/**
 * AdminShell URL prefix → 한글. STAFF는 경로가 `/employee`라 키도 employee.
 * teacher/director와 달리 DB enum은 STAFF다.
 */
export const adminRoleLabels = {
    director: roleLabels.DIRECTOR,
    teacher: roleLabels.TEACHER,
    employee: roleLabels.STAFF,
} as const;

/**
 * 로그인 직후 보낼 홈. GUEST는 `/`(소개)이지 `/guest`가 아니다.
 * 온보딩 미완료 GUEST는 post-login이 여기 오기 전에 `/signup`으로 보낸다.
 */
const roleHomePaths: Record<AppRole, string> = {
    DIRECTOR: "/director/dashboard",
    TEACHER: "/teacher/dashboard",
    STAFF: "/employee/dashboard",
    PARENT: "/parent/dashboard",
    STUDENT: "/student/dashboard",
    GUEST: "/",
};

/** 해당 역할의 기본 랜딩 경로. post-login만 호출한다. */
export function getRoleHomePath(role: AppRole) {
    return roleHomePaths[role];
}
