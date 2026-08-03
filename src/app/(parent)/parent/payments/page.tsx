import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncOverdueInvoices } from "@/lib/billing-actions";
import ParentPaymentsScreen from "./ParentPaymentsScreen";
import type {
    InvoiceStatus,
    ParentInvoice,
} from "./ParentPaymentsScreen";

export const dynamic = "force-dynamic";

type InvoiceItem = {
    name?: string;
    amount?: number;
};

function parseItems(items: unknown): { name: string; amount: number }[] {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as InvoiceItem;
            if (typeof row.name !== "string") return null;
            return {
                name: row.name,
                amount: typeof row.amount === "number" ? row.amount : 0,
            };
        })
        .filter((item): item is { name: string; amount: number } =>
            Boolean(item),
        );
}

export default async function ParentPaymentsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

    await syncOverdueInvoices();

    const invoices = await prisma.invoice.findMany({
        where: {
            parentUserId: session.user.id,
            status: { in: ["ISSUED", "OVERDUE", "PAID", "CANCELLED"] },
        },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        select: {
            id: true,
            title: true,
            items: true,
            totalAmount: true,
            status: true,
            dueDate: true,
            issuedAt: true,
            paidAt: true,
            student: {
                select: { id: true, name: true },
            },
            payments: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    orderId: true,
                    status: true,
                    method: true,
                    approvedAt: true,
                    failureMessage: true,
                },
            },
        },
    });

    const list: ParentInvoice[] = invoices.map((inv) => ({
        id: inv.id,
        title: inv.title,
        items: parseItems(inv.items),
        totalAmount: inv.totalAmount,
        status: inv.status as InvoiceStatus,
        dueDate: inv.dueDate.toISOString(),
        issuedAt: inv.issuedAt?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        studentId: inv.student.id,
        studentName: inv.student.name,
        latestPayment: inv.payments[0]
            ? {
                  id: inv.payments[0].id,
                  orderId: inv.payments[0].orderId,
                  status: inv.payments[0].status,
                  method: inv.payments[0].method,
                  approvedAt: inv.payments[0].approvedAt?.toISOString() ?? null,
                  failureMessage: inv.payments[0].failureMessage,
              }
            : null,
    }));

    const payable = list.filter(
        (inv) => inv.status === "ISSUED" || inv.status === "OVERDUE",
    );
    const history = list.filter(
        (inv) => inv.status === "PAID" || inv.status === "CANCELLED",
    );

    return (
        <ParentPaymentsScreen
            payable={payable}
            history={history}
            tossReady={Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY)}
        />
    );
}