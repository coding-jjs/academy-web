"use client";

/**
 * 원장 원생 워크스페이스 (클라이언트).
 *
 * `/director/students`가 연결. 교사 StaffStudentsScreen을 쓰지 않는다.
 * props: students, classOptions, counselingMemos.
 * 테이블·상세(`DirectorStudentDetail` director-actions)·상담
 * (`DirectorStudentCounseling` → createDirectorCounselingMemo)을 조합한다.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StaffCounselingMemo } from "@/features/counseling/types";
import type {
    DirectorClassOption,
    DirectorStudent,
    StudentStatus,
} from "@/features/students/types";
import { STUDENT_STATUS_METADATA } from "@/features/students/presentation";
import {
    cx,
    fieldStyles,
    pageHeadingStyles,
    screenStyles,
    surfaceStyles,
} from "@/components/ui/shared-styles";
import DirectorStudentCounseling from "./components/DirectorStudentCounseling";
import DirectorStudentDetail from "./components/DirectorStudentDetail";
import DirectorStudentTable from "./components/DirectorStudentTable";
import styles from "./DirectorStudentsScreen.module.css";

type PanelMode = "class" | "counseling";

/** 필터와 반/상담 패널 모드를 고른다. */
export default function DirectorStudentsScreen({
    students,
    classOptions,
    counselingMemos,
}: {
    students: DirectorStudent[];
    classOptions: DirectorClassOption[];
    counselingMemos: StaffCounselingMemo[];
}) {
    const [panelMode, setPanelMode] = useState<PanelMode | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>(
        "ALL",
    );
    const [classFilter, setClassFilter] = useState("ALL");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
        null,
    );

    const metrics = useMemo(() => {
        const enrolledCount = students.filter(
            (student) => student.status === "ENROLLED",
        ).length;
        const pausedCount = students.filter(
            (student) => student.status === "PAUSED",
        ).length;
        const unlinkedParentCount = students.filter(
            (student) => student.parentCount === 0,
        ).length;

        return [
            {
                label: STUDENT_STATUS_METADATA.ENROLLED.label,
                value: `${enrolledCount}명`,
                detail: "ENROLLED",
            },
            {
                label: STUDENT_STATUS_METADATA.PAUSED.label,
                value: `${pausedCount}명`,
                detail: "PAUSED",
            },
            {
                label: "학부모 미연결",
                value: `${unlinkedParentCount}명`,
                detail: "연결 필요",
            },
        ];
    }, [students]);

    const filteredStudents = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return students.filter((student) => {
            if (statusFilter !== "ALL" && student.status !== statusFilter) {
                return false;
            }
            if (
                classFilter !== "ALL" &&
                !student.classes.some(
                    (enrollment) => enrollment.classId === classFilter,
                )
            ) {
                return false;
            }
            if (!normalizedQuery) return true;

            const searchableText = [
                student.name,
                student.schoolName,
                student.grade,
                ...student.classes.map((enrollment) => enrollment.className),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return searchableText.includes(normalizedQuery);
        });
    }, [students, searchQuery, statusFilter, classFilter]);

    const selectedStudent =
        students.find((student) => student.id === selectedStudentId) ?? null;

    const selectedMemos = useMemo(() => {
        if (!selectedStudentId) return [];
        return counselingMemos.filter(
            (memo) => memo.studentId === selectedStudentId,
        );
    }, [counselingMemos, selectedStudentId]);

    function openPanel(studentId: string, mode: PanelMode) {
        setSelectedStudentId(studentId);
        setPanelMode(mode);
    }

    function closePanel() {
        setSelectedStudentId(null);
        setPanelMode(null);
    }

    return (
        <section className={screenStyles.animatedPage}>
            <header className={pageHeadingStyles.root}>
                <div>
                    <span>STUDENTS</span>
                    <h1>학생 관리</h1>
                    <p>재원 상태, 반 배정, 출결과 학습 기록을 관리합니다.</p>
                </div>
                <Link href="/director/users" className={styles.headerLink}>
                    가입 사용자로 이동
                </Link>
            </header>
            <div className={styles.metrics}>
                {metrics.map((metric) => (
                    <article
                        key={metric.label}
                        className={surfaceStyles.root}
                    >
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                        <p>{metric.detail}</p>
                    </article>
                ))}
            </div>
            <div className={styles.layout} data-open={Boolean(selectedStudent)}>
                <div className={cx(surfaceStyles.root, styles.tablePanel)}>
                    <div className={styles.filters}>
                        <label className={fieldStyles.root}>
                            학생 검색
                            <input
                                type="search"
                                placeholder="이름 또는 반"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                            />
                        </label>
                        <label className={fieldStyles.root}>
                            상태
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as
                                            | "ALL"
                                            | StudentStatus,
                                    )
                                }
                            >
                                <option value="ALL">전체</option>
                                <option value="ENROLLED">재원</option>
                                <option value="PAUSED">휴원</option>
                                <option value="WITHDRAWN">퇴원</option>
                            </select>
                        </label>
                        <label className={fieldStyles.root}>
                            반
                            <select
                                value={classFilter}
                                onChange={(event) =>
                                    setClassFilter(event.target.value)
                                }
                            >
                                <option value="ALL">전체 반</option>
                                {classOptions.map((academyClass) => (
                                    <option
                                        key={academyClass.id}
                                        value={academyClass.id}
                                    >
                                        {academyClass.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <DirectorStudentTable
                        students={filteredStudents}
                        totalStudentCount={students.length}
                        selectedStudentId={selectedStudentId}
                        panelMode={panelMode}
                        onSelectClass={(studentId) =>
                            openPanel(studentId, "class")
                        }
                        onSelectCounseling={(studentId) =>
                            openPanel(studentId, "counseling")
                        }
                    />
                </div>
                {selectedStudent && panelMode === "class" && (
                    <DirectorStudentDetail
                        key={`class-${selectedStudent.id}`}
                        student={selectedStudent}
                        classOptions={classOptions}
                        onClose={closePanel}
                    />
                )}

                {selectedStudent && panelMode === "counseling" && (
                    <DirectorStudentCounseling
                        key={`counseling-${selectedStudent.id}`}
                        student={selectedStudent}
                        memos={selectedMemos}
                        onClose={closePanel}
                    />
                )}
            </div>
        </section>
    );
}
