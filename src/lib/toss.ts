/**
 * Toss 공통 타입·헬퍼 (서버/클라이언트 모두 import 가능)
 * - 시크릿/confirm → toss-server.ts
 * - 결제창 → toss-client.ts
 */

export type TossCheckoutPayload = {
    clientKey: string;
    orderId: string;
    orderName: string;
    amount: number;
    customerName: string;
    customerEmail?: string | null;
    successUrl: string;
    failUrl: string;
};

export function getTossClientKey() {
    const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim();
    if (!key) {
        throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY가 없습니다.");
    }
    return key;
}

export function buildAppUrl(path: string) {
    const base =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "http://localhost:3000";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 토스 orderId: 영문/숫자/-/_ 6~64자 */
export function createTossOrderId(invoiceId: string) {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `inv_${invoiceId.replace(/-/g, "").slice(0, 12)}_${stamp}_${rand}`;
}