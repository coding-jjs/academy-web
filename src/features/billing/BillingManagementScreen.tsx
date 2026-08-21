"use client"; // 준비 중 안내 state. createInvoice 호출 없음.

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

import { useState } from "react"; // 준비 중 피드백.
import { // 페이지 헤딩.
    pageHeadingStyles, // 아이브로우·제목.
    screenStyles, // 페이지 애니메이션.
} from "@/components/ui/shared-styles"; // 청구 전용 아님.
import InvoiceCreationPanel from "@/features/billing/components/InvoiceCreationPanel"; // UI only. createInvoice 없음.
import InvoiceListPanel from "@/features/billing/components/InvoiceListPanel"; // 발행·취소 콜백만.
import type { BillingInvoiceRow, BillingStudentOption } from "@/features/billing/types"; // data.ts가 채움.
import styles from "./BillingManagementScreen.module.css"; // 2열 레이아웃.

const UNAVAILABLE_MESSAGE = "청구·수납 처리는 준비 중인 기능입니다."; // director/employee 청구 페이지와 같은 안내.

/** 권한 없으면 폼 없이 안내만. 있으면 작성+목록. 저장은 아직 서버에 닿지 않는다. */
export default function BillingManagementScreen({ students, invoices, canManage, deniedMessage }: { students: BillingStudentOption[]; invoices: BillingInvoiceRow[]; canManage: boolean; deniedMessage?: string }) { // 액션 없음.
    const [feedback, setFeedback] = useState<string | null>(null); // 준비 중 문장.

    function notifyUnavailable() { // 작성·발행·취소 공통.
        setFeedback(UNAVAILABLE_MESSAGE); // createInvoice가 없어서 작성·발행·취소 모두 같은 안내로 막는다.
    }

    if (!canManage) return <section className={screenStyles.animatedPage}><BillingHeading description={deniedMessage ?? "결제/청구 관리 권한이 없습니다."} /></section>; // 권한 없으면 폼을 그리지 않고 heading만.
    return ( // 권한 있을 때만 작성+목록.
        <section className={screenStyles.animatedPage}> // 원장 청구 화면.
            <BillingHeading description="청구서를 만들고 발행하면 학부모 결제 화면에 표시됩니다." /> // 권한 없으면 위에서 heading만 그리고 폼을 안 그린다.
            <div className={styles.layout}><InvoiceCreationPanel students={students} isPending={false} onCreate={notifyUnavailable} /><InvoiceListPanel invoices={invoices} isPending={false} onIssue={notifyUnavailable} onCancel={notifyUnavailable} /></div> // 작성 패널은 UI only(createInvoice 없음) + 목록. 저장은 아직 서버에 닿지 않는다.
            {feedback && <p className={styles.feedback}>{feedback}</p>} // 준비 중 안내.
        </section> // 화면 끝.
    );
}

function BillingHeading({ description }: { description: string }) { // 권한 여부에 따라 description이 갈린다.
    return ( // 헤딩만. 폼 없음.
        <header className={pageHeadingStyles.root}> // 페이지 제목.
            <div> // BILLING 아이브로우 + 제목. 설명은 권한 여부에 따라 부모가 넘긴다.
                <span className={pageHeadingStyles.eyebrow}>BILLING</span> // 영문 아이브로우.
                <h1>청구·수납</h1> // 화면 제목.
                <p>{description}</p> // 권한 안내 또는 기능 설명.
            </div> // 제목 블록.
        </header> // 헤더 끝.
    );
}
