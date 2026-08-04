"use client";

import {
    ANONYMOUS,
    loadTossPayments,
} from "@tosspayments/tosspayments-sdk";
import type { TossCheckoutPayload } from "@/lib/toss";

/**
 * 브라우저에서 토스 결제창을 엽니다.
 * 성공/실패 시 successUrl / failUrl 로 리다이렉트됩니다.
 */
export async function requestTossPayment(payload: TossCheckoutPayload) {
    if (typeof window === "undefined") {
        throw new Error("결제창은 브라우저에서만 열 수 있습니다.");
    }

    if (!payload.clientKey?.trim()) {
        throw new Error("토스 클라이언트 키가 없습니다.");
    }
    if (!payload.orderId?.trim()) {
        throw new Error("주문번호가 없습니다.");
    }
    if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
        throw new Error("결제 금액이 올바르지 않습니다.");
    }

    const tossPayments = await loadTossPayments(payload.clientKey);
    const payment = tossPayments.payment({
        customerKey: ANONYMOUS,
    });

    await payment.requestPayment({
        method: "CARD",
        amount: {
            currency: "KRW",
            value: payload.amount,
        },
        orderId: payload.orderId,
        orderName: payload.orderName,
        successUrl: payload.successUrl,
        failUrl: payload.failUrl,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail ?? undefined,
    });
}