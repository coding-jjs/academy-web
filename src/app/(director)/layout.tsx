import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { requireRole } from "@/lib/auth-guard";

export default async function DirectorLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireRole("DIRECTOR");
    return <AdminShell role="director">{children}</AdminShell>;
}
