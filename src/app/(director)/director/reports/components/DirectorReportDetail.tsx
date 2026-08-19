/**
 * 리포트 본문 승인/반려 패널 (서버 컴포넌트).
 *
 * 승인 시 SENT 쪽지로 학부모에게 나간다. 실제 호출은 부모 Screen의
 * `approveAndSendReport` / `rejectReport`. 이 파일은 콜백만 받는다.
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    panelStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import { REPORT_STATUS_METADATA } from "@/features/reports/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import type { DirectorReportStudent, ReportStatus } from "@/features/reports/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/**
 * 본문과 반려 사유 입력, 승인/반려 버튼을 그린다.
 * Action 호출은 부모 Screen.
 */
export default function DirectorReportDetail({ student, status, rejectionReason, feedback, isPending, onRejectionReasonChange, onReject, onApprove }: { // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    student: DirectorReportStudent | null; // student 필드.
    status: ReportStatus | null; // status 필드.
    rejectionReason: string; // rejectionReason 필드.
    feedback: string | null; // feedback 필드.
    isPending: boolean; // isPending 필드.
    onRejectionReasonChange: (reason: string) => void; // onRejectionReasonChange 필드.
    onReject: () => void; // onReject 필드.
    onApprove: () => void; // onApprove 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // JSX 반환. 원장 Screen. layout requireRole DIRECTOR.
        <article className={cx(surfaceStyles.root, styles.detailPanel)}>{/* 선택한 리포트. 작성은 교사 Screen. */}
            <div className={panelStyles.head}>{/* 레이아웃 상자. */}
                <h2>상세</h2>{/* 소제목. */}
                {status && <StatusChip tone={REPORT_STATUS_METADATA[status].tone}>{REPORT_STATUS_METADATA[status].label}</StatusChip>}{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
            {!student ? ( // 아직 선택 없음.
                <p className={styles.empty}>학생을 선택하세요.</p> // 문장.
            ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <>{/* 요소. 원장 Screen. layout requireRole DIRECTOR. */}
                    <div className={styles.meta}>{/* 레이아웃 상자. */}
                        <div><span>학생</span><strong>{student.name}</strong></div>{/* 레이아웃 상자. */}
                        <div><span>학교·학년</span><strong>{formatStudentSchool(student.schoolName, student.grade)}</strong></div>{/* 레이아웃 상자. */}
                        <div><span>반 · 선생님</span><strong>{student.className ?? "미배정"}{" · "}{student.teacherName ?? student.report?.teacherName ?? "—"}</strong></div>{/* 레이아웃 상자. */}
                    </div>{/* div 닫기. */}
                    <div className={styles.contentBox}>{/* 초안 본문. 여기서 고치지 않는다. */}
                        <h3>최근 리포트</h3>{/* 소제목. */}
                        {student.report ? <p>{student.report.content || "(내용 없음)"}</p> : <p className={styles.empty}>아직 작성된 AI 리포트가 없습니다.{!student.studentProfileId && " (students 프로필도 아직 없습니다)"}</p>}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </div>{/* div 닫기. */}
                    {student.report && status === "PENDING_APPROVAL" && ( // 반려 사유 + 승인·발송. Action은 부모 Screen.
                        <div className={styles.reviewBox}>{/* 레이아웃 상자. */}
                            <label className={fieldStyles.root}>반려 사유<textarea value={rejectionReason} onChange={(event) => onRejectionReasonChange(event.target.value)} rows={3} placeholder="선생님에게 전달할 반려 사유를 입력하세요." /></label>{/* 필드 라벨. */}
                            <div className={styles.actions}>{/* 레이아웃 상자. */}
                                <button type="button" className={buttonStyles.secondary} onClick={onReject} disabled={isPending}>{isPending ? "처리 중..." : "반려"}</button>{/* 클릭. 권한을 클라이언트에서 올리지 않는다. */}
                                <button type="button" className={buttonStyles.primary} onClick={onApprove} disabled={isPending}>{isPending ? "처리 중..." : "승인·발송"}</button>{/* 클릭. 권한을 클라이언트에서 올리지 않는다. */}
                            </div>{/* div 닫기. */}
                            {feedback && <p className={typographyStyles.hint}>{feedback}</p>}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}
                    {student.report && status !== "PENDING_APPROVAL" && feedback && <p className={typographyStyles.hint}>{feedback}</p>}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
