"use client";

/**
 * 원장·직원 성적·오답 관리 화면. 학생을 고르면 해당 워크스페이스를 연다.
 *
 * 호출: `/director/grades`, `/teacher/grades`가 `getGradesManagementData` 결과를 넘긴다.
 * canManage가 아니면 입력 UI를 숨겨 권한 없는 직원이 폼을 보지 못하게 한다.
 *
 * 목록에서 고른 학생의 성적·오답만 패널에 넘긴다. 저장 권한 검사는 서버 `actions.ts`가 다시 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 뷰어 UI → 각 역할 화면.
 * - 권한 키를 클라이언트에서 해석하지 않음. canManage는 페이지가 계산한다.
 *
 * 관련: `StudentGradesWorkspace.tsx`, `data.ts`.
 */

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import StudentGradesWorkspace from "@/features/grades/components/StudentGradesWorkspace";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
} from "@/features/grades/types";
import styles from "./GradesManagementScreen.module.css";

type GradesManagementScreenProps = {
    students: GradesStudentOption[];
    grades: GradesGradeRow[];
    wrongNotes: GradesWrongRow[];
    canManage: boolean;
    maxAssessedDate: string;
    deniedMessage?: string;
};

/**
 * 성적 입력 셸. canManage=false면 폼 없이 안내만 보여 권한이 없는 직원이 입력을 시도하지 못하게 한다.
 *
 * @param maxAssessedDate 서버가 준 오늘(KST). 평가일 상한.
 */
export default function GradesManagementScreen({
    students,
    grades,
    wrongNotes,
    canManage,
    maxAssessedDate,
    deniedMessage,
}: GradesManagementScreenProps) {
    const [selectedStudentId, setSelectedStudentId] = useState(
        students[0]?.id ?? "",
    );
    const selectedStudent =
        students.find((student) => student.id === selectedStudentId) ??
        students[0] ??
        null;

    const selectedStudentGrades = useMemo(
        () =>
            grades.filter(
                (grade) => grade.studentId === selectedStudent?.id,
            ),
        [grades, selectedStudent?.id],
    );
    const selectedStudentWrongNotes = useMemo(
        () =>
            wrongNotes.filter(
                (wrongNote) => wrongNote.studentId === selectedStudent?.id,
            ),
        [wrongNotes, selectedStudent?.id],
    );

    if (!canManage) {
        return (
            <section
                className={styles.page}
            >
                <header className={styles.heading}>
                    <div>
                        <span>GRADES</span>
                        <h1>성적·오답</h1>
                        <p>{deniedMessage ?? "성적 입력 권한이 없습니다."}</p>
                    </div>
                </header>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header
                className={styles.heading}
            >
                <div>
                    <span>GRADES</span>
                    <h1>성적·오답</h1>
                    <p>학생 성적을 기록하고 오답 노트를 관리합니다.</p>
                </div>
            </header>
            {!selectedStudent ? (
                <p className={styles.hint}>표시할 학생이 없습니다.</p>
            ) : (
                <div className={styles.layout}>
                    <article
                        className={styles.panel}
                    >
                        <div className={styles.panelHead}>
                            <h2>학생</h2>
                            <StatusChip>{students.length}명</StatusChip>
                        </div>
                        <ul className={styles.studentList}>
                            {students.map((student) => (
                                <li key={student.id}>
                                    <button
                                        type="button"
                                        className={
                                            student.id === selectedStudent.id
                                                ? styles.studentActive
                                                : styles.studentBtn
                                        }
                                        onClick={() =>
                                            setSelectedStudentId(student.id)
                                        }
                                    >
                                        <strong>{student.name}</strong>
                                        <small>
                                            {student.className ?? "미배정"}
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </article>
                    <StudentGradesWorkspace
                        key={selectedStudent.id}
                        student={selectedStudent}
                        grades={selectedStudentGrades}
                        wrongNotes={selectedStudentWrongNotes}
                        maxAssessedDate={maxAssessedDate}
                    />
                </div>
            )}
        </section>
    );
}
