"use client";

/**
 * 한 학생의 오답 노트 입력·수정 패널.
 *
 * 호출: `StudentGradesWorkspace`의 오답 탭.
 * 기존 성적에 선택 연결할 수 있고, 복습 상태와 함께 저장한다.
 * 수정 중에는 연결 성적 select를 잠근다 — `updateWrongNote`가 gradeRecordId를 받지 않기 때문.
 *
 * 의도적으로 하지 않는 일:
 * - 이미지 업로드. 학생 뷰어의 imageUrls는 별도 경로다.
 * - 문항 번호/본문 검증을 여기서 끝내지 않음. 서버가 둘 다 비었는지 본다.
 *
 * 관련: `grades/actions.ts`, `presentation.ts`.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    createWrongNote,
    updateWrongNote,
} from "@/features/grades/actions";
import { formatGradeDate } from "@/features/grades/formatters";
import { WRONG_NOTE_STATUS_METADATA } from "@/features/grades/presentation";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
    WrongNoteStatus,
} from "@/features/grades/types";
import styles from "../GradesManagementScreen.module.css";

type WrongNotesPanelProps = {
    student: GradesStudentOption;
    grades: GradesGradeRow[];
    wrongNotes: GradesWrongRow[];
    onFeedback: (message: string) => void;
};

/**
 * 오답 폼. 수정 중이면 wrongNoteId로 update, 아니면 선택 학생으로 create.
 */
export default function WrongNotesPanel({
    student,
    grades,
    wrongNotes,
    onFeedback,
}: WrongNotesPanelProps) {
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    const [editingWrongNoteId, setEditingWrongNoteId] = useState<string | null>(
        null,
    );
    const [gradeRecordId, setGradeRecordId] = useState("");
    const [questionNumber, setQuestionNumber] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [studentAnswer, setStudentAnswer] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [explanation, setExplanation] = useState("");
    const [status, setStatus] = useState<WrongNoteStatus>("OPEN");

    function resetForm() {
        setEditingWrongNoteId(null);
        setGradeRecordId("");
        setQuestionNumber("");
        setQuestionText("");
        setStudentAnswer("");
        setCorrectAnswer("");
        setExplanation("");
        setStatus("OPEN");
    }

    function startEditing(wrongNote: GradesWrongRow) {
        setEditingWrongNoteId(wrongNote.id);
        setGradeRecordId(wrongNote.gradeRecordId ?? "");
        setQuestionNumber(wrongNote.questionNo ?? "");
        setQuestionText(wrongNote.questionText ?? "");
        setStudentAnswer(wrongNote.studentAnswer ?? "");
        setCorrectAnswer(wrongNote.correctAnswer ?? "");
        setExplanation(wrongNote.explanation ?? "");
        setStatus(wrongNote.status);
    }

    function saveWrongNote() {
        startSaving(async () => {
            const result = editingWrongNoteId
                ? await updateWrongNote({
                      wrongNoteId: editingWrongNoteId,
                      questionNo: questionNumber,
                      questionText,
                      studentAnswer,
                      correctAnswer,
                      explanation,
                      status,
                  })
                : await createWrongNote({
                      studentId: student.id,
                      gradeRecordId: gradeRecordId || null,
                      classId: student.classId,
                      questionNo: questionNumber,
                      questionText,
                      studentAnswer,
                      correctAnswer,
                      explanation,
                      status,
                  });

            onFeedback(result.message);
            if (result.ok) {
                resetForm();
                router.refresh();
            }
        });
    }

    return (
        <>
            <div
                className={styles.form}
            >
                <label className={styles.field}>
                    <span>연결 성적 (선택)</span>
                    <select
                        value={gradeRecordId}
                        onChange={(event) =>
                            setGradeRecordId(event.target.value)
                        }
                        disabled={isSaving || Boolean(editingWrongNoteId)}
                    >
                        <option value="">없음</option>
                        {grades.map((grade) => (
                            <option key={grade.id} value={grade.id}>
                                {grade.title} ({grade.subject})
                            </option>
                        ))}
                    </select>
                </label>
                <label className={styles.field}>
                    <span>문항 번호</span>
                    <input
                        value={questionNumber}
                        onChange={(event) =>
                            setQuestionNumber(event.target.value)
                        }
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>문제</span>
                    <textarea
                        value={questionText}
                        onChange={(event) => setQuestionText(event.target.value)}
                        disabled={isSaving}
                        rows={3}
                    />
                </label>
                <label className={styles.field}>
                    <span>학생 답</span>
                    <input
                        value={studentAnswer}
                        onChange={(event) =>
                            setStudentAnswer(event.target.value)
                        }
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>정답</span>
                    <input
                        value={correctAnswer}
                        onChange={(event) =>
                            setCorrectAnswer(event.target.value)
                        }
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>해설</span>
                    <textarea
                        value={explanation}
                        onChange={(event) => setExplanation(event.target.value)}
                        disabled={isSaving}
                        rows={3}
                    />
                </label>
                <label className={styles.field}>
                    <span>상태</span>
                    <select
                        value={status}
                        onChange={(event) =>
                            setStatus(event.target.value as WrongNoteStatus)
                        }
                        disabled={isSaving}
                    >
                        <option value="OPEN">복습 필요</option>
                        <option value="REVIEWED">복습함</option>
                        <option value="MASTERED">완료</option>
                    </select>
                </label>
                <div className={styles.actions}>
                    {editingWrongNoteId && (
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            disabled={isSaving}
                            onClick={resetForm}
                        >
                            새로 작성
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={isSaving}
                        onClick={saveWrongNote}
                    >
                        {isSaving
                            ? "처리 중…"
                            : editingWrongNoteId
                              ? "오답 수정"
                              : "오답 저장"}
                    </button>
                </div>
            </div>
            <ul
                className={styles.list}
            >
                {wrongNotes.length === 0 ? (
                    <li className={styles.hint}>등록된 오답이 없습니다.</li>
                ) : (
                    wrongNotes.map((wrongNote) => {
                        const statusMetadata =
                            WRONG_NOTE_STATUS_METADATA[wrongNote.status];

                        return (
                            <li key={wrongNote.id} className={styles.row}>
                                <div>
                                    <strong>
                                        {wrongNote.questionNo
                                            ? `${wrongNote.questionNo}. `
                                            : ""}
                                        {wrongNote.questionText ?? "(내용 없음)"}
                                    </strong>
                                    <small>
                                        {wrongNote.gradeTitle
                                            ? `${wrongNote.gradeTitle} · `
                                            : ""}
                                        {formatGradeDate(wrongNote.createdAt)}
                                    </small>
                                </div>
                                <div className={styles.rowSide}>
                                    <StatusChip tone={statusMetadata.tone}>
                                        {statusMetadata.label}
                                    </StatusChip>
                                    <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        disabled={isSaving}
                                        onClick={() => startEditing(wrongNote)}
                                    >
                                        수정
                                    </button>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </>
    );
}
