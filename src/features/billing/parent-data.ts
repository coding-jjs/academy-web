import "server-only";

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import { syncOverdueInvoices } from "@/features/billing/overdue";
import type {
    InvoiceStatus,
    ParentInvoice,
    ParentPaymentsData,
} from "@/features/billing/parent-types";

const parentInvoiceSelection = {
    id: true,
    title: true,
    items: true,
    totalAmount: true,
    status: true,
    dueDate: true,
    issuedAt: true,
    paidAt: true,
    student: { select: { id: true, name: true } },
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
} satisfies Prisma.InvoiceSelect;

type ParentInvoiceRecord = Prisma.InvoiceGetPayload<{
    select: typeof parentInvoiceSelection;
}>;

export async function getParentPaymentsData(
    parentUserId: string,
): Promise<ParentPaymentsData> {
    await syncOverdueInvoices();
    const invoices = await prisma.invoice.findMany({
        where: {
            parentUserId,
            status: { in: ["ISSUED", "OVERDUE", "PAID", "CANCELLED"] },
        },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        select: parentInvoiceSelection,
    });
    const list = invoices.map(mapParentInvoice);
    return {
        payable: list.filter(
            (invoice) =>
                invoice.status === "ISSUED" || invoice.status === "OVERDUE",
        ),
        history: list.filter(
            (invoice) =>
                invoice.status === "PAID" || invoice.status === "CANCELLED",
        ),
    };
}

function mapParentInvoice(invoice: ParentInvoiceRecord): ParentInvoice {
    const latestPayment = invoice.payments[0];
    return {
        id: invoice.id,
        title: invoice.title,
        items: parseInvoiceItems(invoice.items),
        totalAmount: invoice.totalAmount,
        status: invoice.status as InvoiceStatus,
        dueDate: invoice.dueDate.toISOString(),
        issuedAt: invoice.issuedAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        studentId: invoice.student.id,
        studentName: invoice.student.name,
        latestPayment: latestPayment
            ? {
                  id: latestPayment.id,
                  orderId: latestPayment.orderId,
                  status: latestPayment.status,
                  method: latestPayment.method,
                  approvedAt: latestPayment.approvedAt?.toISOString() ?? null,
                  failureMessage: latestPayment.failureMessage,
              }
            : null,
    };
}

function parseInvoiceItems(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as { name?: unknown; amount?: unknown };
            if (typeof row.name !== "string") return null;
            return {
                name: row.name,
                amount: typeof row.amount === "number" ? row.amount : 0,
            };
        })
        .filter(
            (item): item is { name: string; amount: number } => Boolean(item),
        );
}
