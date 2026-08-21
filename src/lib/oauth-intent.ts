/**
 * OAuth가 로그인인지 가입인지 httpOnly 쿠키로 기억한다.
 * Google 콜백(`auth.config.ts` signIn)이 신규 GUEST를 만들지, 기존 회원만 받을지 가르기 위함.
 *
 * 호출:
 * - `features/auth/actions.ts` `signInWithGoogle` / `signUpWithGoogle` → `setOAuthIntent`
 * - `auth.config.ts` signIn 콜백 → `readOAuthIntent` 후 즉시 `clearOAuthIntent`
 *
 * 서버 전용 (`cookies()`). 쓰기는 set/clear, 읽기는 콜백 한 번.
 * 클라이언트가 intent를 쿼리스트링으로 넘기지 않는 이유: 가입 URL을 공유해
 * 로그인 버튼이 신규 계정을 만들게 조작하는 것을 막기 위함.
 *
 * 의도적으로 하지 않는 일:
 * - JWT에 intent를 넣지 않는다 → 콜백 전에 쿠키만 본다.
 * - 만료를 길게 두지 않는다 → 10분. 탭을 열어 둔 채 나중에 Google만 누르면 의도가 엇갈릴 수 있어서.
 *
 * 관련: `features/auth/actions.ts`, `auth.config.ts`.
 */

import { cookies } from "next/headers";

/** 쿠키 이름. 로그인/가입 버튼이 같은 키를 덮어쓴다. */
export const OAUTH_INTENT_COOKIE = "oauth_intent";

/** 로그인 버튼은 기존 회원만, 가입 버튼은 없으면 GUEST 생성. */
export type OAuthIntent = "login" | "signup";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
    secure: process.env.NODE_ENV === "production",
};

/**
 * 곧 시작할 Google OAuth의 의도(login/signup)를 쿠키에 심는다.
 * 같은 키를 덮어쓰므로 마지막 버튼이 이긴다.
 */
export async function setOAuthIntent(intent: OAuthIntent) {
    const store = await cookies();
    store.set(OAUTH_INTENT_COOKIE, intent, cookieOptions);
}

/**
 * 콜백에서 의도를 읽는다. 값이 login/signup이 아니면 null
 * (변조·만료·미설정). null이면 signIn 콜백이 신규 생성을 하지 않는다.
 */
export async function readOAuthIntent(): Promise<OAuthIntent | null> {
    const store = await cookies();
    const value = store.get(OAUTH_INTENT_COOKIE)?.value;
    return value === "login" || value === "signup" ? value : null;
}

/**
 * 한 번 쓴 intent를 지운다. path를 맞춰야 삭제된다.
 * 지우지 않으면 가입 버튼 이후 로그인 버튼이 신규 GUEST를 만들 수 있다.
 */
export async function clearOAuthIntent() {
    const store = await cookies();
    store.delete({ name: OAUTH_INTENT_COOKIE, path: "/" });
}
