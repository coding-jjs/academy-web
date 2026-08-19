"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import {
    DEV_LOGIN_PROVIDER_ID,
    isDevLoginEnabled,
    parseDevTestEmail,
} from "@/lib/dev-login";
import { setOAuthIntent } from "@/lib/oauth-intent";

export async function signInWithGoogle() {
    await setOAuthIntent("login");
    await signIn("google", { redirectTo: "/post-login" });
}

export async function signUpWithGoogle() {
    await setOAuthIntent("signup");
    await signIn("google", { redirectTo: "/signup?step=details" });
}

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
