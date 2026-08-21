"use client";

/**
 * 리포트 초안 편집·AI 재생성·승인 요청 UI (클라이언트).
 *
 * 저장: `saveDraftReport`, `regenerateDraftWithAi`, `requestReportApproval`
 * (staff-actions). 교사가 바로 발송하지 않고 원장 큐로 넘긴다.
 *
 * props: student — 선택된 StaffReportStudent.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    buttonStyles,
    cx,
    fieldStyles,
    panelStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import type {
    StaffReportItem,
    StaffReportStudent,
} from "@/features/reports/types";
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

/** 기간을 `YYYY-MM-DD ~ YYYY-MM-DD`로. */
function formatPeriod(report: StaffReportItem) {
    return `${report.periodStart.slice(0, 10)} ~ ${report.periodEnd.slice(0, 10)}`;
}

/** 제출 시각을 한국어 월/일 시:분으로. */
function formatSubmittedAt(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

/** 이미 제출·발송된 리포트 본문 카드. 여기서는 수정하지 않는다. */
function SubmittedReportCard({
    report,
    title,
}: {
    report: StaffReportItem;
    title: string;
}) {
    return (
        <div className={styles.submittedBox}>
            <div className={styles.submittedHead}>
                <strong>{title}</strong>
                <StatusChip
                    tone={REPORT_STATUS_METADATA[report.status].tone}
                >
                    {REPORT_STATUS_METADATA[report.status].label}
                </StatusChip>
            </div>
            <p className={styles.submittedMeta}>
                기간 {formatPeriod(report)}
                {report.keywords[0] ? ` · ${report.keywords[0]}` : ""}
                {` · ${report.teacherName}`}
                {report.updatedAt
                    ? ` · ${formatSubmittedAt(report.updatedAt)}`
                    : ""}
            </p>
            <p className={styles.submittedBody}>
                {report.content.trim() || "(내용 없음)"}
            </p>
        </div>
    );
}

/** 초안 편집기와 AI/승인 요청 버튼을 그린다. */
export default function ReportEditor({
    student,
}: {
    student: StaffReportStudent;
}) {
    const router = useRouter();
    const [isProcessing, startProcessing] = useTransition();
    const defaults = getDefaultReportPeriod();

    const draftReport =
        student.report &&
        ["UNWRITTEN", "DRAFTING", "REJECTED"].includes(student.report.status)
            ? student.report
            : null;
    const submittedReports =
        student.submittedReports?.length > 0
            ? student.submittedReports
            : student.submittedReport
              ? [student.submittedReport]
              : [];
    const submittedReport = submittedReports[0] ?? null;
    const lockedOnly = !draftReport && Boolean(submittedReport);
    const hasNothing = !draftReport && !submittedReport;

    const [keyword, setKeyword] = useState(
        draftReport?.keywords[0] ?? REPORT_KEYWORD_OPTIONS[0],
    );
    const [tone, setTone] = useState(REPORT_TONE_OPTIONS[0]);
    const [periodStart, setPeriodStart] = useState(
        draftReport?.periodStart.slice(0, 10) ?? defaults.periodStart,
    );
    const [periodEnd, setPeriodEnd] = useState(
        draftReport?.periodEnd.slice(0, 10) ?? defaults.periodEnd,
    );
    const [content, setContent] = useState(draftReport?.content ?? "");
    const [feedback, setFeedback] = useState<string | null>(null);
    const [evidenceSummary, setEvidenceSummary] = useState<string | null>(null);
    const [isComposingNew, setIsComposingNew] = useState(false);

    const listStatus = getStudentReportStatus(student);
    const statusMetadata = REPORT_STATUS_METADATA[listStatus];
    const canEdit = Boolean(draftReport) || isComposingNew || hasNothing;
    const showComposer = canEdit;
    const shouldForceNew = isComposingNew || hasNothing;
    const activeDraftId = shouldForceNew ? undefined : draftReport?.id;
    const isBlankDraft =
        !content.trim() ||
        draftReport?.status === "UNWRITTEN" ||
        hasNothing ||
        isComposingNew;

    function startNewPeriodDraft() {
        const next = getDefaultReportPeriod();
        setIsComposingNew(true);
        setPeriodStart(next.periodStart);
        setPeriodEnd(next.periodEnd);
        setContent("");
        setKeyword(REPORT_KEYWORD_OPTIONS[0]);
        setTone(REPORT_TONE_OPTIONS[0]);
        setEvidenceSummary(null);
        setFeedback(
            "새 기간 리포트를 작성합니다. 위에 제출한 내용은 그대로 유지됩니다.",
        );
    }

    function cancelCompose() {
        setIsComposingNew(false);
        setContent(draftReport?.content ?? "");
        setPeriodStart(
            draftReport?.periodStart.slice(0, 10) ?? defaults.periodStart,
        );
        setPeriodEnd(draftReport?.periodEnd.slice(0, 10) ?? defaults.periodEnd);
        setKeyword(draftReport?.keywords[0] ?? REPORT_KEYWORD_OPTIONS[0]);
        setEvidenceSummary(null);
        setFeedback(null);
    }

    function createOrRegenerateDraft(forceNew: boolean) {
        if (!student.studentProfileId) {
            setFeedback("학생 프로필이 없어 생성할 수 없습니다.");
            return;
        }
        if (periodEnd < periodStart) {
            setFeedback("종료일이 시작일보다 빠를 수 없습니다.");
            return;
        }

        startProcessing(async () => {
            const result = await regenerateDraftWithAi({
                studentId: student.studentProfileId!,
                keywords: [keyword],
                tone,
                periodStart,
                periodEnd,
                forceNew,
                reportId: forceNew ? undefined : activeDraftId,
            });
            if (!result.ok) {
                setFeedback(result.message);
                return;
            }
            if (result.content) setContent(result.content);
            setEvidenceSummary(result.evidenceSummary ?? null);
            setIsComposingNew(false);
            setFeedback(result.message ?? "AI 초안을 생성했습니다.");
            router.refresh();
        });
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
        if (periodEnd < periodStart) {
            setFeedback("종료일이 시작일보다 빠를 수 없습니다.");
            return;
        }

        startProcessing(async () => {
            const result = await saveDraftReport({
                studentId: student.studentProfileId!,
                content,
                keywords: [keyword],
                periodStart,
                periodEnd,
                forceNew: shouldForceNew,
                reportId: activeDraftId,
            });
            setFeedback(
                result.ok
                    ? (result.message ?? "초안을 저장했습니다.")
                    : result.message,
            );
            if (result.ok) {
                setIsComposingNew(false);
                router.refresh();
            }
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
                periodStart,
                periodEnd,
                forceNew: shouldForceNew,
                reportId: activeDraftId,
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
            if (result.ok) {
                setIsComposingNew(false);
                setContent("");
                setEvidenceSummary(null);
                router.refresh();
            }
        });
    }

    return (
        <article className={cx(surfaceStyles.root, styles.editorPanel)}>
            <div className={panelStyles.head}>
                <h2>{student.name} 보고서</h2>
                <StatusChip
                    tone={isComposingNew ? "neutral" : statusMetadata.tone}
                >
                    {isComposingNew ? "신규 작성" : statusMetadata.label}
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
            {submittedReports.length > 0 && (
                <div className={styles.submittedList}>
                    {submittedReports.map((report, index) => (
                        <SubmittedReportCard
                            key={report.id}
                            report={report}
                            title={
                                index === 0
                                    ? "최근 제출한 리포트"
                                    : "이전 제출"
                            }
                        />
                    ))}
                </div>
            )}

            {draftReport?.rejectionReason && !isComposingNew && (
                <div className={styles.rejectBox}>
                    <strong>반려 사유</strong>
                    <p>{draftReport.rejectionReason}</p>
                </div>
            )}

            {lockedOnly && !isComposingNew ? (
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={buttonStyles.primary}
                        disabled={isProcessing || !student.studentProfileId}
                        onClick={startNewPeriodDraft}
                    >
                        새 기간 리포트 작성
                    </button>
                </div>
            ) : null}

            {showComposer && (
                <>
                    {isComposingNew && (
                        <div className={styles.composeBanner}>
                            <strong>새 기간 초안</strong>
                            <p>
                                제출한 리포트와 별도로 저장됩니다. 기간을 확인한
                                뒤 초안을 만들어 주세요.
                            </p>
                        </div>
                    )}

                    {evidenceSummary && (
                        <div className={styles.evidenceBox}>
                            <strong>이번 기간 근거</strong>
                            <p>{evidenceSummary}</p>
                        </div>
                    )}

                    <div className={styles.periodRow}>
                        <label className={cx(fieldStyles.root, styles.field)}>
                            기간 시작
                            <input
                                type="date"
                                value={periodStart}
                                onChange={(event) =>
                                    setPeriodStart(event.target.value)
                                }
                                disabled={isProcessing}
                            />
                        </label>
                        <label className={cx(fieldStyles.root, styles.field)}>
                            기간 종료
                            <input
                                type="date"
                                value={periodEnd}
                                onChange={(event) =>
                                    setPeriodEnd(event.target.value)
                                }
                                disabled={isProcessing}
                            />
                        </label>
                    </div>
                    <label className={cx(fieldStyles.root, styles.field)}>
                        평가 키워드
                        <select
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            disabled={isProcessing}
                        >
                            {REPORT_KEYWORD_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={cx(fieldStyles.root, styles.field)}>
                        톤
                        <select
                            value={tone}
                            onChange={(event) => setTone(event.target.value)}
                            disabled={isProcessing}
                        >
                            {REPORT_TONE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={cx(fieldStyles.root, styles.field)}>
                        초안
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            disabled={isProcessing}
                            rows={8}
                            placeholder="기간을 선택한 뒤 AI로 신규 초안을 만들어 보세요."
                        />
                    </label>
                    <div className={styles.actions}>
                        {isComposingNew && (
                            <button
                                type="button"
                                className={buttonStyles.secondary}
                                disabled={isProcessing}
                                onClick={cancelCompose}
                            >
                                취소
                            </button>
                        )}
                        <button
                            type="button"
                            className={buttonStyles.secondary}
                            disabled={
                                isProcessing || !student.studentProfileId
                            }
                            onClick={saveDraft}
                        >
                            {isProcessing ? "처리 중..." : "초안 저장"}
                        </button>
                        <button
                            type="button"
                            className={buttonStyles.primary}
                            disabled={
                                isProcessing || !student.studentProfileId
                            }
                            onClick={() =>
                                createOrRegenerateDraft(shouldForceNew)
                            }
                        >
                            {isProcessing
                                ? "처리 중..."
                                : isBlankDraft || isComposingNew
                                  ? "AI로 신규 초안 만들기"
                                  : "AI 재생성"}
                        </button>
                        <button
                            type="button"
                            className={buttonStyles.primary}
                            disabled={isProcessing || !content.trim()}
                            onClick={requestApproval}
                        >
                            {isProcessing ? "처리 중..." : "승인 요청"}
                        </button>
                    </div>
                </>
            )}

            {!showComposer && !lockedOnly && !hasNothing && (
                <p className={typographyStyles.hint}>표시할 리포트가 없습니다.</p>
            )}

            {feedback && <p className={typographyStyles.hint}>{feedback}</p>}
            {!student.studentProfileId && (
                <p className={typographyStyles.hint}>
                    학생 프로필이 없어 아직 리포트를 저장할 수 없습니다.
                </p>
            )}
        </article>
    );
}
