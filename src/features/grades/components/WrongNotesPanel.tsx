"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

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

import { useState, useTransition } from "react"; // 로컬 UI. 권한 판정은 서버.
import { useRouter } from "next/navigation"; // refresh. redirect 페이로드가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 화면 칩. 서버 enum이 아니다.
import { // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    createWrongNote, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    updateWrongNote, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
} from "@/features/grades/actions"; // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
import { formatGradeDate } from "@/features/grades/formatters"; // ISO → KST 연·월·일.
import { WRONG_NOTE_STATUS_METADATA } from "@/features/grades/presentation"; // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
import type { // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    GradesGradeRow, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    GradesStudentOption, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    GradesWrongRow, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    WrongNoteStatus, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
} from "@/features/grades/types"; // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
import styles from "../GradesManagementScreen.module.css"; // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.

type WrongNotesPanelProps = { // WrongNotesPanelProps 타입. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    student: GradesStudentOption; // 스코프·존재 검사. 학부모 뷰어 쿼리가 아니다.
    grades: GradesGradeRow[]; // grades. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    wrongNotes: GradesWrongRow[]; // wrongNotes. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    onFeedback: (message: string) => void; // 부모 한 줄. 탭 전환 시 지운다.
};

/**
 * 오답 폼. 수정 중이면 wrongNoteId로 update, 아니면 선택 학생으로 create.
 */
export default function WrongNotesPanel({ // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    student, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    grades, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    wrongNotes, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    onFeedback, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
}: WrongNotesPanelProps) { // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const router = useRouter(); // router. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [isSaving, startSaving] = useTransition(); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [editingWrongNoteId, setEditingWrongNoteId] = useState<string | null>( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        null, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    );
    const [gradeRecordId, setGradeRecordId] = useState(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [questionNumber, setQuestionNumber] = useState(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [questionText, setQuestionText] = useState(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [studentAnswer, setStudentAnswer] = useState(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [correctAnswer, setCorrectAnswer] = useState(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [explanation, setExplanation] = useState(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    const [status, setStatus] = useState<WrongNoteStatus>("OPEN"); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.

    function resetForm() { // resetForm. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setEditingWrongNoteId(null); // 수정 모드를 끄고 빈 값·OPEN으로.
        setGradeRecordId(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setQuestionNumber(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setQuestionText(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setStudentAnswer(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setCorrectAnswer(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setExplanation(""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setStatus("OPEN"); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    }

    function startEditing(wrongNote: GradesWrongRow) { // startEditing. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setEditingWrongNoteId(wrongNote.id); // 기존 행을 폼에 채운다. 연결 성적 select는 잠근다.
        setGradeRecordId(wrongNote.gradeRecordId ?? ""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setQuestionNumber(wrongNote.questionNo ?? ""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setQuestionText(wrongNote.questionText ?? ""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setStudentAnswer(wrongNote.studentAnswer ?? ""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setCorrectAnswer(wrongNote.correctAnswer ?? ""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setExplanation(wrongNote.explanation ?? ""); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        setStatus(wrongNote.status); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    }

    function saveWrongNote() { // saveWrongNote. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        startSaving(async () => { // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            const result = editingWrongNoteId // result. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                ? await updateWrongNote({ // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      wrongNoteId: editingWrongNoteId, // 연결 성적은 안 바꿈. 서버도 gradeRecordId를 받지 않는다.
                      questionNo: questionNumber, // 문항 번호. 본문과 둘 다 비면 거절.
                      questionText, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      studentAnswer, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      correctAnswer, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      explanation, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      status, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                  })
                : await createWrongNote({ // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      studentId: student.id, // 원생 카드. User id가 아니다.
                      gradeRecordId: gradeRecordId || null, // 연결 성적. 다른 학생 성적에 못 붙인다.
                      classId: student.classId, // 표시용 현재 반. 권한은 서버 take:1 담임.
                      questionNo: questionNumber, // 문항 번호. 본문과 둘 다 비면 거절.
                      questionText, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      studentAnswer, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      correctAnswer, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      explanation, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                      status, // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                  });

            onFeedback(result.message); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            if (result.ok) { // 가드. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                resetForm(); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                router.refresh(); // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            }
        });
    }

    return ( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        <> // JSX. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            <div // 연결 성적은 새로 작성할 때만. 수정 중 select는 잠근다.
                className={styles.form} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>연결 성적 (선택)</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <select // select. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={gradeRecordId} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            setGradeRecordId(event.target.value) // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        }
                        disabled={isSaving || Boolean(editingWrongNoteId)} // 수정 액션은 연결 성적을 바꾸지 않는다.
                    > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        <option value="">없음</option> // option. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        {grades.map((grade) => ( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            <option key={grade.id} value={grade.id}> // option. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                {grade.title} ({grade.subject}) // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            </option> // option 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        ))}
                    </select> // select 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>문항 번호</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <input // input. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={questionNumber} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            setQuestionNumber(event.target.value) // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        }
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    /> // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>문제</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <textarea // textarea. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={questionText} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => setQuestionText(event.target.value)} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        rows={3} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    /> // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>학생 답</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <input // input. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={studentAnswer} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            setStudentAnswer(event.target.value) // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        }
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    /> // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>정답</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <input // input. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={correctAnswer} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            setCorrectAnswer(event.target.value) // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        }
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    /> // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>해설</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <textarea // textarea. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={explanation} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => setExplanation(event.target.value)} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        rows={3} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    /> // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <label className={styles.field}> // label. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <span>상태</span> // span. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <select // select. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        value={status} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onChange={(event) => // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            setStatus(event.target.value as WrongNoteStatus) // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        }
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        <option value="OPEN">복습 필요</option> // option. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        <option value="REVIEWED">복습함</option> // option. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        <option value="MASTERED">완료</option> // option. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    </select> // select 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </label> // label 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                <div className={styles.actions}> // div. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    {editingWrongNoteId && ( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        <button // button. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            type="button" // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            className={styles.secondaryBtn} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            onClick={resetForm} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            새로 작성 // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        </button> // button 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    )}
                    <button // button. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        type="button" // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        className={styles.primaryBtn} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        onClick={saveWrongNote} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        {isSaving // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            ? "처리 중…" // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            : editingWrongNoteId // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                              ? "오답 수정" // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                              : "오답 저장"} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    </button> // button 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                </div> // div 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            </div> // div 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.

            <ul // 이 학생 오답. 상태 칩 + 수정. 삭제는 없다.
                className={styles.list} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
            > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                {wrongNotes.length === 0 ? ( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    <li className={styles.hint}>등록된 오답이 없습니다.</li> // li. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                ) : ( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                    wrongNotes.map((wrongNote) => { // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        const statusMetadata = // statusMetadata. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            WRONG_NOTE_STATUS_METADATA[wrongNote.status]; // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.

                        return ( // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            <li key={wrongNote.id} className={styles.row}> // li. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                <div> // div. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    <strong> // strong. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        {wrongNote.questionNo // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                            ? `${wrongNote.questionNo}. ` // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                            : ""} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        {wrongNote.questionText ?? "(내용 없음)"} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    </strong> // strong 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    <small> // small. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        {wrongNote.gradeTitle // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                            ? `${wrongNote.gradeTitle} · ` // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                            : ""} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        {formatGradeDate(wrongNote.createdAt)} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    </small> // small 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                </div> // div 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                <div className={styles.rowSide}> // div. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    <StatusChip tone={statusMetadata.tone}> // StatusChip. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        {statusMetadata.label} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    </StatusChip> // StatusChip 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    <button // button. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        type="button" // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        className={styles.secondaryBtn} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        disabled={isSaving} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        onClick={() => startEditing(wrongNote)} // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    > // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                        수정 // 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                    </button> // button 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                                </div> // div 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                            </li> // li 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
                        );
                    })
                )}
            </ul> // ul 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
        </> // 태그 닫기. 오답 입력 UI. 권한은 서버 take:1. 연결 성적은 수정 중 잠금.
    );
}
