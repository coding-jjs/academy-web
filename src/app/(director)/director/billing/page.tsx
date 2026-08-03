import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncOverdueInvoices } from "@/lib/billing-actions";
import BillingManagementScreen from "@/features/billing/BillingManagementScreen";
import type {
    BillingInvoiceRow,
    BillingStudentOption,
    InvoiceStatus,
} from "@/features/billing/BillingManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorBillingPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "DIRECTOR") redirect("/post-login");

    await syncOverdueInvoices();

    const [studentsRaw, invoicesRaw] = await Promise.all([
        prisma.student.findMany({
            where: { status: "ENROLLED" },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                parentLinks: {
                    where: { endedAt: null },
                    orderBy: { linkedAt: "desc" },
                    take: 1,
                    select: {
                        parentUserId: true,
                        parent: { select: { name: true } },
                    },
                },
                enrollments: {
                    where: { endedAt: null, status: "ACTIVE" },
                    take: 1,
                    select: { class: { select: { name: true } } },
                },
            },
        }),
        prisma.invoice.findMany({
            orderBy: [{ createdAt: "desc" }],
            take: 100,
            select: {
                id: true,
                title: true,
                totalAmount: true,
                status: true,
                dueDate: true,
                issuedAt: true,
                paidAt: true,
                student: { select: { name: true } },
                parent: { select: { name: true } },
            },
        }),
    ]);

    const students: BillingStudentOption[] = studentsRaw.map((s) => {
        const link = s.parentLinks[0];
        return {
            id: s.id,
            name: s.name,
            parentUserId: link?.parentUserId ?? null,
            parentName: link?.parent.name ?? null,
            className: s.enrollments[0]?.class.name ?? null,
        };
    });

    const invoices: BillingInvoiceRow[] = invoicesRaw.map((inv) => ({
        id: inv.id,
        title: inv.title,
        totalAmount: inv.totalAmount,
        status: inv.status as InvoiceStatus,
        dueDate: inv.dueDate.toISOString(),
        issuedAt: inv.issuedAt?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        studentName: inv.student.name,
        parentName: inv.parent.name,
    }));

    return (
        <BillingManagementScreen
            students={students}
            invoices={invoices}
            canManage
        />
    );
}