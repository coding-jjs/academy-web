"use client";

/**
 * 학부모 청구 목록 + 토스 결제 UI 초안 (클라이언트).
 *
 * `/parent/payments` page가 이 Screen을 연결하지 않는다. 준비 중 카피만 보여 준다.
 * 연결되더라도 제출은 preventDefault + "온라인 결제는 준비 중인 기능입니다."
 * Toss 승인·정산 Server Action이 없다.
 *
 * props: payable, history — billing parent-types. 현재 page 데이터 로더도 없다.
 */

import { useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import type { ParentInvoice } from "@/features/billing/parent-types";
import {
    formatInvoiceAmount,
    formatInvoiceDate,
    PARENT_INVOICE_STATUS_METADATA,
} from "@/features/billing/presentation";
import styles from "./ParentPaymentsScreen.module.css";

const statusMeta = PARENT_INVOICE_STATUS_METADATA;
const UNAVAILABLE_MESSAGE = "온라인 결제는 준비 중인 기능입니다.";

/** 청구 선택·가짜 토스 버튼·이력을 그린다. 실제 결제는 막혀 있다. */
export default function ParentPaymentsScreen({
    payable,
    history,
}: {
    payable: ParentInvoice[];
    history: ParentInvoice[];
}) {
    const [selectedId, setSelectedId] = useState(payable[0]?.id ?? "");
    const [message, setMessage] = useState("");

    const selected =
        payable.find((inv) => inv.id === selectedId) ?? payable[0] ?? null;

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>PAYMENTS</span>
                    <h1>결제</h1>
                    <p>수강료와 교재비 청구 내역을 확인하고 결제합니다.</p>
                </div>
            </header>
            {selected ? (
                <div className={styles.hero}>
                    <StatusChip tone={statusMeta[selected.status].tone}>
                        {statusMeta[selected.status].label}
                    </StatusChip>
                    <h2>{selected.title}</h2>
                    <p className={styles.amount}>
                        {formatInvoiceAmount(selected.totalAmount)}
                    </p>
                    <p>
                        {selected.studentName} · 납기
                        {formatInvoiceDate(selected.dueDate)}
                    </p>
                    <form
                        className={styles.payForm}
                        onSubmit={(event) => {
                            event.preventDefault();
                            setMessage(UNAVAILABLE_MESSAGE);
                        }}
                    >
                        <button type="submit" className={styles.primaryBtn}>
                            토스로 결제하기
                        </button>
                    </form>
                    {message ? (
                        <p className={styles.error} role="alert">
                            {message}
                        </p>
                    ) : null}
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
                                            {inv.studentName} · 납기
                                            {formatInvoiceDate(inv.dueDate)}
                                        </span>
                                    </div>
                                    <div className={styles.rowRight}>
                                        <strong>
                                            {formatInvoiceAmount(inv.totalAmount)}
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
                                            ? ` · ${formatInvoiceDate(inv.paidAt)}`
                                            : ""}
                                    </span>
                                </div>
                                <div className={styles.rowRight}>
                                    <strong>
                                        {formatInvoiceAmount(inv.totalAmount)}
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
