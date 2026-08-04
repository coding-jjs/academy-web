import type { ReactNode } from "react";
import MemberShell from "@/components/layout/MemberShell";
import { requireRole } from "@/lib/auth-guard";

export default async function ParentLayout({ children }: { children: ReactNode }) {
    const session = await requireRole("PARENT");
    return (
        <MemberShell role="parent" userName={session.user.name}>
            {children}
        </MemberShell>
    );
}
