"use client";

/**
 * 원장 청구·수납 화면이다. 작성 패널과 목록을 나란히 둔다.
 *
 * 호출: 청구 관리 페이지가 students/invoices/canManage를 넘긴다.
 * 생성·발행 액션은 아직 없어, 버튼은 `notifyUnavailable`로 준비 중 안내만 한다.
 *
 * 의도적으로 하지 않는 일:
 * - createInvoice / issueInvoice Server Action 호출. InvoiceCreationPanel은 UI만.
 * - 권한 없으면 폼을 그리지 않고 heading만.
 *
 * 관련: `InvoiceCreationPanel`, `InvoiceListPanel`, `data.ts`.
 */

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

/** 권한 없으면 폼 없이 안내만. 있으면 작성+목록. 저장은 아직 서버에 닿지 않는다. */
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
