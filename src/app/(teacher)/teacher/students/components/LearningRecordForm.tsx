"use client";

import { useActionState } from "react";
import type { StaffStudentRow } from "@/features/students/types";
import {
    createLearningRecord,
    type LearningRecordState,
} from "@/features/students/staff-actions";
import { getTodayDateInput } from "@/features/students/presentation";
import styles from "../StaffStudentsScreen.module.css";

const INITIAL_LEARNING_RECORD_STATE: LearningRecordState = {
    status: "idle",
    message: "",
};

export default function LearningRecordForm({
    student,
    writableClassIds,
}: {
    student: StaffStudentRow;
    writableClassIds: Set<string>;
}) {
    const [actionState, formAction, isSaving] = useActionState(
        createLearningRecord,
        INITIAL_LEARNING_RECORD_STATE,
    );

    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}>
                <h2>기록 작성</h2>
            </div>
            <form action={formAction} className={styles.form}>
                <input type="hidden" name="studentId" value={student.id} />
                <label className={styles.field}>
                    <span>유형</span>
                    <select name="type" defaultValue="CLASS_NOTE">
                        <option value="CLASS_NOTE">수업 기록</option>
                        <option value="HOMEWORK">숙제</option>
                        <option value="LIFE_RECORD">생활 기록</option>
                    </select>
                </label>
                <label className={styles.field}>
                    <span>반 (선택)</span>
                    <select name="classId" defaultValue="">
                        <option value="">없음</option>
                        {student.classes
                            .filter((academyClass) =>
                                writableClassIds.has(academyClass.id),
                            )
                            .map((academyClass) => (
                                <option
                                    key={academyClass.id}
                                    value={academyClass.id}
                                >
                                    {academyClass.name}
                                </option>
                            ))}
                    </select>
                </label>
                <label className={styles.field}>
                    <span>날짜</span>
                    <input
                        type="date"
                        name="recordDate"
                        defaultValue={getTodayDateInput()}
                        required
                    />
                </label>
                <label className={styles.field}>
                    <span>제목</span>
                    <input
                        name="title"
                        required
                        maxLength={80}
                        placeholder="예: 오늘 수업 참여도"
                    />
                </label>
                <label className={styles.field}>
                    <span>내용</span>
                    <textarea
                        name="content"
                        rows={5}
                        required
                        maxLength={2000}
                        placeholder="학습·생활 기록을 입력하세요"
                    />
                </label>
                <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={isSaving}
                >
                    {isSaving ? "저장 중…" : "기록 저장"}
                </button>
                {actionState.message && (
                    <p
                        className={
                            actionState.status === "success"
                                ? styles.success
                                : styles.error
                        }
                        role="alert"
                    >
                        {actionState.message}
                    </p>
                )}
            </form>
        </article>
    );
}
