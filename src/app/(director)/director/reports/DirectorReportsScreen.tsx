"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    getStudentReportStatus,
    REPORT_STATUS_METADATA,
} from "@/features/reports/presentation";
import type { DirectorReportStudent } from "@/features/reports/types";
import {
    approveAndSendReport,
    rejectReport,
} from "@/features/reports/director-actions";
import DirectorReportDetail from "./components/DirectorReportDetail";
import DirectorReportStudentTable from "./components/DirectorReportStudentTable";
import styles from "./DirectorReportsScreen.module.css";

export default function DirectorReportsScreen({ students }: { students: DirectorReportStudent[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeStudentId, setActiveStudentId] = useState<string | null>(students[0]?.id ?? null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const statistics = useMemo(() => getReportStatistics(students), [students]);
    const activeStudent = students.find((student) => student.id === activeStudentId) ?? null;
    const activeStatus = activeStudent ? getStudentReportStatus(activeStudent) : null;

    function selectStudent(studentId: string) {
        setActiveStudentId(studentId);
        setFeedback(null);
        setRejectionReason("");
    }

    function approveReport() {
        if (!activeStudent?.report?.id) return;
        setFeedback(null);
        startTransition(async () => {
            const result = await approveAndSendReport({ reportId: activeStudent.report!.id });
            if (!result.ok) return setFeedback(result.message);
            setFeedback("승인·발송 완료");
            router.refresh();
        });
    }

    function rejectActiveReport() {
        if (!activeStudent?.report?.id) return;
        if (!rejectionReason.trim()) return setFeedback("반려 사유를 입력해 주세요.");
        setFeedback(null);
        startTransition(async () => {
            const result = await rejectReport({ reportId: activeStudent.report!.id, rejectionReason });
            if (!result.ok) return setFeedback(result.message);
            setFeedback("반려 처리 완료");
            setRejectionReason("");
            router.refresh();
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}><div><span>AI REPORT</span><h1>리포트 승인</h1><p>역할이 학생인 사용자를 기준으로 리포트 상태를 확인합니다.</p></div></header>
            <div className={styles.metrics}>{statistics.map((item) => <article key={item.label}><StatusChip tone={item.tone}>{item.label}</StatusChip><strong>{item.value}</strong><p>{item.detail}</p></article>)}</div>
            {students.length === 0 ? <div className={styles.emptyPanel}><h2>표시할 학생이 없습니다</h2><p>가입 사용자에서 역할을 학생으로 부여하면 이곳에 나타납니다.</p></div> : (
                <div className={styles.layout}>
                    <DirectorReportStudentTable students={students} activeStudentId={activeStudentId} onSelect={selectStudent} />
                    <DirectorReportDetail student={activeStudent} status={activeStatus} rejectionReason={rejectionReason} feedback={feedback} isPending={isPending} onRejectionReasonChange={setRejectionReason} onReject={rejectActiveReport} onApprove={approveReport} />
                </div>
            )}
        </section>
    );
}

function getReportStatistics(students: DirectorReportStudent[]) {
    const counts = { PENDING_APPROVAL: 0, REJECTED: 0, SENT: 0, UNWRITTEN: 0 };
    for (const student of students) {
        const status = getStudentReportStatus(student);
        if (status in counts) counts[status as keyof typeof counts] += 1;
        else if (status === "DRAFTING" || status === "FAILED") counts.UNWRITTEN += 1;
    }
    return [
        { label: REPORT_STATUS_METADATA.PENDING_APPROVAL.label, value: `${counts.PENDING_APPROVAL}건`, detail: "선생님 작성 완료", tone: "warning" as const },
        { label: REPORT_STATUS_METADATA.REJECTED.label, value: `${counts.REJECTED}건`, detail: "재작성 중", tone: "danger" as const },
        { label: "발송·미작성", value: `${counts.SENT} / ${counts.UNWRITTEN}`, detail: `학생 ${students.length}명`, tone: "success" as const },
    ];
}
