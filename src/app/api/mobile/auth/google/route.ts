/**
 * `POST /api/mobile/auth/google`. 앱 Google 로그인.
 *
 * body: `{ idToken, intent?: "login" | "signup" }`.
 * intent 기본값은 login — 웹 `/login`과 같이 미가입이면 계정을 만들지 않는다.
 * signup은 웹 `/signup`과 같이 없으면 GUEST를 만든다.
 *
 * 성공 시 개발 로그인과 같은 Bearer. GUEST도 200 — 앱이 대기 화면을 그린다.
 *
 * 의도적으로 하지 않는 일:
 * - 쿠키 세션을 심지 않는다.
 * - Google secret으로 토큰을 검증하지 않는다.
 *
 * 관련: `lib/google-id-token.ts`, `lib/google-account.ts`, `lib/mobile-auth.ts`.
 */

import { completeGoogleAccount } from "@/lib/google-account";
import { verifyGoogleIdToken } from "@/lib/google-id-token";
import { signMobileToken } from "@/lib/mobile-auth";
import type { OAuthIntent } from "@/lib/oauth-intent";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const idToken =
        body && typeof body === "object" && "idToken" in body
            ? String(body.idToken).trim()
            : "";
    if (!idToken) {
        return Response.json(
            {
                error: "INVALID_REQUEST",
                message: "Google 로그인이 필요합니다.",
            },
            { status: 400 },
        );
    }

    const intent = readIntent(body);
    const profile = await verifyGoogleIdToken(idToken);
    if (!profile) {
        return Response.json(
            { error: "INVALID_TOKEN", message: "Google 로그인이 필요합니다." },
            { status: 401 },
        );
    }

    const result = await completeGoogleAccount({
        ...profile,
        intent,
    });

    if (!result.ok) {
        if (result.code === "UNREGISTERED") {
            return Response.json(
                {
                    error: "UNREGISTERED",
                    message:
                        "가입된 계정이 아닙니다. 회원가입을 진행해 주세요.",
                },
                { status: 404 },
            );
        }
        if (result.code === "BLOCKED") {
            return Response.json(
                { error: "BLOCKED", message: "사용할 수 없는 계정입니다." },
                { status: 403 },
            );
        }
        return Response.json(
            { error: "ACCOUNT_MISMATCH", message: "로그인에 실패했습니다." },
            { status: 409 },
        );
    }

    const token = await signMobileToken(result.user);
    return Response.json({ token, user: result.user });
}

function readIntent(body: unknown): OAuthIntent {
    if (!body || typeof body !== "object" || !("intent" in body)) {
        return "login";
    }
    return body.intent === "signup" ? "signup" : "login";
}
