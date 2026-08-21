"use client";

import { useActionState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { getCurrentLocalDateTimeInput } from "@/features/counseling/presentation";
import { CHURN_STATUS_METADATA } from "@/features/churn/presentation";
import type { TeacherChurnCareTask } from "@/features/churn/types";
import {
    submitChurnCareNote,
    type ChurnCareNoteState,
} from "@/features/churn/teacher-actions";
import styles from "../StaffCounselingScreen.module.css";

const INITIAL_STATE: ChurnCareNoteState = { status: "idle", message: "" };

export default function ChurnCarePanel({
    tasks,
}: {
    tasks: TeacherChurnCareTask[];
}) {
    if (tasks.length === 0) return null;

    const openCount = tasks.filter((task) => task.status === "COUNSELING").length;

    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}>
                <h2>이탈 케어</h2>
                <StatusChip tone={openCount > 0 ? "warning" : "neutral"}>
                    {openCount}건 기록 필요
                </StatusChip>
            </div>
            <p className={styles.muted}>
                원장이 배정한 이탈 위험 학생입니다. 상담 내용을 남기면 원장
                검토로 넘어갑니다.
            </p>
            <ul className={styles.careList}>
                {tasks.map((task) => (
                    <li key={task.churnCaseId} className={styles.careItem}>
                        <div className={styles.itemTop}>
                            <strong>
                                {task.studentName}
                                {task.className ? ` · ${task.className}` : ""}
                            </strong>
                            <StatusChip
                                tone={CHURN_STATUS_METADATA[task.status].tone}
                            >
                                {CHURN_STATUS_METADATA[task.status].label}
                            </StatusChip>
                        </div>
                        <p className={styles.careReason}>
                            감지 사유: {task.reason}
                        </p>
                        {task.latestMemo ? (
                            <p className={styles.careMemo}>
                                최근 기록 ({task.latestMemo.authorName}):{" "}
                                {task.latestMemo.content}
                            </p>
                        ) : null}
                        {task.status === "COUNSELING" ? (
                            <ChurnCareForm task={task} />
                        ) : (
                            <p className={styles.muted}>
                                원장 확인을 기다리는 중입니다.
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </article>
    );
}

function ChurnCareForm({ task }: { task: TeacherChurnCareTask }) {
    const [state, formAction, isPending] = useActionState(
        submitChurnCareNote,
        INITIAL_STATE,
    );

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="churnCaseId" value={task.churnCaseId} />
            <label className={styles.field}>
                <span>상담 일시</span>
                <input
                    type="datetime-local"
                    name="counseledAt"
                    defaultValue={getCurrentLocalDateTimeInput()}
                    max={getCurrentLocalDateTimeInput()}
                    required
                />
            </label>
            <label className={styles.field}>
                <span>상담 내용</span>
                <textarea
                    name="content"
                    rows={5}
                    required
                    maxLength={2000}
                    placeholder="상담에서 나눈 내용과 이후 관찰 계획을 적어 주세요."
                />
            </label>
            <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isPending}
            >
                {isPending ? "저장 중…" : "기록하고 검토 요청"}
            </button>
            {state.message && (
                <p
                    className={
                        state.status === "success"
                            ? styles.success
                            : styles.error
                    }
                    role="alert"
                >
                    {state.message}
                </p>
            )}
        </form>
    );
}
