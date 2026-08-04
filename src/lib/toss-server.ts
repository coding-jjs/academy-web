import "server-only";

export function getTossSecretKey() {
    const key = process.env.TOSS_SECRET_KEY?.trim();
    if (!key) {
        throw new Error("TOSS_SECRET_KEY가 없습니다.");
    }
    return key;
}

/**
 * successUrl 콜백 → 서버에서 호출
 * POST https://api.tosspayments.com/v1/payments/confirm
 */
export async function confirmTossPayment(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
}) {
    const secret = getTossSecretKey();
    const auth = Buffer.from(`${secret}:`).toString("base64");

    const res = await fetch(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
        },
    );

    const rawPayload = await res.json();
    if (!res.ok) {
        return {
            ok: false as const,
            status: res.status,
            rawPayload,
        };
    }

    return {
        ok: true as const,
        status: res.status,
        rawPayload,
    };
}
