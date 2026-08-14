"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelInvoice, createInvoice, issueInvoice } from "@/features/billing/actions";
import {
    pageHeadingStyles,
    screenStyles,
} from "@/components/ui/shared-styles";
import InvoiceCreationPanel, { type NewInvoiceInput } from "@/features/billing/components/InvoiceCreationPanel";
import InvoiceListPanel from "@/features/billing/components/InvoiceListPanel";
import type { BillingInvoiceRow, BillingStudentOption } from "@/features/billing/types";
import styles from "./BillingManagementScreen.module.css";

export default function BillingManagementScreen({ students, invoices, canManage, deniedMessage }: { students: BillingStudentOption[]; invoices: BillingInvoiceRow[]; canManage: boolean; deniedMessage?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);

    function runAction(action: () => Promise<{ ok: boolean; message: string }>) {
        setFeedback(null);
        startTransition(async () => { const result = await action(); setFeedback(result.message); if (result.ok) router.refresh(); });
    }

    if (!canManage) return <section className={screenStyles.animatedPage}><BillingHeading description={deniedMessage ?? "결제/청구 관리 권한이 없습니다."} /></section>;
    return (
        <section className={screenStyles.animatedPage}>
            <BillingHeading description="청구서를 만들고 발행하면 학부모 결제 화면에 표시됩니다." />
            <div className={styles.layout}><InvoiceCreationPanel students={students} isPending={isPending} onCreate={(input: NewInvoiceInput) => runAction(() => createInvoice(input))} /><InvoiceListPanel invoices={invoices} isPending={isPending} onIssue={(invoiceId) => runAction(() => issueInvoice({ invoiceId }))} onCancel={(invoiceId) => runAction(() => cancelInvoice({ invoiceId }))} /></div>
            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}

function BillingHeading({ description }: { description: string }) {
    return (
        <header className={pageHeadingStyles.root}>
            <div>
                <span className={pageHeadingStyles.eyebrow}>BILLING</span>
                <h1>청구·수납</h1>
                <p>{description}</p>
            </div>
        </header>
    );
}
