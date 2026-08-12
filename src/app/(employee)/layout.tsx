import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { requireRole } from "@/lib/auth-guard";

export default async function EmployeeLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireRole("STAFF");
    return <AdminShell role="employee">{children}</AdminShell>;
}
