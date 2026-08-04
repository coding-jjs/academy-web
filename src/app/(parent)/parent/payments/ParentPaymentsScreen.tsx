"use client";

import { useActionState, useEffect, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { requestTossPayment } from "@/lib/toss-client";
import { prepareTossCheckout, type CheckoutState } from "./actions";
import styles from "./ParentPaymentsScreen.module.css";

export type InvoiceStatus =
    | "DRAFT"
    | "ISSUED"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";

export type ParentInvoice = {
    id: string;
    title: string;
    items: { name: string; amount: number }[];
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

const statusMeta: Record<
    InvoiceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    DRAFT: { label: "작성중", tone: "neutral" },
    ISSUED: { label: "결제 대기", tone: "warning" },
    OVERDUE: { label: "미납", tone: "danger" },
    PAID: { label: "완료", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

const initialCheckout: CheckoutState = {
    status: "idle",
    message: "",
    checkout: null,
};

function formatAmount(amount: number) {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));
}

export default function ParentPaymentsScreen({
    payable,
    history,
    tossReady,
}: {
    payable: ParentInvoice[];
    history: ParentInvoice[];
    tossReady: boolean;
}) {
    const [selectedId, setSelectedId] = useState(payable[0]?.id ?? "");
    const [state, formAction, pending] = useActionState(
        prepareTossCheckout,
        initialCheckout,
    );
    const [payError, setPayError] = useState("");

    const selected =
        payable.find((inv) => inv.id === selectedId) ?? payable[0] ?? null;

    useEffect(() => {
        if (state.status !== "ready" || !state.checkout) return;

        let cancelled = false;
        (async () => {
            try {
                setPayError("");
                await requestTossPayment(state.checkout!);
            } catch (error) {
                if (cancelled) return;
                setPayError(
                    error instanceof Error
                        ? error.message
                        : "결제창을 열지 못했습니다.",
                );
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [state]);

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>PAYMENTS</span>
                    <h1>결제</h1>
                    <p>수강료와 교재비 청구 내역을 확인하고 결제합니다.</p>
                </div>
                {!tossReady && (
                    <StatusChip tone="warning">토스 키 미설정</StatusChip>
                )}
            </header>

            {selected ? (
                <div className={styles.hero}>
                    <StatusChip tone={statusMeta[selected.status].tone}>
                        {statusMeta[selected.status].label}
                    </StatusChip>
                    <h2>{selected.title}</h2>
                    <p className={styles.amount}>
                        {formatAmount(selected.totalAmount)}
                    </p>
                    <p>
                        {selected.studentName} · 납기{" "}
                        {formatDate(selected.dueDate)}
                    </p>

                    <form action={formAction} className={styles.payForm}>
                        <input
                            type="hidden"
                            name="invoiceId"
                            value={selected.id}
                        />
                        <button
                            type="submit"
                            className={styles.primaryBtn}
                            disabled={pending || !tossReady}
                        >
                            {pending ? "준비 중…" : "토스로 결제하기"}
                        </button>
                    </form>

                    {(state.message || payError) && (
                        <p
                            className={
                                state.status === "error" || payError
                                    ? styles.error
                                    : styles.hint
                            }
                            role="alert"
                        >
                            {payError || state.message}
                        </p>
                    )}
                </div>
            ) : (
                <div className={styles.empty}>
                    <h2>결제할 청구서가 없습니다</h2>
                    <p>학원에서 청구서를 발행하면 이곳에 표시됩니다.</p>
                </div>
            )}

            {payable.length > 1 && (
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>결제 대기</h2>
                        <StatusChip tone="warning">
                            {payable.length}건
                        </StatusChip>
                    </div>
                    <ul className={styles.list}>
                        {payable.map((inv) => (
                            <li key={inv.id}>
                                <button
                                    type="button"
                                    className={
                                        inv.id === selected?.id
                                            ? styles.rowActive
                                            : styles.row
                                    }
                                    onClick={() => setSelectedId(inv.id)}
                                >
                                    <div>
                                        <strong>{inv.title}</strong>
                                        <span>
                                            {inv.studentName} · 납기{" "}
                                            {formatDate(inv.dueDate)}
                                        </span>
                                    </div>
                                    <div className={styles.rowRight}>
                                        <strong>
                                            {formatAmount(inv.totalAmount)}
                                        </strong>
                                        <StatusChip
                                            tone={statusMeta[inv.status].tone}
                                        >
                                            {statusMeta[inv.status].label}
                                        </StatusChip>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </article>
            )}

            <article className={styles.panel}>
                <div className={styles.panelHead}>
                    <h2>납부 내역</h2>
                    <StatusChip>{history.length}건</StatusChip>
                </div>
                {history.length === 0 ? (
                    <p className={styles.muted}>납부 내역이 없습니다.</p>
                ) : (
                    <ul className={styles.list}>
                        {history.map((inv) => (
                            <li key={inv.id} className={styles.historyItem}>
                                <div>
                                    <strong>{inv.title}</strong>
                                    <span>
                                        {inv.studentName}
                                        {inv.paidAt
                                            ? ` · ${formatDate(inv.paidAt)}`
                                            : ""}
                                    </span>
                                </div>
                                <div className={styles.rowRight}>
                                    <strong>
                                        {formatAmount(inv.totalAmount)}
                                    </strong>
                                    <StatusChip
                                        tone={statusMeta[inv.status].tone}
                                    >
                                        {statusMeta[inv.status].label}
                                    </StatusChip>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </article>
        </section>
    );
}