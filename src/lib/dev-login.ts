/**
 * 로컬 전용 Credentials 로그인 규칙.
 * ENABLE_DEV_LOGIN과 @test.local 이메일만 허용해 실서비스 Google을 우회하지 못하게 한다.
 *
 * 호출:
 * - `auth.config.ts` — 제공자 배열에 넣을지, authorize/signIn에서 통과시킬지
 * - `features/auth/actions.ts` `signInAsTestUser`
 * - `(auth)/login/page.tsx` — 테스트 계정 select를 그릴지
 *
 * 읽기 전용 순수 함수. 클라이언트(로그인 페이지)와 서버(콜백)가 같이 import한다.
 * DB를 치지 않는다 — 이메일 형식만 거르고, 실제 User 조회는 authorize가 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 프로덕션에서 켜지지 않는다 → NODE_ENV === "development" AND 플래그.
 * - 비밀번호를 받지 않는다 → 시드된 @test.local 행이 있으면 바로 세션.
 * - Gmail/@학원 도메인을 이 경로로 받지 않는다.
 *
 * 관련: `auth.config.ts`, `scripts/seed-test-data.mjs`, `scripts/move-director-to-test-login.mjs`.
 */

import type { AppRole } from "@/types/roles";

/** Credentials provider id. `signIn(DEV_LOGIN_PROVIDER_ID)`와 auth.config 제공자 id가 같아야 한다. */
export const DEV_LOGIN_PROVIDER_ID = "dev-login";

/**
 * 개발 로그인으로 들어올 수 있는 역할. AppRole 전부와 같다.
 * authorize의 `role: { in: DEV_LOGIN_ROLES }`에 쓰여, 역할이 비정상이면 시드 이메일이어도 거절한다.
 */
export const DEV_LOGIN_ROLES = [
    "DIRECTOR",
    "TEACHER",
    "STAFF",
    "PARENT",
    "STUDENT",
    "GUEST",
] as const satisfies readonly AppRole[];

/**
 * 개발 Credentials를 켤지. 둘 다 맞아야 true.
 * 프로덕션 빌드에 제공자가 들어가지 않게 auth.config가 모듈 로드 시점에 이 값을 본다.
 */
export function isDevLoginEnabled() {
    return (
        process.env.NODE_ENV === "development" &&
        process.env.ENABLE_DEV_LOGIN === "true"
    );
}

/**
 * 폼/Credentials에서 온 값을 @test.local 이메일만 통과시킨다.
 *
 * @returns 소문자 trim 이메일. 문자열이 아니거나 도메인이 다르면 null.
 *          `+` `._-` 는 로컬 파트를 허용해 student.one+a@test.local 같은 별칭도 받는다.
 */
export function parseDevTestEmail(value: unknown) {
    if (typeof value !== "string") return null;

    const email = value.trim().toLowerCase();
    return /^[a-z0-9._+-]+@test\.local$/.test(email) ? email : null;
}
