"use client";

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

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createGradeRecord,
    updateGradeRecord,
} from "@/features/grades/actions";
import { formatGradeDate } from "@/features/grades/formatters";
import type {
    GradesGradeRow,
    GradesStudentOption,
} from "@/features/grades/types";
import styles from "../GradesManagementScreen.module.css";

type GradeRecordsPanelProps = {
    student: GradesStudentOption;
    grades: GradesGradeRow[];
    maxAssessedDate: string;
    onFeedback: (message: string) => void;
};

/**
 * 성적 폼. 수정 중이면 gradeId로 update, 아니면 선택 학생으로 create.
 *
 * @param maxAssessedDate date input의 max이자 클라이언트 선검사 기준.
 */
export default function GradeRecordsPanel({
    student,
    grades,
    maxAssessedDate,
    onFeedback,
}: GradeRecordsPanelProps) {
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
    const [gradeTitle, setGradeTitle] = useState("주간 테스트");
    const [subject, setSubject] = useState("수학");
    const [score, setScore] = useState("80");
    const [maxScore, setMaxScore] = useState("100");
    const [assessedDate, setAssessedDate] = useState(maxAssessedDate);

    function resetForm() {
        setEditingGradeId(null);
        setGradeTitle("주간 테스트");
        setSubject("수학");
        setScore("80");
        setMaxScore("100");
        setAssessedDate(maxAssessedDate);
    }

    function startEditing(grade: GradesGradeRow) {
        setEditingGradeId(grade.id);
        setGradeTitle(grade.title);
        setSubject(grade.subject);
        setScore(String(grade.score));
        setMaxScore(String(grade.maxScore));
        setAssessedDate(grade.assessedAt.slice(0, 10));
    }

    function saveGrade() {
        if (!assessedDate || assessedDate > maxAssessedDate) {
            onFeedback("평가일은 오늘 이후로 지정할 수 없습니다.");
            return;
        }

        startSaving(async () => {
            const result = editingGradeId
                ? await updateGradeRecord({
                      gradeId: editingGradeId,
                      title: gradeTitle,
                      subject,
                      score: Number(score),
                      maxScore: Number(maxScore),
                      assessedAt: assessedDate,
                  })
                : await createGradeRecord({
                      studentId: student.id,
                      title: gradeTitle,
                      subject,
                      score: Number(score),
                      maxScore: Number(maxScore),
                      assessedAt: assessedDate,
                      classId: student.classId,
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
                    <span>제목</span>
                    <input
                        value={gradeTitle}
                        onChange={(event) => setGradeTitle(event.target.value)}
                        disabled={isSaving}
                    />
                </label>
                <label className={styles.field}>
                    <span>과목</span>
                    <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        disabled={isSaving}
                    />
                </label>
                <div className={styles.row2}>
                    <label className={styles.field}>
                        <span>점수</span>
                        <input
                            type="number"
                            value={score}
                            onChange={(event) => setScore(event.target.value)}
                            disabled={isSaving}
                        />
                    </label>
                    <label className={styles.field}>
                        <span>만점</span>
                        <input
                            type="number"
                            value={maxScore}
                            onChange={(event) => setMaxScore(event.target.value)}
                            disabled={isSaving}
                        />
                    </label>
                </div>
                <label className={styles.field}>
                    <span>평가일</span>
                    <input
                        type="date"
                        value={assessedDate}
                        max={maxAssessedDate}
                        onChange={(event) => setAssessedDate(event.target.value)}
                        disabled={isSaving}
                    />
                </label>
                <div className={styles.actions}>
                    {editingGradeId && (
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
                        onClick={saveGrade}
                    >
                        {isSaving
                            ? "처리 중…"
                            : editingGradeId
                              ? "성적 수정"
                              : "성적 저장"}
                    </button>
                </div>
            </div>
            <ul
                className={styles.list}
            >
                {grades.length === 0 ? (
                    <li className={styles.hint}>등록된 성적이 없습니다.</li>
                ) : (
                    grades.map((grade) => (
                        <li key={grade.id} className={styles.row}>
                            <div>
                                <strong>
                                    {grade.title} · {grade.subject}
                                </strong>
                                <small>
                                    {grade.score}/{grade.maxScore} ·
                                    {formatGradeDate(grade.assessedAt)}
                                </small>
                            </div>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                disabled={isSaving}
                                onClick={() => startEditing(grade)}
                            >
                                수정
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </>
    );
}
