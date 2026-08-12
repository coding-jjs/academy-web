"use client";

import { useMemo, useState } from "react";
import type { BillingStudentOption } from "@/features/billing/types";
import styles from "../BillingManagementScreen.module.css";

export type NewInvoiceInput = { studentId: string; title: string; itemName: string; amount: number; dueDate: string; issueNow: boolean };

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
        <article className={styles.panel}>
            <div className={styles.panelHead}><h2>청구서 작성</h2></div>
            {linkedStudents.length === 0 ? <p className={styles.hint}>학부모가 연결된 학생이 없습니다. 원장 화면에서 학부모–학생을 먼저 연결하세요.</p> : <div className={styles.form}>
                <label className={styles.field}><span>학생</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={isPending}>{linkedStudents.map((student) => <option key={student.id} value={student.id}>{student.name}{student.parentName ? ` · 학부모 ${student.parentName}` : ""}{student.className ? ` · ${student.className}` : ""}</option>)}</select></label>
                <label className={styles.field}><span>제목</span><input value={title} onChange={(event) => setTitle(event.target.value)} disabled={isPending} maxLength={120} /></label>
                <label className={styles.field}><span>항목명</span><input value={itemName} onChange={(event) => setItemName(event.target.value)} disabled={isPending} maxLength={120} /></label>
                <label className={styles.field}><span>금액 (원)</span><input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} disabled={isPending} /></label>
                <label className={styles.field}><span>납기일</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={isPending} /></label>
                <div className={styles.actions}><button type="button" className={styles.secondaryBtn} disabled={isPending || !studentId} onClick={() => create(false)}>{isPending ? "처리 중…" : "초안 저장"}</button><button type="button" className={styles.primaryBtn} disabled={isPending || !studentId} onClick={() => create(true)}>{isPending ? "처리 중…" : "바로 발행"}</button></div>
            </div>}
        </article>
    );
}

function getDefaultDueDate() {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate.toISOString().slice(0, 10);
}
