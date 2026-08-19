"use client";

import { useState } from "react";
import {
    pageHeadingStyles,
    screenStyles,
} from "@/components/ui/shared-styles";
import InvoiceCreationPanel from "@/features/billing/components/InvoiceCreationPanel";
import InvoiceListPanel from "@/features/billing/components/InvoiceListPanel";
import type { BillingInvoiceRow, BillingStudentOption } from "@/features/billing/types";
import styles from "./BillingManagementScreen.module.css";

const UNAVAILABLE_MESSAGE = "청구·수납 처리는 준비 중인 기능입니다.";

export default function BillingManagementScreen({ students, invoices, canManage, deniedMessage }: { students: BillingStudentOption[]; invoices: BillingInvoiceRow[]; canManage: boolean; deniedMessage?: string }) {
    const [feedback, setFeedback] = useState<string | null>(null);

    function notifyUnavailable() {
        setFeedback(UNAVAILABLE_MESSAGE);
    }

    if (!canManage) return <section className={screenStyles.animatedPage}><BillingHeading description={deniedMessage ?? "결제/청구 관리 권한이 없습니다."} /></section>;
    return (
        <section className={screenStyles.animatedPage}>
            <BillingHeading description="청구서를 만들고 발행하면 학부모 결제 화면에 표시됩니다." />
            <div className={styles.layout}><InvoiceCreationPanel students={students} isPending={false} onCreate={notifyUnavailable} /><InvoiceListPanel invoices={invoices} isPending={false} onIssue={notifyUnavailable} onCancel={notifyUnavailable} /></div>
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
