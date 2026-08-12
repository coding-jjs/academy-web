import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { requireRole } from "@/lib/auth-guard";

export default async function TeacherLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireRole("TEACHER");
    return <AdminShell role="teacher">{children}</AdminShell>;
}
