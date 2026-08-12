import type { AppRole } from "@/types/roles";

export const DEV_LOGIN_PROVIDER_ID = "dev-login";

export const DEV_LOGIN_ROLES = [
    "DIRECTOR",
    "TEACHER",
    "STAFF",
    "PARENT",
    "STUDENT",
    "GUEST",
] as const satisfies readonly AppRole[];

export function isDevLoginEnabled() {
    return (
        process.env.NODE_ENV === "development" &&
        process.env.ENABLE_DEV_LOGIN === "true"
    );
}

export function parseDevTestEmail(value: unknown) {
    if (typeof value !== "string") return null;

    const email = value.trim().toLowerCase();
    return /^[a-z0-9._+-]+@test\.local$/.test(email) ? email : null;
}
