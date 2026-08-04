"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    cancelInvoice,
    createInvoice,
    issueInvoice,
} from "@/features/billing/actions";
import styles from "./BillingManagementScreen.module.css";

export type InvoiceStatus =
    | "DRAFT"
    | "ISSUED"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";

export type BillingStudentOption = {
    id: string;
    name: string;
    parentName: string | null;
    parentUserId: string | null;
    className: string | null;
};

export type BillingInvoiceRow = {
    id: string;
    title: string;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: string;
    issuedAt: string | null;
    paidAt: string | null;
    studentName: string;
    parentName: string | null;
};

const statusMeta: Record<
    InvoiceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    DRAFT: { label: "초안", tone: "neutral" },
    ISSUED: { label: "발행", tone: "warning" },
    OVERDUE: { label: "연체", tone: "danger" },
    PAID: { label: "완납", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

function formatWon(amount: number) {
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

function defaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
}

export default function BillingManagementScreen({
    students,
    invoices,
    canManage,
    deniedMessage,
}: {
    students: BillingStudentOption[];
    invoices: BillingInvoiceRow[];
    canManage: boolean;
    deniedMessage?: string;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);

    const linkable = useMemo(
        () => students.filter((s) => s.parentUserId),
        [students],
    );

    const [studentId, setStudentId] = useState(linkable[0]?.id ?? "");
    const [title, setTitle] = useState("수강료");
    const [itemName, setItemName] = useState("월 수강료");
    const [amount, setAmount] = useState("300000");
    const [dueDate, setDueDate] = useState(defaultDueDate);

    function runCreate(issueNow: boolean) {
        if (!canManage) return;
        setFeedback(null);

        const parsedAmount = Number(amount);
        startTransition(async () => {
            const result = await createInvoice({
                studentId,
                title,
                itemName,
                amount: parsedAmount,
                dueDate,
                issueNow,
            });
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    function runIssue(invoiceId: string) {
        setFeedback(null);
        startTransition(async () => {
            const result = await issueInvoice({ invoiceId });
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    function runCancel(invoiceId: string) {
        setFeedback(null);
        startTransition(async () => {
            const result = await cancelInvoice({ invoiceId });
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    if (!canManage) {
        return (
            <section className={styles.page}>
                <header className={styles.heading}>
                    <div>
                        <span>BILLING</span>
                        <h1>청구·수납</h1>
                        <p>
                            {deniedMessage ??
                                "결제/청구 관리 권한이 없습니다."}
                        </p>
                    </div>
                </header>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>BILLING</span>
                    <h1>청구·수납</h1>
                    <p>
                        청구서를 만들고 발행하면 학부모 결제 화면에
                        표시됩니다.
                    </p>
                </div>
            </header>

            <div className={styles.layout}>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>청구서 작성</h2>
                    </div>

                    {linkable.length === 0 ? (
                        <p className={styles.hint}>
                            학부모가 연결된 학생이 없습니다. 원장 화면에서
                            학부모–학생을 먼저 연결하세요.
                        </p>
                    ) : (
                        <div className={styles.form}>
                            <label className={styles.field}>
                                <span>학생</span>
                                <select
                                    value={studentId}
                                    onChange={(e) =>
                                        setStudentId(e.target.value)
                                    }
                                    disabled={pending}
                                >
                                    {linkable.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                            {s.parentName
                                                ? ` · 학부모 ${s.parentName}`
                                                : ""}
                                            {s.className
                                                ? ` · ${s.className}`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className={styles.field}>
                                <span>제목</span>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={pending}
                                    maxLength={120}
                                />
                            </label>

                            <label className={styles.field}>
                                <span>항목명</span>
                                <input
                                    value={itemName}
                                    onChange={(e) =>
                                        setItemName(e.target.value)
                                    }
                                    disabled={pending}
                                    maxLength={120}
                                />
                            </label>

                            <label className={styles.field}>
                                <span>금액 (원)</span>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={pending}
                                />
                            </label>

                            <label className={styles.field}>
                                <span>납기일</span>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    disabled={pending}
                                />
                            </label>

                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.secondaryBtn}
                                    disabled={pending || !studentId}
                                    onClick={() => runCreate(false)}
                                >
                                    {pending ? "처리 중…" : "초안 저장"}
                                </button>
                                <button
                                    type="button"
                                    className={styles.primaryBtn}
                                    disabled={pending || !studentId}
                                    onClick={() => runCreate(true)}
                                >
                                    {pending ? "처리 중…" : "바로 발행"}
                                </button>
                            </div>
                        </div>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>청구 목록</h2>
                        <StatusChip>{invoices.length}건</StatusChip>
                    </div>

                    {invoices.length === 0 ? (
                        <p className={styles.hint}>아직 청구서가 없습니다.</p>
                    ) : (
                        <ul className={styles.list}>
                            {invoices.map((inv) => {
                                const meta = statusMeta[inv.status];
                                const canIssue = inv.status === "DRAFT";
                                const canCancel =
                                    inv.status === "DRAFT" ||
                                    inv.status === "ISSUED" ||
                                    inv.status === "OVERDUE";

                                return (
                                    <li key={inv.id} className={styles.row}>
                                        <div className={styles.rowMain}>
                                            <strong>{inv.title}</strong>
                                            <small>
                                                {inv.studentName}
                                                {inv.parentName
                                                    ? ` · ${inv.parentName}`
                                                    : ""}
                                            </small>
                                            <small>
                                                {formatWon(inv.totalAmount)} ·
                                                납기 {formatDate(inv.dueDate)}
                                            </small>
                                        </div>
                                        <div className={styles.rowSide}>
                                            <StatusChip tone={meta.tone}>
                                                {meta.label}
                                            </StatusChip>
                                            {canIssue && (
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.secondaryBtn
                                                    }
                                                    disabled={pending}
                                                    onClick={() =>
                                                        runIssue(inv.id)
                                                    }
                                                >
                                                    발행
                                                </button>
                                            )}
                                            {canCancel && (
                                                <button
                                                    type="button"
                                                    className={styles.dangerBtn}
                                                    disabled={pending}
                                                    onClick={() =>
                                                        runCancel(inv.id)
                                                    }
                                                >
                                                    취소
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </article>
            </div>

            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}
