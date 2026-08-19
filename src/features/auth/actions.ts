"use server"; // Server Action. Prisma User 행은 여기서 만들지 않는다.

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

import { AuthError } from "next-auth"; // Credentials 실패만 catch. NEXT_REDIRECT는 다시 던진다.
import { redirect } from "next/navigation"; // 운영에서 개발 로그인을 숨길 때 에러 문구 없이 /login.
import { signIn } from "@/lib/auth"; // NextAuth. User create는 Google 콜백 몫.
import { // 개발 Credentials. 운영 플래그 off면 아래 가드가 /login으로 보낸다.
    DEV_LOGIN_PROVIDER_ID, // @test.local 전용. Google provider id가 아니다.
    isDevLoginEnabled, // 꺼져 있으면 테스트 select 존재를 숨긴다.
    parseDevTestEmail, // 도메인·형식을 한 번 더 막는다.
} from "@/lib/dev-login"; // data.ts 목록과 같은 허용 집합.
import { setOAuthIntent } from "@/lib/oauth-intent"; // login이면 미등록 거절, signup이면 GUEST 생성.

/**
 * 기존 회원 Google 로그인.
 * intent=login 이라 DB에 이메일이 없으면 Unregistered로 거절되고 신규 GUEST를 만들지 않는다.
 * 성공 시 `/post-login`이 역할 홈 또는 온보딩으로 나눈다.
 */
export async function signInWithGoogle() { // 가입 버튼이 아니다. 미등록 이메일에 GUEST를 만들지 않는다.
    await setOAuthIntent("login"); // 콜백이 미등록 이메일을 Unregistered로 거절. 신규 GUEST를 만들지 않는다.
    await signIn("google", { redirectTo: "/post-login" }); // 성공 후 /post-login이 역할 홈·온보딩을 가른다.
}

/**
 * 신규 가입 Google 로그인.
 * intent=signup 이라 미등록 이메일도 GUEST 행을 만들고 `/signup?step=details`로 보낸다.
 * 로그인 화면의 Google 버튼은 이 함수를 타지 않는다 — 기존 회원만 들어오게 하기 위함.
 */
export async function signUpWithGoogle() { // 로그인 화면 Google 버튼은 이 함수를 타지 않는다.
    await setOAuthIntent("signup"); // 콜백이 미등록 이메일도 GUEST 행을 만든다. 로그인 버튼은 이 함수를 타지 않는다.
    await signIn("google", { redirectTo: "/signup?step=details" }); // User 행은 이 액션이 아니라 Google 콜백이 만든다.
}

/**
 * ENABLE_DEV_LOGIN일 때만 통과하는 @test.local Credentials 로그인.
 *
 * @param formData name=email. parseDevTestEmail이 도메인·형식을 한 번 더 막는다.
 * 프로덕션에서 플래그가 꺼져 있으면 그냥 `/login`으로 보낸다 (에러 문구를 안 줘서 존재를 숨김).
 */
export async function signInAsTestUser(formData: FormData) { // Google OAuth가 아니다. 플래그 off면 존재를 숨긴다.
    if (!isDevLoginEnabled()) redirect("/login"); // 운영에서 플래그 off면 에러 문구 없이 존재를 숨긴다.

    const email = parseDevTestEmail(formData.get("email")); // @test.local만. 형식 불량은 아래에서 CredentialsSignin으로 일반화.
    if (!email) redirect("/login?error=CredentialsSignin"); // 원인을 숨겨 개발 로그인 표면을 좁힌다.

    try { // AuthError만 /login으로. NEXT_REDIRECT는 성공 경로라 다시 던진다.
        await signIn(DEV_LOGIN_PROVIDER_ID, { // 비밀번호 없이 이메일만. 개발 프로바이더 전제.
            email, // 비밀번호 없이 이메일만. 개발 프로바이더 전제.
            redirectTo: "/post-login", // Google과 같이 역할 홈·온보딩 분기.
        });
    } catch (error) { // AuthError만 일반화. 그 외(리다이렉트)는 그대로 올린다.
        if (error instanceof AuthError) { // 어떤 @test.local이 있는지는 드러내지 않는다.
            redirect("/login?error=CredentialsSignin"); // 실패 원인 일반화. 어떤 이메일이 있는지 드러내지 않는다.
        }
        throw error; // NEXT_REDIRECT는 성공 경로이므로 AuthError가 아니면 다시 던진다.
    }
}
