import StatusChip from "@/components/ui/StatusChip";
import {
    buttonStyles,
    cx,
    fieldStyles,
    panelStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import { REPORT_STATUS_METADATA } from "@/features/reports/presentation";
import type { DirectorReportStudent, ReportStatus } from "@/features/reports/types";
import { formatStudentSchool } from "@/features/students/presentation";
import styles from "../DirectorReportsScreen.module.css";

export default function DirectorReportDetail({ student, status, rejectionReason, feedback, isPending, onRejectionReasonChange, onReject, onApprove }: {
    student: DirectorReportStudent | null;
    status: ReportStatus | null;
    rejectionReason: string;
    feedback: string | null;
    isPending: boolean;
    onRejectionReasonChange: (reason: string) => void;
    onReject: () => void;
    onApprove: () => void;
}) {
    return (
        <article className={cx(surfaceStyles.root, styles.detailPanel)}>
            <div className={panelStyles.head}>
                <h2>상세</h2>
                {status && <StatusChip tone={REPORT_STATUS_METADATA[status].tone}>{REPORT_STATUS_METADATA[status].label}</StatusChip>}
            </div>
            {!student ? <p className={styles.empty}>학생을 선택하세요.</p> : (
                <>
                    <div className={styles.meta}>
                        <div><span>학생</span><strong>{student.name}</strong></div>
                        <div><span>학교·학년</span><strong>{formatStudentSchool(student.schoolName, student.grade)}</strong></div>
                        <div><span>반 · 선생님</span><strong>{student.className ?? "미배정"}{" · "}{student.teacherName ?? student.report?.teacherName ?? "—"}</strong></div>
                    </div>
                    <div className={styles.contentBox}>
                        <h3>최근 리포트</h3>
                        {student.report ? <p>{student.report.content || "(내용 없음)"}</p> : <p className={styles.empty}>아직 작성된 AI 리포트가 없습니다.{!student.studentProfileId && " (students 프로필도 아직 없습니다)"}</p>}
                    </div>
                    {student.report && status === "PENDING_APPROVAL" && (
                        <div className={styles.reviewBox}>
                            <label className={fieldStyles.root}>반려 사유<textarea value={rejectionReason} onChange={(event) => onRejectionReasonChange(event.target.value)} rows={3} placeholder="선생님에게 전달할 반려 사유를 입력하세요." /></label>
                            <div className={styles.actions}>
                                <button type="button" className={buttonStyles.secondary} onClick={onReject} disabled={isPending}>{isPending ? "처리 중..." : "반려"}</button>
                                <button type="button" className={buttonStyles.primary} onClick={onApprove} disabled={isPending}>{isPending ? "처리 중..." : "승인·발송"}</button>
                            </div>
                            {feedback && <p className={typographyStyles.hint}>{feedback}</p>}
                        </div>
                    )}
                    {student.report && status !== "PENDING_APPROVAL" && feedback && <p className={typographyStyles.hint}>{feedback}</p>}
                </>
            )}
        </article>
    );
}
