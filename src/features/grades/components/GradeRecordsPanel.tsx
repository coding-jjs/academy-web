"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

/**
 * 한 학생의 성적 입력·수정 패널.
 *
 * 호출: `StudentGradesWorkspace`의 성적 탭.
 * 평가일 상한은 서버와 같은 maxAssessedDate(오늘 KST)로 맞춰 미래 입력을 막는다.
 * 저장은 `createGradeRecord` / `updateGradeRecord`가 권한을 다시 검사한다.
 *
 * 의도적으로 하지 않는 일:
 * - 삭제 UI를 두지 않음.
 * - 만점·점수 검증을 여기서 끝내지 않음. 서버가 다시 본다.
 *
 * 관련: `grades/actions.ts`, `formatters.ts`.
 */

import { useState, useTransition } from "react"; // 로컬 UI. 권한 판정은 서버.
import { useRouter } from "next/navigation"; // refresh. redirect 페이로드가 아니다.
import { // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    createGradeRecord, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    updateGradeRecord, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
} from "@/features/grades/actions"; // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
import { formatGradeDate } from "@/features/grades/formatters"; // ISO → KST 연·월·일.
import type { // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    GradesGradeRow, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    GradesStudentOption, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
} from "@/features/grades/types"; // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
import styles from "../GradesManagementScreen.module.css"; // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.

type GradeRecordsPanelProps = { // GradeRecordsPanelProps 타입. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    student: GradesStudentOption; // 스코프·존재 검사. 학부모 뷰어 쿼리가 아니다.
    grades: GradesGradeRow[]; // grades. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    maxAssessedDate: string; // 오늘 KST. UTC 자정이 아니다.
    onFeedback: (message: string) => void; // 부모 한 줄. 탭 전환 시 지운다.
};

/**
 * 성적 폼. 수정 중이면 gradeId로 update, 아니면 선택 학생으로 create.
 *
 * @param maxAssessedDate date input의 max이자 클라이언트 선검사 기준.
 */
export default function GradeRecordsPanel({ // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    student, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    grades, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    maxAssessedDate, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    onFeedback, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
}: GradeRecordsPanelProps) { // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const router = useRouter(); // router. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [isSaving, startSaving] = useTransition(); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [gradeTitle, setGradeTitle] = useState("주간 테스트"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [subject, setSubject] = useState("수학"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [score, setScore] = useState("80"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [maxScore, setMaxScore] = useState("100"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    const [assessedDate, setAssessedDate] = useState(maxAssessedDate); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.

    function resetForm() { // resetForm. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setEditingGradeId(null); // 수정 모드를 끄고 기본값으로.
        setGradeTitle("주간 테스트"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setSubject("수학"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setScore("80"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setMaxScore("100"); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setAssessedDate(maxAssessedDate); // 평가일은 오늘(KST) 상한.
    }

    function startEditing(grade: GradesGradeRow) { // startEditing. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setEditingGradeId(grade.id); // 기존 행을 폼에 채운다. date input은 YYYY-MM-DD만.
        setGradeTitle(grade.title); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setSubject(grade.subject); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setScore(String(grade.score)); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setMaxScore(String(grade.maxScore)); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        setAssessedDate(grade.assessedAt.slice(0, 10)); // ISO에서 날짜만.
    }

    function saveGrade() { // saveGrade. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        if (!assessedDate || assessedDate > maxAssessedDate) { // 가드. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            onFeedback("평가일은 오늘 이후로 지정할 수 없습니다."); // 서버 isFutureKstDate와 같은 상한. 네트워크 전에 막는다.
            return; // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        }

        startSaving(async () => { // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            const result = editingGradeId // result. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                ? await updateGradeRecord({ // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                      gradeId: editingGradeId, // 수정. studentId는 서버가 기존 행에서 읽는다.
                      title: gradeTitle, // 제목. 서버가 길이를 다시 본다.
                      subject, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                      score: Number(score), // 점수. 만점을 넘으면 거절.
                      maxScore: Number(maxScore), // 만점. 0 이하면 거절. percent는 뷰어만.
                      assessedAt: assessedDate, // 평가일 YYYY-MM-DD. KST 오늘을 넘기면 거절.
                  })
                : await createGradeRecord({ // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                      studentId: student.id, // 원생 카드. User id가 아니다.
                      title: gradeTitle, // 제목. 서버가 길이를 다시 본다.
                      subject, // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                      score: Number(score), // 점수. 만점을 넘으면 거절.
                      maxScore: Number(maxScore), // 만점. 0 이하면 거절. percent는 뷰어만.
                      assessedAt: assessedDate, // 평가일 YYYY-MM-DD. KST 오늘을 넘기면 거절.
                      classId: student.classId, // 화면 목록의 현재 반. 미배정이면 null. 권한은 서버 take:1 담임.
                  });

            onFeedback(result.message); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            if (result.ok) { // 가드. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                resetForm(); // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                router.refresh(); // 폼을 비우고 서버 목록을 다시 읽는다.
            }
        });
    }

    return ( // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        <> // JSX. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            <div // 제목·과목·점수·만점·평가일. max는 오늘 KST.
                className={styles.form} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            > // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                <label className={styles.field}> // label. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <span>제목</span> // span. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <input // input. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        value={gradeTitle} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        onChange={(event) => setGradeTitle(event.target.value)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    /> // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                </label> // label 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                <label className={styles.field}> // label. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <span>과목</span> // span. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <input // input. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        value={subject} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        onChange={(event) => setSubject(event.target.value)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    /> // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                </label> // label 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                <div className={styles.row2}> // div. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <label className={styles.field}> // label. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        <span>점수</span> // span. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        <input // input. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            type="number" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            value={score} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            onChange={(event) => setScore(event.target.value)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        /> // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    </label> // label 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <label className={styles.field}> // label. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        <span>만점</span> // span. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        <input // input. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            type="number" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            value={maxScore} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            onChange={(event) => setMaxScore(event.target.value)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        /> // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    </label> // label 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                </div> // div 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                <label className={styles.field}> // label. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <span>평가일</span> // span. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <input // input. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        type="date" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        value={assessedDate} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        max={maxAssessedDate} // 오늘 KST. 서버가 다시 본다.
                        onChange={(event) => setAssessedDate(event.target.value)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    /> // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                </label> // label 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                <div className={styles.actions}> // div. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    {editingGradeId && ( // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        <button // button. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            type="button" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            className={styles.secondaryBtn} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            onClick={resetForm} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        > // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            새로 작성 // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        </button> // button 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    )}
                    <button // button. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        type="button" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        className={styles.primaryBtn} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        onClick={saveGrade} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    > // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        {isSaving // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            ? "처리 중…" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            : editingGradeId // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                              ? "성적 수정" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                              : "성적 저장"} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    </button> // button 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                </div> // div 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            </div> // div 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.

            <ul // 이 학생 성적. 수정은 폼을 채운다. 삭제는 없다.
                className={styles.list} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
            > // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                {grades.length === 0 ? ( // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    <li className={styles.hint}>등록된 성적이 없습니다.</li> // li. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                ) : ( // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    grades.map((grade) => ( // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        <li key={grade.id} className={styles.row}> // li. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            <div> // div. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                <strong> // strong. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                    {grade.title} · {grade.subject} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                </strong> // strong 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                <small> // small. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                    {grade.score}/{grade.maxScore} ·{" "} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                    {formatGradeDate(grade.assessedAt)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                </small> // small 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            </div> // div 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            <button // button. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                type="button" // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                className={styles.secondaryBtn} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                disabled={isSaving} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                onClick={() => startEditing(grade)} // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            > // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                                수정 // 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                            </button> // button 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                        </li> // li 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
                    ))
                )}
            </ul> // ul 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
        </> // 태그 닫기. 성적 입력 UI. 권한은 서버 take:1. 삭제 UI 없음.
    );
}
