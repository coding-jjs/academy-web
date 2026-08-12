"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import type { StaffReportStudent } from "@/features/reports/types";
import {
    regenerateDraftWithAi,
    requestReportApproval,
    saveDraftReport,
} from "@/features/reports/staff-actions";
import {
    getDefaultReportPeriod,
    getStudentReportStatus,
    REPORT_KEYWORD_OPTIONS,
    REPORT_STATUS_METADATA,
    REPORT_TONE_OPTIONS,
} from "@/features/reports/presentation";
import { formatStudentSchool } from "@/features/students/presentation";
import styles from "../StaffReportsScreen.module.css";

export default function ReportEditor({
    student,
}: {
    student: StaffReportStudent;
}) {
    const router = useRouter();
    const [isProcessing, startProcessing] = useTransition();
    const [keyword, setKeyword] = useState(
        student.report?.keywords[0] ?? REPORT_KEYWORD_OPTIONS[0],
    );
    const [tone, setTone] = useState(REPORT_TONE_OPTIONS[0]);
    const [content, setContent] = useState(student.report?.content ?? "");
    const [feedback, setFeedback] = useState<string | null>(null);
    const status = getStudentReportStatus(student);
    const statusMetadata = REPORT_STATUS_METADATA[status];
    const canEdit = ["UNWRITTEN", "DRAFTING", "REJECTED"].includes(status);

    function getReportPeriod() {
        if (!student.report) return getDefaultReportPeriod();

        return {
            periodStart: student.report.periodStart.slice(0, 10),
            periodEnd: student.report.periodEnd.slice(0, 10),
        };
    }

    function saveDraft() {
        if (!student.studentProfileId) {
            setFeedback("학생 프로필이 없어 저장할 수 없습니다.");
            return;
        }
        if (!content.trim()) {
            setFeedback("본문을 입력해 주세요.");
            return;
        }

        const reportPeriod = getReportPeriod();
        startProcessing(async () => {
            const result = await saveDraftReport({
                studentId: student.studentProfileId!,
                content,
                keywords: [keyword],
                ...reportPeriod,
            });
            setFeedback(
                result.ok
                    ? (result.message ?? "초안을 저장했습니다.")
                    : result.message,
            );
            if (result.ok) router.refresh();
        });
    }

    function regenerateDraft() {
        if (!student.studentProfileId) {
            setFeedback("학생 프로필이 없어 생성할 수 없습니다.");
            return;
        }

        const reportPeriod = getReportPeriod();
        startProcessing(async () => {
            const result = await regenerateDraftWithAi({
                studentId: student.studentProfileId!,
                keywords: [keyword],
                tone,
                ...reportPeriod,
            });
            if (!result.ok) {
                setFeedback(result.message);
                return;
            }
            if (result.content) setContent(result.content);
            setFeedback(result.message ?? "AI 초안을 생성했습니다.");
            router.refresh();
        });
    }

    function requestApproval() {
        if (!canEdit || !content.trim()) {
            setFeedback("본문이 비어 있어 승인 요청할 수 없습니다.");
            return;
        }

        startProcessing(async () => {
            if (!student.studentProfileId) {
                setFeedback("학생 프로필이 없어 승인 요청할 수 없습니다.");
                return;
            }

            const saveResult = await saveDraftReport({
                studentId: student.studentProfileId,
                content,
                keywords: [keyword],
                ...getReportPeriod(),
            });
            if (!saveResult.ok) {
                setFeedback(saveResult.message);
                return;
            }

            const reportId = saveResult.reportId;

            if (!reportId) {
                setFeedback("저장된 리포트 ID를 확인하지 못했습니다.");
                return;
            }

            const result = await requestReportApproval({ reportId });
            setFeedback(
                result.ok
                    ? (result.message ?? "승인 요청을 보냈습니다.")
                    : result.message,
            );
            if (result.ok) router.refresh();
        });
    }

    return (
        <article className={styles.editorPanel}>
            <div className={styles.panelHead}>
                <h2>{student.name} 보고서</h2>
                <StatusChip tone={statusMetadata.tone}>
                    {statusMetadata.label}
                </StatusChip>
            </div>
            <div className={styles.meta}>
                <div>
                    <span>학교·학년</span>
                    <strong>
                        {formatStudentSchool(student.schoolName, student.grade)}
                    </strong>
                </div>
                <div>
                    <span>반</span>
                    <strong>{student.className ?? "미배정"}</strong>
                </div>
            </div>

            {student.report?.rejectionReason && (
                <div className={styles.rejectBox}>
                    <strong>반려 사유</strong>
                    <p>{student.report.rejectionReason}</p>
                </div>
            )}

            <label className={styles.field}>
                평가 키워드
                <select
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    disabled={!canEdit || isProcessing}
                >
                    {REPORT_KEYWORD_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </label>
            <label className={styles.field}>
                톤
                <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                    disabled={!canEdit || isProcessing}
                >
                    {REPORT_TONE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </label>
            <label className={styles.field}>
                초안
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    disabled={!canEdit || isProcessing}
                    rows={8}
                    placeholder="AI 초안이 여기에 표시됩니다."
                />
            </label>
            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.secondary}
                    disabled={!canEdit || isProcessing || !student.studentProfileId}
                    onClick={saveDraft}
                >
                    {isProcessing ? "처리 중..." : "초안 저장"}
                </button>
                <button
                    type="button"
                    className={styles.secondary}
                    disabled={!canEdit || isProcessing || !student.studentProfileId}
                    onClick={regenerateDraft}
                >
                    {isProcessing ? "처리 중..." : "AI 재생성"}
                </button>
                <button
                    type="button"
                    disabled={!canEdit || isProcessing}
                    onClick={requestApproval}
                >
                    {isProcessing ? "처리 중..." : "승인 요청"}
                </button>
            </div>

            {feedback && <p className={styles.hint}>{feedback}</p>}
            {!student.studentProfileId && (
                <p className={styles.hint}>
                    학생 프로필이 없어 아직 리포트를 저장할 수 없습니다.
                </p>
            )}
        </article>
    );
}
