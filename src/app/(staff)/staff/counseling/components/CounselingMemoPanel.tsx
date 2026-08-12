"use client";

import { useActionState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { formatCounselingDateTime, getCurrentLocalDateTimeInput } from "@/features/counseling/presentation";
import type { CounselingStudentOption, StaffCounselingMemo } from "@/features/counseling/types";
import {
    createCounselingMemo,
    type CounselingActionState,
} from "@/features/counseling/actions";
import styles from "../StaffCounselingScreen.module.css";

const INITIAL_STATE: CounselingActionState = { status: "idle", message: "" };

export default function CounselingMemoPanel({ students, memos }: { students: CounselingStudentOption[]; memos: StaffCounselingMemo[] }) {
    const [state, formAction, isPending] = useActionState(createCounselingMemo, INITIAL_STATE);
    return (
        <div className={styles.layout}>
            <article className={styles.panel}><div className={styles.panelHead}><h2>상담 등록</h2></div>
                {students.length === 0 ? <p className={styles.muted}>등록 가능한 담당 학생이 없습니다.</p> : <form action={formAction} className={styles.form}>
                    <label className={styles.field}><span>학생</span><select name="studentId" required defaultValue=""><option value="" disabled>선택</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}{student.className ? ` · ${student.className}` : ""}{student.grade ? ` · ${student.grade}` : ""}</option>)}</select></label>
                    <label className={styles.field}><span>상담 일시</span><input type="datetime-local" name="counseledAt" defaultValue={getCurrentLocalDateTimeInput()} required /></label>
                    <label className={styles.field}><span>상담 내용</span><textarea name="content" rows={6} required maxLength={2000} placeholder="상담 요청 내용, 진행 상황, 후속 조치를 적어 주세요." /></label>
                    <button type="submit" className={styles.primaryBtn} disabled={isPending}>{isPending ? "등록 중…" : "상담 등록"}</button>
                    {state.message && <p className={state.status === "success" ? styles.success : styles.error} role="alert">{state.message}</p>}
                </form>}
            </article>
            <article className={styles.panel}><div className={styles.panelHead}><h2>최근 상담</h2><StatusChip>{memos.length}건</StatusChip></div>
                {memos.length === 0 ? <p className={styles.muted}>등록된 상담 기록이 없습니다.</p> : <ul className={styles.list}>{memos.map((memo) => <li key={memo.id}><div className={styles.itemTop}><strong>{memo.studentName}</strong><span>{formatCounselingDateTime(memo.counseledAt)}</span></div><p>{memo.content}</p><small>{memo.authorName}{memo.studentGrade ? ` · ${memo.studentGrade}` : ""}</small></li>)}</ul>}
            </article>
        </div>
    );
}
