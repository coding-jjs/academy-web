export const PARENT_CHILD_COOKIE = "parent_child_id";

export function readParentChildCookie(cookieStore: {
    get: (name: string) => { value: string } | undefined;
}): string | undefined {
    return cookieStore.get(PARENT_CHILD_COOKIE)?.value;
}

export function writeParentChildCookie(childId: string) {
    document.cookie = `${PARENT_CHILD_COOKIE}=${encodeURIComponent(childId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
