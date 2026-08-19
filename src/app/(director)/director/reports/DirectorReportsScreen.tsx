"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 원장 AI 리포트 승인 워크스페이스 (클라이언트).
 *
 * `/director/reports`가 연결. 작성은 교사 StaffReportsScreen.
 * 승인: `approveAndSendReport`(학부모 SENT 쪽지), 반려: `rejectReport`.
 * props: students — director-data.
 */

import { useMemo, useState, useTransition } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    getStudentReportStatus, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    REPORT_STATUS_METADATA, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/reports/presentation"; // 원장 Screen. layout requireRole DIRECTOR.
import type { DirectorReportStudent } from "@/features/reports/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    approveAndSendReport, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    rejectReport, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/reports/director-actions"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    panelStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    screenStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import DirectorReportDetail from "./components/DirectorReportDetail"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import DirectorReportStudentTable from "./components/DirectorReportStudentTable"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./DirectorReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 학생을 고르면 상세에서 승인/반려를 실행한다. */
export default function DirectorReportsScreen({ students }: { students: DirectorReportStudent[] }) { // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    const [isPending, startTransition] = useTransition(); // pending. 중복 제출을 막는다.
    const [activeStudentId, setActiveStudentId] = useState<string | null>(students[0]?.id ?? null); // 원장 승인 큐. 작성은 교사 Screen.
    const [rejectionReason, setRejectionReason] = useState(""); // 원장 승인 큐. 작성은 교사 Screen.
    const [feedback, setFeedback] = useState<string | null>(null); // Action 결과 안내. JWT를 여기서 안 갱신한다.
    const statistics = useMemo(() => getReportStatistics(students), [students]); // 파생 값. 조회 범위를 넓히지 않는다.
    const activeStudent = students.find((student) => student.id === activeStudentId) ?? null; // 원장 Screen. layout requireRole DIRECTOR.
    const activeStatus = activeStudent ? getStudentReportStatus(activeStudent) : null; // 원장 Screen. layout requireRole DIRECTOR.

    function selectStudent(studentId: string) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        setActiveStudentId(studentId); // 상세만 연다. 여기서 승인하지 않는다.
        setFeedback(null); // 이전 안내를 지운다.
        setRejectionReason(""); // 반려 사유 입력칸을 비운다.
    } // 블록 끝.

    function approveReport() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!activeStudent?.report?.id) return; // 미작성이면 승인/반려하지 않는다.
        setFeedback(null); // 이전 안내를 지운다.
        startTransition(async () => { // 전환. 권한 키를 바꾸지 않는다.
            const result = await approveAndSendReport({ reportId: activeStudent.report!.id }); // 승인 후 학부모 SENT. 작성은 교사 Screen.
            if (!result.ok) return setFeedback(result.message); // 실패면 안내만. 상태를 추측하지 않는다.
            setFeedback("승인·발송 완료"); // 학부모 SENT. 교사 초안 화면이 아니다.
            router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
        }); // 객체/호출 끝.
    } // 블록 끝.

    function rejectActiveReport() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!activeStudent?.report?.id) return; // 미작성이면 승인/반려하지 않는다.
        if (!rejectionReason.trim()) return setFeedback("반려 사유를 입력해 주세요."); // 빈 반려를 막는다.
        setFeedback(null); // 이전 안내를 지운다.
        startTransition(async () => { // 전환. 권한 키를 바꾸지 않는다.
            const result = await rejectReport({ reportId: activeStudent.report!.id, rejectionReason }); // 반려. 초안은 교사에게 돌아간다.
            if (!result.ok) return setFeedback(result.message); // 실패면 안내만. 상태를 추측하지 않는다.
            setFeedback("반려 처리 완료"); // 초안은 교사에게 돌아간다.
            setRejectionReason(""); // 반려 사유 입력칸을 비운다.
            router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
        }); // 객체/호출 끝.
    } // 블록 끝.

    return ( // 원장 승인 큐. 작성은 교사 Screen.
        <section className={screenStyles.animatedPage}>{/* 원장 승인 큐. 작성은 교사 Screen. */}
            <header className={pageHeadingStyles.root}><div><span className={pageHeadingStyles.eyebrow}>AI REPORT</span><h1>리포트 승인</h1><p>역할이 학생인 사용자를 기준으로 리포트 상태를 확인합니다.</p></div></header>{/* 승인 큐 */}
            <div className={styles.metrics}>{statistics.map((item) => <article key={item.label} className={surfaceStyles.root}><StatusChip tone={item.tone}>{item.label}</StatusChip><strong>{item.value}</strong><p>{item.detail}</p></article>)}</div>{/* 승인대기·반려·발송 */}
            {students.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <div className={cx(surfaceStyles.root, emptyStateStyles.root)}><h2>표시할 학생이 없습니다</h2><p>가입 사용자에서 역할을 학생으로 부여하면 이곳에 나타납니다.</p></div> // 학생 역할이 아직 없음
            ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <DirectorReportStudentTable students={students} activeStudentId={activeStudentId} onSelect={selectStudent} />{/* 학생별 리포트 상태 */}
                    <DirectorReportDetail student={activeStudent} status={activeStatus} rejectionReason={rejectionReason} feedback={feedback} isPending={isPending} onRejectionReasonChange={setRejectionReason} onReject={rejectActiveReport} onApprove={approveReport} />{/* 승인/반려 */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 승인대기·반려·발송·미작성 건수를 카드용으로 집계한다. */
function getReportStatistics(students: DirectorReportStudent[]) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    const counts = { PENDING_APPROVAL: 0, REJECTED: 0, SENT: 0, UNWRITTEN: 0 }; // 승인대기·반려·발송·미작성.
    for (const student of students) { // 반복. 조회 범위를 넓히지 않는다.
        const status = getStudentReportStatus(student); // 원장 Screen. layout requireRole DIRECTOR.
        if (status in counts) counts[status as keyof typeof counts] += 1; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        else if (status === "DRAFTING" || status === "FAILED") counts.UNWRITTEN += 1; // 다른 분기.
    } // 블록 끝.
    return [ // 반환. 원장 Screen. layout requireRole DIRECTOR.
        { label: REPORT_STATUS_METADATA.PENDING_APPROVAL.label, value: `${counts.PENDING_APPROVAL}건`, detail: "선생님 작성 완료", tone: "warning" as const }, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        { label: REPORT_STATUS_METADATA.REJECTED.label, value: `${counts.REJECTED}건`, detail: "재작성 중", tone: "danger" as const }, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        { label: "발송·미작성", value: `${counts.SENT} / ${counts.UNWRITTEN}`, detail: `학생 ${students.length}명`, tone: "success" as const }, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ]; // 원장 Screen. layout requireRole DIRECTOR.
} // 블록 끝.
