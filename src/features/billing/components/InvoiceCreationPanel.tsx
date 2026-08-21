"use client";

/**
 * 청구서 작성 UI만 담당한다. createInvoice 서버 액션은 없다.
 *
 * 호출: `BillingManagementScreen`이 `onCreate={notifyUnavailable}`로 붙인다.
 * 학부모가 연결된 학생만 고를 수 있게 하고, 초안 저장·바로 발행은 콜백만 호출한다.
 *
 * 의도적으로 하지 않는 일:
 * - prisma.invoice.create / 발행 전이. 아직 액션 파일이 없다.
 * - 금액 검증·납기 KST 보정. 숫자 변환만 하고 부모에게 넘긴다.
 *
 * 관련: `types.ts`의 `BillingStudentOption`.
 */

import { useMemo, useState } from "react";
import {
    buttonStyles,
    cx,
    fieldStyles,
    panelStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import type { BillingStudentOption } from "@/features/billing/types";
import styles from "../BillingManagementScreen.module.css";

/** 작성 폼이 부모에 넘기는 값. 서버 액션 입력과 맞춰 두었지만 createInvoice는 아직 없다. */
export type NewInvoiceInput = { studentId: string; title: string; itemName: string; amount: number; dueDate: string; issueNow: boolean };

/** 학부모 연결 학생만 select. 버튼은 onCreate만 호출하고 DB에 쓰지 않는다. */
export default function InvoiceCreationPanel({ students, isPending, onCreate }: { students: BillingStudentOption[]; isPending: boolean; onCreate: (input: NewInvoiceInput) => void }) {
    const linkedStudents = useMemo(() => students.filter((student) => student.parentUserId), [students]);
    const [studentId, setStudentId] = useState(linkedStudents[0]?.id ?? "");
    const [title, setTitle] = useState("수강료");
    const [itemName, setItemName] = useState("월 수강료");
    const [amount, setAmount] = useState("300000");
    const [dueDate, setDueDate] = useState(getDefaultDueDate);

    function create(issueNow: boolean) {
        onCreate({ studentId, title, itemName, amount: Number(amount), dueDate, issueNow });
    }

    return (
        <article className={cx(surfaceStyles.root, styles.panel)}>
            <div className={panelStyles.head}><h2>청구서 작성</h2></div>
            {linkedStudents.length === 0 ? <p className={typographyStyles.hint}>학부모가 연결된 학생이 없습니다. 원장 화면에서 학부모–학생을 먼저 연결하세요.</p> : <div className={fieldStyles.form}>
                <label className={fieldStyles.root}><span>학생</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={isPending}>{linkedStudents.map((student) => <option key={student.id} value={student.id}>{student.name}{student.parentName ? ` · 학부모 ${student.parentName}` : ""}{student.className ? ` · ${student.className}` : ""}</option>)}</select></label>
                <label className={fieldStyles.root}><span>제목</span><input value={title} onChange={(event) => setTitle(event.target.value)} disabled={isPending} maxLength={120} /></label>
                <label className={fieldStyles.root}><span>항목명</span><input value={itemName} onChange={(event) => setItemName(event.target.value)} disabled={isPending} maxLength={120} /></label>
                <label className={fieldStyles.root}><span>금액 (원)</span><input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} disabled={isPending} /></label>
                <label className={fieldStyles.root}><span>납기일</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={isPending} /></label>
                <div className={styles.actions}><button type="button" className={buttonStyles.secondary} disabled={isPending || !studentId} onClick={() => create(false)}>{isPending ? "처리 중…" : "초안 저장"}</button><button type="button" className={buttonStyles.primary} disabled={isPending || !studentId} onClick={() => create(true)}>{isPending ? "처리 중…" : "바로 발행"}</button></div>
            </div>}
        </article>
    );
}

/** 오늘+7일을 YYYY-MM-DD. 서버 저장이 없어 화면 기본값만. */
function getDefaultDueDate() {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate.toISOString().slice(0, 10);
}
