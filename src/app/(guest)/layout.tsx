import type { ReactNode } from "react";
import MemberShell from "@/components/layout/MemberShell";
import { requireRole } from "@/lib/auth-guard";

export default async function GuestLayout({ children }: { children: ReactNode }) {
    const session = await requireRole("GUEST");
    return (
        <MemberShell role="guest" userName={session.user.name}>
            {children}
        </MemberShell>
    );
}
