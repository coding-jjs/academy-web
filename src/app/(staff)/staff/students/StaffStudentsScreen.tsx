"use client";

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import type {
    StaffClassOption,
    StaffStudentRow,
} from "@/features/students/types";
import StaffStudentDetail from "./components/StaffStudentDetail";
import StaffStudentList from "./components/StaffStudentList";
import styles from "./StaffStudentsScreen.module.css";

export default function StaffStudentsScreen({
    viewAllStudents,
    students,
    classes,
}: {
    viewAllStudents: boolean;
    students: StaffStudentRow[];
    classes: StaffClassOption[];
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("ALL");
    const [selectedStudentId, setSelectedStudentId] = useState(
        students[0]?.id ?? "",
    );
    const [showLearningRecordForm, setShowLearningRecordForm] = useState(false);

    const filteredStudents = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return students.filter((student) => {
            const matchesClass =
                selectedClassId === "ALL" ||
                student.classes.some(
                    (academyClass) => academyClass.id === selectedClassId,
                );
            const matchesQuery =
                !normalizedQuery ||
                student.name.toLowerCase().includes(normalizedQuery) ||
                student.classes.some((academyClass) =>
                    academyClass.name.toLowerCase().includes(normalizedQuery),
                );

            return matchesClass && matchesQuery;
        });
    }, [students, searchQuery, selectedClassId]);

    const selectedStudent =
        filteredStudents.find(
            (student) => student.id === selectedStudentId,
        ) ??
        filteredStudents[0] ??
        null;
    const writableClassIds = useMemo(
        () => new Set(classes.map((academyClass) => academyClass.id)),
        [classes],
    );

    function selectStudent(studentId: string) {
        setSelectedStudentId(studentId);
        setShowLearningRecordForm(false);
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MY STUDENTS</span>
                    <h1>담당 학생</h1>
                    <p>담당 학생의 출결과 최근 학습 기록을 확인합니다.</p>
                </div>
                <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={!selectedStudent}
                    onClick={() =>
                        setShowLearningRecordForm((isVisible) => !isVisible)
                    }
                >
                    {showLearningRecordForm ? "닫기" : "기록 작성"}
                </button>
            </header>

            <div className={styles.filters}>
                <label className={styles.field}>
                    <span>학생 검색</span>
                    <input
                        type="search"
                        placeholder="이름 또는 반"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </label>
                <label className={styles.field}>
                    <span>반</span>
                    <select
                        value={selectedClassId}
                        onChange={(event) =>
                            setSelectedClassId(event.target.value)
                        }
                    >
                        <option value="ALL">전체 반</option>
                        {classes.map((academyClass) => (
                            <option key={academyClass.id} value={academyClass.id}>
                                {academyClass.name}
                            </option>
                        ))}
                    </select>
                </label>
                <StatusChip>
                    {viewAllStudents ? "전체 학생" : "담당 반"} ·{" "}
                    {filteredStudents.length}명
                </StatusChip>
            </div>

            {students.length === 0 ? (
                <div className={styles.empty}>
                    <h2>담당 학생이 없습니다</h2>
                    <p>반 배정이 되면 이곳에 학생이 표시됩니다.</p>
                </div>
            ) : (
                <div className={styles.layout}>
                    <StaffStudentList
                        students={filteredStudents}
                        selectedStudentId={selectedStudent?.id ?? null}
                        onSelect={selectStudent}
                    />
                    {selectedStudent && (
                        <StaffStudentDetail
                            student={selectedStudent}
                            showLearningRecordForm={showLearningRecordForm}
                            writableClassIds={writableClassIds}
                        />
                    )}
                </div>
            )}
        </section>
    );
}
