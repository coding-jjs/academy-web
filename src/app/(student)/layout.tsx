import type { ReactNode } from "react";
import MemberShell from "@/components/layout/MemberShell";
import { requireRole } from "@/lib/auth-guard";

export default async function StudentLayout({ children }: { children: ReactNode }) {
    const session = await requireRole("STUDENT");
    return (
        <MemberShell role="student" userName={session.user.name}>
            {children}
        </MemberShell>
    );
}
