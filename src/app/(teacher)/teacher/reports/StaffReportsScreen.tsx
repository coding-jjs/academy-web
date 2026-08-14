"use client";

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import type { StaffReportStudent } from "@/features/reports/types";
import {
    buttonStyles,
    cx,
    emptyStateStyles,
    fieldStyles,
    pageHeadingStyles,
    panelStyles,
    screenStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import ReportEditor from "./components/ReportEditor";
import ReportStudentList from "./components/ReportStudentList";
import { getStudentReportStatus } from "@/features/reports/presentation";
import styles from "./StaffReportsScreen.module.css";

export default function StaffReportsScreen({
    students,
}: {
    students: StaffReportStudent[];
}) {
    const [selectedStudentId, setSelectedStudentId] = useState(
        students[0]?.id ?? "",
    );
    const selectedStudent =
        students.find((student) => student.id === selectedStudentId) ??
        students[0] ??
        null;
    const metrics = useMemo(() => {
        const counts = {
            unwritten: 0,
            drafting: 0,
            pendingApproval: 0,
            rejected: 0,
        };

        for (const student of students) {
            const status = getStudentReportStatus(student);
            if (status === "UNWRITTEN" || status === "FAILED") {
                counts.unwritten += 1;
            } else if (status === "DRAFTING") {
                counts.drafting += 1;
            } else if (status === "PENDING_APPROVAL") {
                counts.pendingApproval += 1;
            } else if (status === "REJECTED") {
                counts.rejected += 1;
            }
        }

        return [
            {
                label: "미작성",
                value: `${counts.unwritten}명`,
                detail: "작성 필요",
                tone: "neutral" as const,
            },
            {
                label: "작성 중",
                value: `${counts.drafting}명`,
                detail: "초안 편집",
                tone: "neutral" as const,
            },
            {
                label: "승인·반려",
                value: `${counts.pendingApproval} / ${counts.rejected}`,
                detail: `학생 ${students.length}명`,
                tone: "warning" as const,
            },
        ];
    }, [students]);

    return (
        <section className={screenStyles.animatedPage}>
            <header className={pageHeadingStyles.root}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>AI REPORT</span>
                    <h1>AI 리포트 작성</h1>
                    <p>학습 기록을 바탕으로 리포트 초안을 만들고 검토합니다.</p>
                </div>
            </header>

            <div className={styles.metrics}>
                {metrics.map((metric) => (
                    <article key={metric.label} className={surfaceStyles.root}>
                        <StatusChip tone={metric.tone}>
                            {metric.label}
                        </StatusChip>
                        <strong>{metric.value}</strong>
                        <p>{metric.detail}</p>
                    </article>
                ))}
            </div>

            {!selectedStudent ? (
                <div className={cx(surfaceStyles.root, emptyStateStyles.root)}>
                    <h2>표시할 학생이 없습니다</h2>
                    <p>학생 역할이 부여되면 이곳에 나타납니다.</p>
                </div>
            ) : (
                <div className={styles.layout}>
                    <ReportStudentList
                        students={students}
                        selectedStudentId={selectedStudent.id}
                        onSelect={setSelectedStudentId}
                    />
                    <ReportEditor
                        key={`${selectedStudent.id}:${selectedStudent.report?.id ?? "none"}:${selectedStudent.submittedReport?.id ?? "none"}:${selectedStudent.submittedReport?.updatedAt ?? ""}`}
                        student={selectedStudent}
                    />
                </div>
            )}
        </section>
    );
}
