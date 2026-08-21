"use server";

/**
 * 로그인/가입 버튼이 호출하는 Server Action. NextAuth `signIn`만 감싼다.
 *
 * 호출:
 * - `/login` Google 버튼 → `signInWithGoogle`
 * - `/signup` Google 버튼 → `signUpWithGoogle`
 * - `/login` 개발 테스트 select → `signInAsTestUser`
 *
 * User 행을 여기서 만들지 않는다. Google 콜백(`auth.config.ts` signIn)이
 * intent 쿠키를 보고 기존 회원만 통과시키거나 GUEST를 만든다.
 *
 * 실패는 throw가 아니라 Auth.js가 `/login?error=...`로 보낸다.
 * Credentials 실패만 이 파일에서 catch 해 같은 쿼리로 돌린다.
 */

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import {
    DEV_LOGIN_PROVIDER_ID,
    isDevLoginEnabled,
    parseDevTestEmail,
} from "@/lib/dev-login";
import { setOAuthIntent } from "@/lib/oauth-intent";

/**
 * 기존 회원 Google 로그인.
 * intent=login 이라 DB에 이메일이 없으면 Unregistered로 거절되고 신규 GUEST를 만들지 않는다.
 * 성공 시 `/post-login`이 역할 홈 또는 온보딩으로 나눈다.
 */
export async function signInWithGoogle() {
    await setOAuthIntent("login");
    await signIn("google", { redirectTo: "/post-login" });
}

/**
 * 신규 가입 Google 로그인.
 * intent=signup 이라 미등록 이메일도 GUEST 행을 만들고 `/signup?step=details`로 보낸다.
 * 로그인 화면의 Google 버튼은 이 함수를 타지 않는다 — 기존 회원만 들어오게 하기 위함.
 */
export async function signUpWithGoogle() {
    await setOAuthIntent("signup");
    await signIn("google", { redirectTo: "/signup?step=details" });
}

/**
 * ENABLE_DEV_LOGIN일 때만 통과하는 @test.local Credentials 로그인.
 *
 * @param formData name=email. parseDevTestEmail이 도메인·형식을 한 번 더 막는다.
 * 프로덕션에서 플래그가 꺼져 있으면 그냥 `/login`으로 보낸다 (에러 문구를 안 줘서 존재를 숨김).
 */
export async function signInAsTestUser(formData: FormData) {
    if (!isDevLoginEnabled()) redirect("/login");

    const email = parseDevTestEmail(formData.get("email"));
    if (!email) redirect("/login?error=CredentialsSignin");

    try {
        await signIn(DEV_LOGIN_PROVIDER_ID, {
            email,
            redirectTo: "/post-login",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect("/login?error=CredentialsSignin");
        }
        throw error;
    }
}
