import "server-only";

/**
 * Google ID 토큰 검증. Flutter `google_sign_in`이 준 JWT만 받는다.
 *
 * 호출: `app/api/mobile/auth/google`.
 * JWKS는 Google 공개 인증서. `aud`는 웹·iOS·Android 클라이언트 ID.
 *
 * 의도적으로 하지 않는 일:
 * - access token / AUTH_GOOGLE_SECRET으로 검증하지 않는다.
 * - 이메일 미인증 토큰을 받지 않는다.
 *
 * 관련: `lib/google-account.ts`, `.env.example` AUTH_GOOGLE_*.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export type GoogleIdProfile = {
    email: string;
    name: string | null;
    imageUrl: string | null;
    providerAccountId: string;
};

export async function verifyGoogleIdToken(
    idToken: string,
): Promise<GoogleIdProfile | null> {
    const audiences = googleAudiences();
    if (audiences.length === 0) return null;

    try {
        const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
            issuer: ["https://accounts.google.com", "accounts.google.com"],
            audience: audiences,
        });

        const email =
            typeof payload.email === "string"
                ? payload.email.trim().toLowerCase()
                : "";
        const verified =
            payload.email_verified === true ||
            payload.email_verified === "true";
        const sub = typeof payload.sub === "string" ? payload.sub : "";

        if (!email || !verified || !sub) return null;

        return {
            email,
            name: typeof payload.name === "string" ? payload.name.trim() : null,
            imageUrl:
                typeof payload.picture === "string" ? payload.picture : null,
            providerAccountId: sub,
        };
    } catch {
        return null;
    }
}

function googleAudiences() {
    return [
        process.env.AUTH_GOOGLE_ID,
        process.env.AUTH_GOOGLE_IOS_ID,
        process.env.AUTH_GOOGLE_ANDROID_ID,
    ].filter((value): value is string => Boolean(value?.trim()));
}
