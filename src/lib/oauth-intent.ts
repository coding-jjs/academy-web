import { cookies } from "next/headers";

export const OAUTH_INTENT_COOKIE = "oauth_intent";

export type OAuthIntent = "login" | "signup";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
    secure: process.env.NODE_ENV === "production",
};

export async function setOAuthIntent(intent: OAuthIntent) {
    const store = await cookies();
    store.set(OAUTH_INTENT_COOKIE, intent, cookieOptions);
}

export async function readOAuthIntent(): Promise<OAuthIntent | null> {
    const store = await cookies();
    const value = store.get(OAUTH_INTENT_COOKIE)?.value;
    return value === "login" || value === "signup" ? value : null;
}

export async function clearOAuthIntent() {
    const store = await cookies();
    store.delete({ name: OAUTH_INTENT_COOKIE, path: "/" });
}
