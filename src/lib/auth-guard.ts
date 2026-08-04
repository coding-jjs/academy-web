import { redirect } from "next/navigation";
import type { AppRole } from "@/types/roles";
import { auth } from "@/lib/auth";

export async function requireRole(...roles: AppRole[]) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    if (!roles.includes(session.user.role)) {
        redirect("/post-login");
    }

    return session;
}
