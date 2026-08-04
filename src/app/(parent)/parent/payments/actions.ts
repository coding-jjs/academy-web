"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    buildAppUrl,
    createTossOrderId,
    getTossClientKey,
    type TossCheckoutPayload,
} from "@/lib/toss";

export type CheckoutState = {
    status: "idle" | "error" | "ready";
    message: string;
    checkout: TossCheckoutPayload | null;
};

export async function prepareTossCheckout(
    _prev: CheckoutState,
    formData: FormData,
): Promise<CheckoutState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARENT") {
        return {
            status: "error",
            message: "학부모 로그인이 필요합니다.",
            checkout: null,
        };
    }

    const invoiceId = String(formData.get("invoiceId") ?? "").trim();
    if (!invoiceId) {
        return {
            status: "error",
            message: "청구서를 선택해 주세요.",
            checkout: null,
        };
    }

    const invoice = await prisma.invoice.findFirst({
        where: {
            id: invoiceId,
            parentUserId: session.user.id,
            status: { in: ["ISSUED", "OVERDUE"] },
        },
        select: {
            id: true,
            title: true,
            totalAmount: true,
            status: true,
            student: { select: { name: true } },
        },
    });

    if (!invoice) {
        return {
            status: "error",
            message: "결제 가능한 청구서를 찾을 수 없습니다.",
            checkout: null,
        };
    }

    if (invoice.totalAmount <= 0) {
        return {
            status: "error",
            message: "결제 금액이 올바르지 않습니다.",
            checkout: null,
        };
    }

    let clientKey: string;
    try {
        clientKey = getTossClientKey();
    } catch {
        return {
            status: "error",
            message:
                "토스 클라이언트 키가 없습니다. NEXT_PUBLIC_TOSS_CLIENT_KEY를 설정하세요.",
            checkout: null,
        };
    }

    const parentUserId = session.user.id;

    const orderId = await prisma.$transaction(async (tx) => {
        const pendings = await tx.payment.findMany({
            where: {
                invoiceId: invoice.id,
                payerUserId: parentUserId,
                status: "PENDING",
                provider: "TOSS",
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, orderId: true, amount: true },
        });

        const reusable = pendings.find((p) => p.amount === invoice.totalAmount);
        const obsoleteIds = pendings
            .filter((p) => p.id !== reusable?.id)
            .map((p) => p.id);

        if (obsoleteIds.length > 0) {
            await tx.payment.updateMany({
                where: { id: { in: obsoleteIds } },
                data: {
                    status: "CANCELLED",
                    failureCode: "SUPERSEDED",
                    failureMessage: "새 결제 시도로 대체됨",
                    cancelledAt: new Date(),
                },
            });
        }

        if (reusable) {
            return reusable.orderId;
        }

        const newOrderId = createTossOrderId(invoice.id);
        await tx.payment.create({
            data: {
                invoiceId: invoice.id,
                payerUserId: parentUserId,
                provider: "TOSS",
                orderId: newOrderId,
                amount: invoice.totalAmount,
                status: "PENDING",
            },
        });
        return newOrderId;
    });

    const checkout: TossCheckoutPayload = {
        clientKey,
        orderId,
        orderName: invoice.title,
        amount: invoice.totalAmount,
        customerName: session.user.name ?? invoice.student.name,
        customerEmail: session.user.email,
        successUrl: buildAppUrl(
            `/parent/payments/success?invoiceId=${invoice.id}`,
        ),
        failUrl: buildAppUrl(`/parent/payments/fail?invoiceId=${invoice.id}`),
    };

    return {
        status: "ready",
        message: "결제창을 준비했습니다.",
        checkout,
    };
}