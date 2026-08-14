"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    createDirectorCounselingMemo,
    type CounselingActionState,
} from "@/features/counseling/actions";
import {
    formatCounselingDateTime,
    getCurrentLocalDateTimeInput,
} from "@/features/counseling/presentation";
import type { StaffCounselingMemo } from "@/features/counseling/types";
import type { DirectorStudent } from "@/features/students/types";
import { formatStudentSchool } from "@/features/students/presentation";
import styles from "../DirectorStudentsScreen.module.css";

const INITIAL_STATE: CounselingActionState = { status: "idle", message: "" };

export default function DirectorStudentCounseling({
    student,
    memos,
    onClose,
}: {
    student: DirectorStudent;
    memos: StaffCounselingMemo[];
    onClose: () => void;
}) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction, isPending] = useActionState(
        createDirectorCounselingMemo,
        INITIAL_STATE,
    );

    useEffect(() => {
        if (state.status !== "success") return;
        formRef.current?.reset();
        router.refresh();
    }, [state, router]);

    const maxCounseledAt = getCurrentLocalDateTimeInput();

    return (
        <aside className={styles.detailPanel}>
            <div className={styles.panelHead}>
                <div>
                    <h2>{student.name}</h2>
                    <p>
                        {formatStudentSchool(
                            student.schoolName,
                            student.grade,
                            "학교·학년 미입력",
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>

            <section className={styles.block}>
                <h3>상담 등록</h3>
                <form ref={formRef} action={formAction} className={styles.form}>
                    <input type="hidden" name="studentId" value={student.id} />
                    <label className={styles.field}>
                        상담 일시
                        <input
                            type="datetime-local"
                            name="counseledAt"
                            defaultValue={maxCounseledAt}
                            max={maxCounseledAt}
                            required
                        />
                    </label>
                    <label className={styles.field}>
                        상담 내용
                        <textarea
                            name="content"
                            rows={6}
                            required
                            maxLength={2000}
                            placeholder="상담 요청 내용, 진행 상황, 후속 조치를 적어 주세요."
                        />
                    </label>
                    <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={isPending}
                    >
                        {isPending ? "등록 중…" : "상담 등록"}
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
            </section>

            <section className={styles.block}>
                <div className={styles.counselingHead}>
                    <h3>최근 상담</h3>
                    <StatusChip>{memos.length}건</StatusChip>
                </div>
                {memos.length === 0 ? (
                    <p className={styles.muted}>
                        등록된 상담 기록이 없습니다.
                    </p>
                ) : (
                    <ul className={styles.counselingList}>
                        {memos.map((memo) => (
                            <li key={memo.id}>
                                <div className={styles.counselingItemTop}>
                                    <strong>
                                        {formatCounselingDateTime(
                                            memo.counseledAt,
                                        )}
                                    </strong>
                                    <span>{memo.authorName}</span>
                                </div>
                                <p>{memo.content}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </aside>
    );
}
