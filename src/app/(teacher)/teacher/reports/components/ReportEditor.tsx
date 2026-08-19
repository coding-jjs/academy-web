"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 리포트 초안 편집·AI 재생성·승인 요청 UI (클라이언트).
 *
 * 저장: `saveDraftReport`, `regenerateDraftWithAi`, `requestReportApproval`
 * (staff-actions). 교사가 바로 발송하지 않고 원장 큐로 넘긴다.
 *
 * props: student — 선택된 StaffReportStudent.
 */

import { useState, useTransition } from "react"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    buttonStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    cx, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    fieldStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    panelStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    surfaceStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    typographyStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/components/ui/shared-styles"; // 교사 Screen. StaffDashboard는 교사 전용.
import type { // 타입만. 런타임 로직이 아니다.
    StaffReportItem, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    StaffReportStudent, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/reports/types"; // 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    regenerateDraftWithAi, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    requestReportApproval, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    saveDraftReport, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/reports/staff-actions"; // 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    getDefaultReportPeriod, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    getStudentReportStatus, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    REPORT_KEYWORD_OPTIONS, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    REPORT_STATUS_METADATA, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    REPORT_TONE_OPTIONS, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/reports/presentation"; // 교사 Screen. StaffDashboard는 교사 전용.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 기간을 `YYYY-MM-DD ~ YYYY-MM-DD`로. */
function formatPeriod(report: StaffReportItem) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    return `${report.periodStart.slice(0, 10)} ~ ${report.periodEnd.slice(0, 10)}`; // 기간을 YYYY-MM-DD ~ YYYY-MM-DD로.
} // 블록 끝.

/** 제출 시각을 한국어 월/일 시:분으로. */
function formatSubmittedAt(iso: string) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    const date = new Date(iso); // 교사 Screen. StaffDashboard는 교사 전용.
    if (Number.isNaN(date.getTime())) return ""; // 분기. 교사 Screen. StaffDashboard는 교사 전용.
    return new Intl.DateTimeFormat("ko-KR", { // 반환. 교사 Screen. StaffDashboard는 교사 전용.
        month: "numeric", // month 필드.
        day: "numeric", // day 필드.
        hour: "2-digit", // hour 필드.
        minute: "2-digit", // minute 필드.
    }).format(date); // 교사 Screen. StaffDashboard는 교사 전용.
} // 블록 끝.

/** 이미 제출·발송된 리포트 본문 카드. 여기서는 수정하지 않는다. */
function SubmittedReportCard({ // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    report, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    title, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    report: StaffReportItem; // report 필드.
    title: string; // title 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // 제출·발송된 본문. 여기서는 수정하지 않는다.
        <div className={styles.submittedBox}>{/* 레이아웃 상자. */}
            <div className={styles.submittedHead}>{/* 레이아웃 상자. */}
                <strong>{title}</strong>{/* 강조. */}
                <StatusChip // StatusChip. 교사 Screen. StaffDashboard는 교사 전용.
                    tone={REPORT_STATUS_METADATA[report.status].tone} // tone 필드.
                >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    {REPORT_STATUS_METADATA[report.status].label}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                </StatusChip>{/* StatusChip 닫기. */}
            </div>{/* div 닫기. */}
            <p className={styles.submittedMeta}>{/* 문장. */}
                기간 {formatPeriod(report)}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                {report.keywords[0] ? ` · ${report.keywords[0]}` : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                {` · ${report.teacherName}`}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                {report.updatedAt // 교사 Screen. StaffDashboard는 교사 전용.
                    ? ` · ${formatSubmittedAt(report.updatedAt)}` // 교사 Screen. StaffDashboard는 교사 전용.
                    : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
            </p>{/* p 닫기. */}
            <p className={styles.submittedBody}>{/* 문장. */}
                {report.content.trim() || "(내용 없음)"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
            </p>{/* p 닫기. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 초안 편집기와 AI/승인 요청 버튼을 그린다. */
export default function ReportEditor({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    student, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    student: StaffReportStudent; // student 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    const [isProcessing, startProcessing] = useTransition(); // 교사 Screen. StaffDashboard는 교사 전용.
    const defaults = getDefaultReportPeriod(); // 교사 Screen. StaffDashboard는 교사 전용.

    const draftReport = // 교사 Screen. StaffDashboard는 교사 전용.
        student.report && // 교사 Screen. StaffDashboard는 교사 전용.
        ["UNWRITTEN", "DRAFTING", "REJECTED"].includes(student.report.status) // 교사 Screen. StaffDashboard는 교사 전용.
            ? student.report // 교사 Screen. StaffDashboard는 교사 전용.
            : null; // 교사 Screen. StaffDashboard는 교사 전용.
    const submittedReports = // 교사 Screen. StaffDashboard는 교사 전용.
        student.submittedReports?.length > 0 // 교사 Screen. StaffDashboard는 교사 전용.
            ? student.submittedReports // 교사 Screen. StaffDashboard는 교사 전용.
            : student.submittedReport // 교사 Screen. StaffDashboard는 교사 전용.
              ? [student.submittedReport] // 교사 Screen. StaffDashboard는 교사 전용.
              : []; // 교사 Screen. StaffDashboard는 교사 전용.
    const submittedReport = submittedReports[0] ?? null; // 교사 Screen. StaffDashboard는 교사 전용.
    const lockedOnly = !draftReport && Boolean(submittedReport); // 교사 Screen. StaffDashboard는 교사 전용.
    const hasNothing = !draftReport && !submittedReport; // 교사 Screen. StaffDashboard는 교사 전용.

    const [keyword, setKeyword] = useState( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        draftReport?.keywords[0] ?? REPORT_KEYWORD_OPTIONS[0], // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    ); // 호출/그룹 끝.
    const [tone, setTone] = useState(REPORT_TONE_OPTIONS[0]); // 초안 편집. 학부모 발송은 원장 승인.
    const [periodStart, setPeriodStart] = useState( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        draftReport?.periodStart.slice(0, 10) ?? defaults.periodStart, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    ); // 호출/그룹 끝.
    const [periodEnd, setPeriodEnd] = useState( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        draftReport?.periodEnd.slice(0, 10) ?? defaults.periodEnd, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    ); // 호출/그룹 끝.
    const [content, setContent] = useState(draftReport?.content ?? ""); // 초안 편집. 학부모 발송은 원장 승인.
    const [feedback, setFeedback] = useState<string | null>(null); // Action 결과 안내. JWT를 여기서 안 갱신한다.
    const [evidenceSummary, setEvidenceSummary] = useState<string | null>(null); // 초안 편집. 학부모 발송은 원장 승인.
    const [isComposingNew, setIsComposingNew] = useState(false); // 초안 편집. 학부모 발송은 원장 승인.

    const listStatus = getStudentReportStatus(student); // 교사 Screen. StaffDashboard는 교사 전용.
    const statusMetadata = REPORT_STATUS_METADATA[listStatus]; // 교사 Screen. StaffDashboard는 교사 전용.
    const canEdit = Boolean(draftReport) || isComposingNew || hasNothing; // 교사 Screen. StaffDashboard는 교사 전용.
    const showComposer = canEdit; // 교사 Screen. StaffDashboard는 교사 전용.
    const shouldForceNew = isComposingNew || hasNothing; // 교사 Screen. StaffDashboard는 교사 전용.
    const activeDraftId = shouldForceNew ? undefined : draftReport?.id; // 교사 Screen. StaffDashboard는 교사 전용.
    const isBlankDraft ={/* 교사 Screen. StaffDashboard는 교사 전용. */}
        !content.trim() || // 교사 Screen. StaffDashboard는 교사 전용.
        draftReport?.status === "UNWRITTEN" || // 교사 Screen. StaffDashboard는 교사 전용.
        hasNothing || // 교사 Screen. StaffDashboard는 교사 전용.
        isComposingNew; // 교사 Screen. StaffDashboard는 교사 전용.

    function startNewPeriodDraft() { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        const next = getDefaultReportPeriod(); // 교사 Screen. StaffDashboard는 교사 전용.
        setIsComposingNew(true); // 교사 Screen. StaffDashboard는 교사 전용.
        setPeriodStart(next.periodStart); // 교사 Screen. StaffDashboard는 교사 전용.
        setPeriodEnd(next.periodEnd); // 교사 Screen. StaffDashboard는 교사 전용.
        setContent(""); // 교사 Screen. StaffDashboard는 교사 전용.
        setKeyword(REPORT_KEYWORD_OPTIONS[0]); // 교사 Screen. StaffDashboard는 교사 전용.
        setTone(REPORT_TONE_OPTIONS[0]); // 교사 Screen. StaffDashboard는 교사 전용.
        setEvidenceSummary(null); // 교사 Screen. StaffDashboard는 교사 전용.
        setFeedback( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            "새 기간 리포트를 작성합니다. 위에 제출한 내용은 그대로 유지됩니다.", // 구문. 교사 Screen. StaffDashboard는 교사 전용.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    function cancelCompose() { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        setIsComposingNew(false); // 교사 Screen. StaffDashboard는 교사 전용.
        setContent(draftReport?.content ?? ""); // 교사 Screen. StaffDashboard는 교사 전용.
        setPeriodStart( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            draftReport?.periodStart.slice(0, 10) ?? defaults.periodStart, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
        ); // 호출/그룹 끝.
        setPeriodEnd(draftReport?.periodEnd.slice(0, 10) ?? defaults.periodEnd); // 교사 Screen. StaffDashboard는 교사 전용.
        setKeyword(draftReport?.keywords[0] ?? REPORT_KEYWORD_OPTIONS[0]); // 교사 Screen. StaffDashboard는 교사 전용.
        setEvidenceSummary(null); // 교사 Screen. StaffDashboard는 교사 전용.
        setFeedback(null); // 이전 안내를 지운다.
    } // 블록 끝.

    function createOrRegenerateDraft(forceNew: boolean) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        if (!student.studentProfileId) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback("학생 프로필이 없어 생성할 수 없습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
            return; // 교사 Screen. StaffDashboard는 교사 전용.
        } // 블록 끝.
        if (periodEnd < periodStart) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback("종료일이 시작일보다 빠를 수 없습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
            return; // 교사 Screen. StaffDashboard는 교사 전용.
        } // 블록 끝.

        startProcessing(async () => { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            const result = await regenerateDraftWithAi({ // AI 초안. 학부모 발송이 아니라 교사 초안만.
                studentId: student.studentProfileId!, // studentId 필드.
                keywords: [keyword], // keywords 필드.
                tone, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                periodStart, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                periodEnd, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                forceNew, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                reportId: forceNew ? undefined : activeDraftId, // reportId 필드.
            }); // 객체/호출 끝.
            if (!result.ok) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
                setFeedback(result.message); // 교사 Screen. StaffDashboard는 교사 전용.
                return; // 교사 Screen. StaffDashboard는 교사 전용.
            } // 블록 끝.
            if (result.content) setContent(result.content); // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setEvidenceSummary(result.evidenceSummary ?? null); // 교사 Screen. StaffDashboard는 교사 전용.
            setIsComposingNew(false); // 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback(result.message ?? "AI 초안을 생성했습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
            router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
        }); // 객체/호출 끝.
    } // 블록 끝.

    function saveDraft() { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        if (!student.studentProfileId) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback("학생 프로필이 없어 저장할 수 없습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
            return; // 교사 Screen. StaffDashboard는 교사 전용.
        } // 블록 끝.
        if (!content.trim()) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback("본문을 입력해 주세요."); // 교사 Screen. StaffDashboard는 교사 전용.
            return; // 교사 Screen. StaffDashboard는 교사 전용.
        } // 블록 끝.
        if (periodEnd < periodStart) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback("종료일이 시작일보다 빠를 수 없습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
            return; // 교사 Screen. StaffDashboard는 교사 전용.
        } // 블록 끝.

        startProcessing(async () => { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            const result = await saveDraftReport({ // 초안 저장. 원장 승인 전에 학부모에게 안 나간다.
                studentId: student.studentProfileId!, // studentId 필드.
                content, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                keywords: [keyword], // keywords 필드.
                periodStart, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                periodEnd, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                forceNew: shouldForceNew, // forceNew 필드.
                reportId: activeDraftId, // reportId 필드.
            }); // 객체/호출 끝.
            setFeedback( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                result.ok // 교사 Screen. StaffDashboard는 교사 전용.
                    ? (result.message ?? "초안을 저장했습니다.") // 교사 Screen. StaffDashboard는 교사 전용.
                    : result.message, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            ); // 호출/그룹 끝.
            if (result.ok) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
                setIsComposingNew(false); // 교사 Screen. StaffDashboard는 교사 전용.
                router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
            } // 블록 끝.
        }); // 객체/호출 끝.
    } // 블록 끝.

    function requestApproval() { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        if (!canEdit || !content.trim()) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback("본문이 비어 있어 승인 요청할 수 없습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
            return; // 교사 Screen. StaffDashboard는 교사 전용.
        } // 블록 끝.

        startProcessing(async () => { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            if (!student.studentProfileId) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
                setFeedback("학생 프로필이 없어 승인 요청할 수 없습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
                return; // 교사 Screen. StaffDashboard는 교사 전용.
            } // 블록 끝.


            const saveResult = await saveDraftReport({ // 저장 후 원장 큐로. 즉시 발송 아님.
                studentId: student.studentProfileId, // studentId 필드.
                content, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                keywords: [keyword], // keywords 필드.
                periodStart, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                periodEnd, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                forceNew: shouldForceNew, // forceNew 필드.
                reportId: activeDraftId, // reportId 필드.
            }); // 객체/호출 끝.
            if (!saveResult.ok) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
                setFeedback(saveResult.message); // 교사 Screen. StaffDashboard는 교사 전용.
                return; // 교사 Screen. StaffDashboard는 교사 전용.
            } // 블록 끝.

            const reportId = saveResult.reportId; // 교사 Screen. StaffDashboard는 교사 전용.
            if (!reportId) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
                setFeedback("저장된 리포트 ID를 확인하지 못했습니다."); // 교사 Screen. StaffDashboard는 교사 전용.
                return; // 교사 Screen. StaffDashboard는 교사 전용.
            } // 블록 끝.

            const result = await requestReportApproval({ reportId }); // 교사 Screen. StaffDashboard는 교사 전용.
            setFeedback( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                result.ok // 교사 Screen. StaffDashboard는 교사 전용.
                    ? (result.message ?? "승인 요청을 보냈습니다.") // 교사 Screen. StaffDashboard는 교사 전용.
                    : result.message, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
            ); // 호출/그룹 끝.
            if (result.ok) { // 분기. 교사 Screen. StaffDashboard는 교사 전용.
                setIsComposingNew(false); // 교사 Screen. StaffDashboard는 교사 전용.
                setContent(""); // 교사 Screen. StaffDashboard는 교사 전용.
                setEvidenceSummary(null); // 교사 Screen. StaffDashboard는 교사 전용.
                router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
            } // 블록 끝.
        }); // 객체/호출 끝.
    } // 블록 끝.

    return ( // 초안 편집. 학부모 발송은 원장 승인.
        <article className={cx(surfaceStyles.root, styles.editorPanel)}>{/* 초안 편집. 학부모 발송은 원장 승인. */}
            <div className={panelStyles.head}>{/* 선택한 학생 리포트. 직원 URL에는 이 편집기가 없다. */}
                <h2>{student.name} 보고서</h2>{/* 소제목. */}
                <StatusChip // StatusChip. 교사 Screen. StaffDashboard는 교사 전용.
                    tone={isComposingNew ? "neutral" : statusMetadata.tone} // tone 필드.
                >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    {isComposingNew ? "신규 작성" : statusMetadata.label}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                </StatusChip>{/* StatusChip 닫기. */}
            </div>{/* div 닫기. */}
            <div className={styles.meta}>{/* 레이아웃 상자. */}
                <div>{/* 레이아웃 상자. */}
                    <span>학교·학년</span>{/* 인라인 표시. */}
                    <strong>{/* 강조. */}
                        {formatStudentSchool(student.schoolName, student.grade)}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    </strong>{/* strong 닫기. */}
                </div>{/* div 닫기. */}
                <div>{/* 레이아웃 상자. */}
                    <span>반</span>{/* 인라인 표시. */}
                    <strong>{student.className ?? "미배정"}</strong>{/* 강조. */}
                </div>{/* div 닫기. */}
            </div>{/* div 닫기. */}

            {submittedReports.length > 0 && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <div className={styles.submittedList}>{/* 레이아웃 상자. */}
                    {submittedReports.map((report, index) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                        <SubmittedReportCard // SubmittedReportCard. 교사 Screen. StaffDashboard는 교사 전용.
                            key={report.id} // key 필드.
                            report={report} // report 필드.
                            title={ // 객체/블록 시작.
                                index === 0 // 교사 Screen. StaffDashboard는 교사 전용.
                                    ? "최근 제출한 리포트" // 교사 Screen. StaffDashboard는 교사 전용.
                                    : "이전 제출" // 교사 Screen. StaffDashboard는 교사 전용.
                            } // 블록 끝.
                        /> // 구문 끝.
                    ))}{/* 구문 끝. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}

            {draftReport?.rejectionReason && !isComposingNew && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <div className={styles.rejectBox}>{/* 레이아웃 상자. */}
                    <strong>반려 사유</strong>{/* 강조. */}
                    <p>{draftReport.rejectionReason}</p>{/* 문장. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}

            {lockedOnly && !isComposingNew ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <div className={styles.actions}>{/* 레이아웃 상자. */}
                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                        type="button" // type 필드.
                        className={buttonStyles.primary} // className 필드.
                        disabled={isProcessing || !student.studentProfileId} // disabled 필드.
                        onClick={startNewPeriodDraft} // onClick 필드.
                    >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        새 기간 리포트 작성{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    </button>{/* button 닫기. */}
                </div> // div 닫기.
            ) : null}{/* 교사 Screen. StaffDashboard는 교사 전용. */}

            {showComposer && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <>{/* 요소. 교사 Screen. StaffDashboard는 교사 전용. */}
                    {isComposingNew && ( // 기간·키워드·톤·초안. 발송은 원장 승인.
                        <div className={styles.composeBanner}>{/* 레이아웃 상자. */}
                            <strong>새 기간 초안</strong>{/* 강조. */}
                            <p>{/* 문장. */}
                                제출한 리포트와 별도로 저장됩니다. 기간을 확인한{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                뒤 초안을 만들어 주세요.{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </p>{/* p 닫기. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}

                    {evidenceSummary && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                        <div className={styles.evidenceBox}>{/* 레이아웃 상자. */}
                            <strong>이번 기간 근거</strong>{/* 강조. */}
                            <p>{evidenceSummary}</p>{/* 문장. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}

                    <div className={styles.periodRow}>{/* 레이아웃 상자. */}
                        <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                            기간 시작{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            <input // 입력. 서버에서 다시 검증한다.
                                type="date" // type 필드.
                                value={periodStart} // value 필드.
                                onChange={(event) => // onChange 필드.
                                    setPeriodStart(event.target.value) // 교사 Screen. StaffDashboard는 교사 전용.
                                } // 블록 끝.
                                disabled={isProcessing} // disabled 필드.
                            />{/* 구문 끝. */}
                        </label>{/* label 닫기. */}
                        <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                            기간 종료{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            <input // 입력. 서버에서 다시 검증한다.
                                type="date" // type 필드.
                                value={periodEnd} // value 필드.
                                onChange={(event) => // onChange 필드.
                                    setPeriodEnd(event.target.value) // 교사 Screen. StaffDashboard는 교사 전용.
                                } // 블록 끝.
                                disabled={isProcessing} // disabled 필드.
                            />{/* 구문 끝. */}
                        </label>{/* label 닫기. */}
                    </div>{/* div 닫기. */}

                    <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                        평가 키워드{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        <select // 선택. 서버에서 다시 검증한다.
                            value={keyword} // value 필드.
                            onChange={(event) => setKeyword(event.target.value)} // onChange 필드.
                            disabled={isProcessing} // disabled 필드.
                        >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {REPORT_KEYWORD_OPTIONS.map((option) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                <option key={option} value={option}>{/* 선택지. */}
                                    {option}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </option> // option 닫기.
                            ))}{/* 구문 끝. */}
                        </select>{/* select 닫기. */}
                    </label>{/* label 닫기. */}
                    <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                        톤{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        <select // 선택. 서버에서 다시 검증한다.
                            value={tone} // value 필드.
                            onChange={(event) => setTone(event.target.value)} // onChange 필드.
                            disabled={isProcessing} // disabled 필드.
                        >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {REPORT_TONE_OPTIONS.map((option) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                <option key={option} value={option}>{/* 선택지. */}
                                    {option}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </option> // option 닫기.
                            ))}{/* 구문 끝. */}
                        </select>{/* select 닫기. */}
                    </label>{/* label 닫기. */}
                    <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                        초안{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        <textarea // 긴 입력. 서버에서 다시 검증한다.
                            value={content} // value 필드.
                            onChange={(event) => setContent(event.target.value)} // onChange 필드.
                            disabled={isProcessing} // disabled 필드.
                            rows={8} // rows 필드.
                            placeholder="기간을 선택한 뒤 AI로 신규 초안을 만들어 보세요." // placeholder 필드.
                        />{/* 구문 끝. */}
                    </label>{/* label 닫기. */}

                    <div className={styles.actions}>{/* 레이아웃 상자. */}
                        {isComposingNew && ( // 저장 / AI / 승인 요청. 학부모에게 바로 안 나간다.
                            <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                type="button" // type 필드.
                                className={buttonStyles.secondary} // className 필드.
                                disabled={isProcessing} // disabled 필드.
                                onClick={cancelCompose} // onClick 필드.
                            >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                취소{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </button> // button 닫기.
                        )}{/* 구문 끝. */}
                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                            type="button" // type 필드.
                            className={buttonStyles.secondary} // className 필드.
                            disabled={ // 객체/블록 시작.
                                isProcessing || !student.studentProfileId // 교사 Screen. StaffDashboard는 교사 전용.
                            } // 블록 끝.
                            onClick={saveDraft} // onClick 필드.
                        >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {isProcessing ? "처리 중..." : "초안 저장"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </button>{/* button 닫기. */}
                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                            type="button" // type 필드.
                            className={buttonStyles.primary} // className 필드.
                            disabled={ // 객체/블록 시작.
                                isProcessing || !student.studentProfileId // 교사 Screen. StaffDashboard는 교사 전용.
                            } // 블록 끝.
                            onClick={() => // onClick 필드.
                                createOrRegenerateDraft(shouldForceNew) // 교사 Screen. StaffDashboard는 교사 전용.
                            } // 블록 끝.
                        >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {isProcessing // 교사 Screen. StaffDashboard는 교사 전용.
                                ? "처리 중..." // 교사 Screen. StaffDashboard는 교사 전용.
                                : isBlankDraft || isComposingNew // 교사 Screen. StaffDashboard는 교사 전용.
                                  ? "AI로 신규 초안 만들기" // 교사 Screen. StaffDashboard는 교사 전용.
                                  : "AI 재생성"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </button>{/* button 닫기. */}
                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                            type="button" // type 필드.
                            className={buttonStyles.primary} // className 필드.
                            disabled={isProcessing || !content.trim()} // disabled 필드.
                            onClick={requestApproval} // onClick 필드.
                        >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {isProcessing ? "처리 중..." : "승인 요청"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </button>{/* button 닫기. */}
                    </div>{/* div 닫기. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}

            {!showComposer && !lockedOnly && !hasNothing && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p className={typographyStyles.hint}>표시할 리포트가 없습니다.</p> // 문장.
            )}{/* 구문 끝. */}

            {feedback && <p className={typographyStyles.hint}>{feedback}</p>}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
            {!student.studentProfileId && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                <p className={typographyStyles.hint}>{/* 문장. */}
                    학생 프로필이 없어 아직 리포트를 저장할 수 없습니다.{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                </p> // p 닫기.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
