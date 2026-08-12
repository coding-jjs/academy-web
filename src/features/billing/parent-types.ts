import type { InvoiceStatus } from "@/features/billing/types";

export type { InvoiceStatus } from "@/features/billing/types";

export type ParentInvoice = {
    id: string;
    title: string;
    items: Array<{ name: string; amount: number }>;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: string;
    issuedAt: string | null;
    paidAt: string | null;
    studentId: string;
    studentName: string;
    latestPayment: {
        id: string;
        orderId: string;
        status: string;
        method: string | null;
        approvedAt: string | null;
        failureMessage: string | null;
    } | null;
};

export type ParentPaymentsData = {
    payable: ParentInvoice[];
    history: ParentInvoice[];
};

export type PaymentConfirmationResult =
    | { ok: true; message: string; invoiceId: string }
    | { ok: false; message: string; invoiceId: string | null };
