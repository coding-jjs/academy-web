import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { confirmParentPayment } from "@/features/billing/payment-confirmation";
import type { PaymentConfirmationResult } from "@/features/billing/parent-types";
import styles from "../ParentPaymentsScreen.module.css";

export const dynamic = "force-dynamic";

export default async function ParentPaymentSuccessPage({ searchParams }: { searchParams: Promise<{ invoiceId?: string; paymentKey?: string; orderId?: string; amount?: string }> }) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const paymentKey = params.paymentKey?.trim() || "";
    const orderId = params.orderId?.trim() || "";
    const amount = Number(params.amount?.trim() || "");
    let result: PaymentConfirmationResult;

    if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
        result = { ok: false, message: "결제 승인에 필요한 정보가 없습니다. 결제 목록에서 상태를 확인해 주세요.", invoiceId: params.invoiceId?.trim() || null };
    } else {
        try {
            result = await confirmParentPayment({ parentUserId: session.user.id, paymentKey, orderId, amount });
        } catch (error) {
            result = { ok: false, message: error instanceof Error ? error.message : "결제 승인 처리 중 오류가 발생했습니다.", invoiceId: params.invoiceId?.trim() || null };
        }
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}><div><span>PAYMENTS</span><h1>{result.ok ? "결제 완료" : "결제 확인 실패"}</h1><p>{result.ok ? "수강료 결제가 정상 처리되었습니다." : "승인을 완료하지 못했습니다."}</p></div></header>
            <div className={styles.empty}>
                <h2>{result.ok ? "감사합니다" : "처리에 실패했습니다"}</h2>
                <p className={result.ok ? styles.hint : styles.error} role="alert">{result.message}</p>
                {orderId ? <p className={styles.muted}>주문번호: {orderId}</p> : null}
                <p style={{ marginTop: 20 }}><Link href="/parent/payments" className={styles.primaryBtn}>결제 목록으로</Link></p>
            </div>
        </section>
    );
}
