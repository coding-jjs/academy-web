import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { confirmTossPayment } from "@/lib/toss-server";
import styles from "../ParentPaymentsScreen.module.css";

export const dynamic = "force-dynamic";

type ConfirmResult =
    | { ok: true; message: string; invoiceId: string }
    | { ok: false; message: string; invoiceId: string | null };

async function finalizePayment(input: {
    parentUserId: string;
    paymentKey: string;
    orderId: string;
    amount: number;
}): Promise<ConfirmResult> {
    const payment = await prisma.payment.findFirst({
        where: {
            orderId: input.orderId,
            payerUserId: input.parentUserId,
        },
        select: {
            id: true,
            invoiceId: true,
            amount: true,
            status: true,
            invoice: {
                select: { id: true, status: true },
            },
        },
    });

    if (!payment) {
        return {
            ok: false,
            message: "결제 내역을 찾을 수 없습니다.",
            invoiceId: null,
        };
    }

    if (payment.status === "SUCCEEDED") {
        return {
            ok: true,
            message: "이미 완료된 결제입니다.",
            invoiceId: payment.invoiceId,
        };
    }

    if (payment.status !== "PENDING") {
        return {
            ok: false,
            message: `결제 상태(${payment.status})에서는 승인할 수 없습니다.`,
            invoiceId: payment.invoiceId,
        };
    }

    const invoiceStatus = payment.invoice.status;
    if (invoiceStatus !== "ISSUED" && invoiceStatus !== "OVERDUE") {
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "CANCELLED",
                failureCode: "INVOICE_NOT_PAYABLE",
                failureMessage: `청구서 상태(${invoiceStatus})에서는 결제할 수 없습니다.`,
                cancelledAt: new Date(),
            },
        });

        return {
            ok: false,
            message:
                invoiceStatus === "CANCELLED"
                    ? "취소된 청구서입니다. 결제를 완료할 수 없습니다."
                    : "결제 가능한 청구서 상태가 아닙니다.",
            invoiceId: payment.invoiceId,
        };
    }

    // 콜백 amount와 DB 금액이 다르면 confirm하지 않음 (토스 권장: 서버 저장 금액 기준)
    if (payment.amount !== input.amount) {
        return {
            ok: false,
            message:
                "결제 금액이 청구 금액과 다릅니다. 결제 목록에서 다시 시도해 주세요.",
            invoiceId: payment.invoiceId,
        };
    }

    const confirmed = await confirmTossPayment({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: payment.amount,
    });

    if (!confirmed.ok) {
        const message =
            typeof confirmed.rawPayload?.message === "string"
                ? confirmed.rawPayload.message
                : "토스 결제 승인에 실패했습니다.";

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "FAILED",
                failureCode: "CONFIRM_FAILED",
                failureMessage: message,
                rawPayload: confirmed.rawPayload ?? {},
            },
        });

        return {
            ok: false,
            message,
            invoiceId: payment.invoiceId,
        };
    }

    const raw = confirmed.rawPayload as {
        method?: string;
        approvedAt?: string;
    };

    const approvedAt = raw.approvedAt ? new Date(raw.approvedAt) : new Date();

    await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: "SUCCEEDED",
                paymentKey: input.paymentKey,
                method: raw.method ?? null,
                approvedAt,
                failureCode: null,
                failureMessage: null,
                rawPayload: confirmed.rawPayload ?? {},
            },
        }),
        prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: {
                status: "PAID",
                paidAt: approvedAt,
            },
        }),
    ]);

    return {
        ok: true,
        message: "결제가 완료되었습니다.",
        invoiceId: payment.invoiceId,
    };
}

export default async function ParentPaymentSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{
        invoiceId?: string;
        paymentKey?: string;
        orderId?: string;
        amount?: string;
    }>;
}) {
    const session = await requireRole("PARENT");

    const params = await searchParams;
    const paymentKey = params.paymentKey?.trim() || "";
    const orderId = params.orderId?.trim() || "";
    const amountRaw = params.amount?.trim() || "";
    const amount = Number(amountRaw);

    let result: ConfirmResult;

    if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
        result = {
            ok: false,
            message:
                "결제 승인에 필요한 정보가 없습니다. 결제 목록에서 상태를 확인해 주세요.",
            invoiceId: params.invoiceId?.trim() || null,
        };
    } else {
        try {
            result = await finalizePayment({
                parentUserId: session.user.id,
                paymentKey,
                orderId,
                amount,
            });
        } catch (error) {
            result = {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "결제 승인 처리 중 오류가 발생했습니다.",
                invoiceId: params.invoiceId?.trim() || null,
            };
        }
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>PAYMENTS</span>
                    <h1>{result.ok ? "결제 완료" : "결제 확인 실패"}</h1>
                    <p>
                        {result.ok
                            ? "수강료 결제가 정상 처리되었습니다."
                            : "승인을 완료하지 못했습니다."}
                    </p>
                </div>
            </header>

            <div className={styles.empty}>
                <h2>{result.ok ? "감사합니다" : "처리에 실패했습니다"}</h2>
                <p
                    className={result.ok ? styles.hint : styles.error}
                    role="alert"
                >
                    {result.message}
                </p>
                {orderId ? (
                    <p className={styles.muted}>주문번호: {orderId}</p>
                ) : null}
                <p style={{ marginTop: 20 }}>
                    <Link href="/parent/payments" className={styles.primaryBtn}>
                        결제 목록으로
                    </Link>
                </p>
            </div>
        </section>
    );
}
