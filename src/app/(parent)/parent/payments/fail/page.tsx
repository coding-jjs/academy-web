import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import styles from "../ParentPaymentsScreen.module.css";

export const dynamic = "force-dynamic";

export default async function ParentPaymentFailPage({
    searchParams,
}: {
    searchParams: Promise<{
        invoiceId?: string;
        orderId?: string;
        code?: string;
        message?: string;
    }>;
}) {
    const session = await requireRole("PARENT");

    const params = await searchParams;
    const orderId = params.orderId?.trim() || "";
    const invoiceId = params.invoiceId?.trim() || "";
    const failCode = params.code?.trim() || "";
    const failMessage =
        params.message?.trim() ||
        "결제가 취소되었거나 완료되지 않았습니다.";

    if (orderId) {
        await prisma.payment.updateMany({
            where: {
                orderId,
                payerUserId: session.user.id,
                status: "PENDING",
            },
            data: {
                status: "FAILED",
                failureCode: failCode || null,
                failureMessage: failMessage,
            },
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>PAYMENTS</span>
                    <h1>결제 실패</h1>
                    <p>결제를 완료하지 못했습니다. 다시 시도해 주세요.</p>
                </div>
            </header>

            <div className={styles.empty}>
                <h2>결제가 완료되지 않았습니다</h2>
                <p className={styles.error} role="alert">
                    {failMessage}
                </p>
                {failCode ? (
                    <p className={styles.muted}>오류 코드: {failCode}</p>
                ) : null}
                {orderId ? (
                    <p className={styles.muted}>주문번호: {orderId}</p>
                ) : null}
                <p style={{ marginTop: 20 }}>
                    <Link href="/parent/payments" className={styles.primaryBtn}>
                        결제 목록으로
                    </Link>
                    {invoiceId ? (
                        <>
                            {" "}
                            <Link
                                href={`/parent/payments?invoiceId=${invoiceId}`}
                                className={styles.muted}
                            >
                                같은 청구서 다시 보기
                            </Link>
                        </>
                    ) : null}
                </p>
            </div>
        </section>
    );
}
