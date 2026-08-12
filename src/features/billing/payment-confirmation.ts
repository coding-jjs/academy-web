import "server-only";

import { prisma } from "@/lib/db";
import { confirmTossPayment } from "@/lib/toss-server";
import type { PaymentConfirmationResult } from "@/features/billing/parent-types";

export async function confirmParentPayment(input: {
    parentUserId: string;
    paymentKey: string;
    orderId: string;
    amount: number;
}): Promise<PaymentConfirmationResult> {
    const payment = await prisma.payment.findFirst({
        where: { orderId: input.orderId, payerUserId: input.parentUserId },
        select: {
            id: true,
            invoiceId: true,
            amount: true,
            status: true,
            invoice: { select: { status: true } },
        },
    });
    if (!payment) {
        return { ok: false, message: "결제 내역을 찾을 수 없습니다.", invoiceId: null };
    }
    if (payment.status === "SUCCEEDED") {
        return { ok: true, message: "이미 완료된 결제입니다.", invoiceId: payment.invoiceId };
    }
    if (payment.status !== "PENDING") {
        return { ok: false, message: `결제 상태(${payment.status})에서는 승인할 수 없습니다.`, invoiceId: payment.invoiceId };
    }
    if (payment.invoice.status !== "ISSUED" && payment.invoice.status !== "OVERDUE") {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "CANCELLED", failureCode: "INVOICE_NOT_PAYABLE", failureMessage: `청구서 상태(${payment.invoice.status})에서는 결제할 수 없습니다.`, cancelledAt: new Date() } });
        return { ok: false, message: payment.invoice.status === "CANCELLED" ? "취소된 청구서입니다. 결제를 완료할 수 없습니다." : "결제 가능한 청구서 상태가 아닙니다.", invoiceId: payment.invoiceId };
    }
    if (payment.amount !== input.amount) {
        return { ok: false, message: "결제 금액이 청구 금액과 다릅니다. 결제 목록에서 다시 시도해 주세요.", invoiceId: payment.invoiceId };
    }
    const confirmed = await confirmTossPayment({ paymentKey: input.paymentKey, orderId: input.orderId, amount: payment.amount });
    if (!confirmed.ok) {
        const message = typeof confirmed.rawPayload?.message === "string" ? confirmed.rawPayload.message : "토스 결제 승인에 실패했습니다.";
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureCode: "CONFIRM_FAILED", failureMessage: message, rawPayload: confirmed.rawPayload ?? {} } });
        return { ok: false, message, invoiceId: payment.invoiceId };
    }
    const payload = confirmed.rawPayload as { method?: string; approvedAt?: string };
    const approvedAt = payload.approvedAt ? new Date(payload.approvedAt) : new Date();
    await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", paymentKey: input.paymentKey, method: payload.method ?? null, approvedAt, failureCode: null, failureMessage: null, rawPayload: confirmed.rawPayload ?? {} } }),
        prisma.invoice.update({ where: { id: payment.invoiceId }, data: { status: "PAID", paidAt: approvedAt } }),
    ]);
    return { ok: true, message: "결제가 완료되었습니다.", invoiceId: payment.invoiceId };
}

export async function recordParentPaymentFailure(input: {
    parentUserId: string;
    orderId: string;
    failureCode: string;
    failureMessage: string;
}) {
    if (!input.orderId) return;
    await prisma.payment.updateMany({
        where: { orderId: input.orderId, payerUserId: input.parentUserId, status: "PENDING" },
        data: { status: "FAILED", failureCode: input.failureCode || null, failureMessage: input.failureMessage },
    });
}
