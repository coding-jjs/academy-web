import { redirect } from "next/navigation";
import type { AppRole } from "@/types/roles";
import { getUsableAccount } from "@/lib/account-access";
import { auth } from "@/lib/auth";

export async function requireRole(...roles: AppRole[]) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const account = await getUsableAccount(session.user.id);
    if (!account) {
        redirect("/login");
    }

    if (!roles.includes(account.role)) {
        redirect("/post-login");
    }

    return {
        ...session,
        user: {
            ...session.user,
            id: account.id,
            role: account.role,
            onboardingCompleted: account.onboardingCompleted,
        },
    };
}
