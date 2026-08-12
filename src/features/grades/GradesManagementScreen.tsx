"use client";

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
            <section className={styles.page}>
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
            <header className={styles.heading}>
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
                    <article className={styles.panel}>
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
