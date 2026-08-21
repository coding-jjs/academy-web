/**
 * 원장 오늘 지표 카드 UI (서버 컴포넌트).
 *
 * props: `metrics` — `getDirectorDashboardMetrics`가 계산한 숫자.
 * 여기서는 표시와 바로가기만. 승인·이탈 처리는 각 업무 page 몫이다.
 *
 * 미납 값은 "준비 중". ParentPaymentsScreen·청구 API를 호출하지 않는다.
 * 신규 문의 카드는 href가 없어 직원 상담(`/employee/counseling`)으로 보내지 않는다.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 지표. 미납은 준비 중.
import type { DirectorDashboardMetrics } from "@/features/dashboard/types"; // features 데이터/액션. 원장 지표. 미납은 준비 중.
import { REPORT_STATUS_METADATA } from "@/features/reports/presentation"; // features 데이터/액션. 원장 지표. 미납은 준비 중.
import styles from "./DirectorDashboardScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

type MetricCard = { // 구문. 원장 지표. 미납은 준비 중.
    label: string; // label 필드.
    value: string; // value 필드.
    detail: string; // detail 필드.
    tone: "neutral" | "success" | "warning" | "danger"; // tone 필드.
    href?: string; // href 필드.
}; // 블록 끝.

type QueueItem = { // 구문. 원장 지표. 미납은 준비 중.
    label: string; // label 필드.
    detail: string; // detail 필드.
    href: string; // href 필드.
    count: number; // count 필드.
    tone: "neutral" | "success" | "warning" | "danger"; // tone 필드.
}; // 블록 끝.

/** 지표 카드·업무 큐·바로가기를 그린다. 저장 Action은 없다. */
export default function DirectorDashboardScreen({ // 이 파일의 화면. 원장 지표. 미납은 준비 중.
    metrics, // 구문. 원장 지표. 미납은 준비 중.
}: { // 구문. 원장 지표. 미납은 준비 중.
    metrics: DirectorDashboardMetrics; // metrics 필드.
}) { // 구문. 원장 지표. 미납은 준비 중.
    const cards: MetricCard[] = [ // 미납은 "준비 중". 문의 카드는 href가 없어 직원 상담으로 안 보낸다.
        { // 객체/블록 시작.
            label: REPORT_STATUS_METADATA.PENDING_APPROVAL.label, // label 필드.
            value: String(metrics.pendingReports), // value 필드.
            detail: "AI 리포트", // detail 필드.
            tone: metrics.pendingReports > 0 ? "warning" : "success", // tone 필드.
            href: "/director/reports", // href 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "이탈 위험", // label 필드.
            value: String(metrics.openChurn), // value 필드.
            detail: "감지·상담·검토", // PENDING_REVIEW 포함. 열린 이탈 카드.
            tone: metrics.openChurn > 0 ? "danger" : "success", // tone 필드.
            href: "/director/churn", // href 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "미납", // label 필드.
            value: "준비 중", // value 필드.
            detail: "", // detail 필드.
            tone: "neutral", // tone 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "신규 문의", // label 필드.
            value: String(metrics.newInquiries), // value 필드.
            detail: "미처리", // detail 필드.
            tone: metrics.newInquiries > 0 ? "warning" : "neutral", // tone 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "재원 학생", // label 필드.
            value: String(metrics.enrolledStudents), // value 필드.
            detail: "등록 상태", // detail 필드.
            tone: "neutral", // tone 필드.
            href: "/director/students", // href 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "오늘 출석", // label 필드.
            value: // value 필드.
                metrics.todayAttendanceRate == null // 원장 지표. 미납은 준비 중.
                    ? "—" // 원장 지표. 미납은 준비 중.
                    : `${metrics.todayAttendanceRate}%`, // 구문. 원장 지표. 미납은 준비 중.
            detail: // detail 필드.
                metrics.todaySessionCount > 0 // 원장 지표. 미납은 준비 중.
                    ? `오늘 세션 ${metrics.todaySessionCount}건` // 원장 지표. 미납은 준비 중.
                    : "오늘 세션 없음", // 구문. 원장 지표. 미납은 준비 중.
            tone: "neutral", // tone 필드.
        }, // 객체/호출 끝.
    ]; // 원장 지표. 미납은 준비 중.

    const queue: QueueItem[] = [ // 승인·이탈·가입대기·학부모 연결. 처리는 각 업무 page.
        { // 객체/블록 시작.
            label: "AI 리포트", // label 필드.
            detail: "승인 후 학부모 발송", // detail 필드.
            href: "/director/reports", // href 필드.
            count: metrics.pendingReports, // count 필드.
            tone: metrics.pendingReports > 0 ? "warning" : "success", // tone 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "이탈 위험", // label 필드.
            detail: "배정·검토 필요", // 담당 배정과 PENDING_REVIEW.
            href: "/director/churn", // href 필드.
            count: metrics.openChurn, // count 필드.
            tone: metrics.openChurn > 0 ? "danger" : "success", // tone 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "가입 대기", // label 필드.
            detail: "역할 미배정 GUEST", // detail 필드.
            href: "/director/users", // href 필드.
            count: metrics.guestUsers, // count 필드.
            tone: metrics.guestUsers > 0 ? "warning" : "neutral", // tone 필드.
        }, // 객체/호출 끝.
        { // 객체/블록 시작.
            label: "학부모 연결", // label 필드.
            detail: "자녀 연결 관리", // detail 필드.
            href: "/director/parents", // href 필드.
            count: metrics.enrolledStudents, // count 필드.
            tone: "neutral", // tone 필드.
        }, // 객체/호출 끝.
    ]; // 원장 지표. 미납은 준비 중.

    const primaryHref = // 원장 지표. 미납은 준비 중.
        metrics.pendingReports > 0 // 원장 지표. 미납은 준비 중.
            ? "/director/reports" // 원장 지표. 미납은 준비 중.
            : metrics.openChurn > 0 // 원장 지표. 미납은 준비 중.
              ? "/director/churn" // 원장 지표. 미납은 준비 중.
              : "/director/students"; // 원장 지표. 미납은 준비 중.

    const primaryLabel = // 원장 지표. 미납은 준비 중.
        metrics.pendingReports > 0 // 원장 지표. 미납은 준비 중.
            ? "승인 대기 확인" // 원장 지표. 미납은 준비 중.
            : metrics.openChurn > 0 // 원장 지표. 미납은 준비 중.
              ? "이탈 위험 확인" // 원장 지표. 미납은 준비 중.
              : "학생 목록"; // 원장 지표. 미납은 준비 중.

    return ( // 원장 운영 홈. 미납은 준비 중 카피.
        <section className={styles.page}>{/* 원장 운영 홈. 미납은 준비 중 카피. */}
            <header className={styles.heading}>{/* 우선 업무로 바로가기 */}
                <div>{/* 레이아웃 상자. */}
                    <span>DIRECTOR</span>{/* 인라인 표시. */}
                    <h1>운영 대시보드</h1>{/* 제목. */}
                    <p>{/* 문장. */}
                        승인·이탈·미납·문의와 오늘 출결 요약을 한눈에{/* 원장 지표. 미납은 준비 중. */}
                        확인합니다.{/* 원장 지표. 미납은 준비 중. */}
                    </p>{/* p 닫기. */}
                </div>{/* div 닫기. */}
                <Link href={primaryHref} className={styles.primaryBtn}>{/* 이동. layout 가드를 대신하지 않는다. */}
                    {primaryLabel}{/* 원장 지표. 미납은 준비 중. */}
                </Link>{/* Link 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.metrics}>{/* href 있는 카드만 링크. 미납·문의는 표시만. */}
                {cards.map((card) => { // 구문. 원장 지표. 미납은 준비 중.
                    const body = ( // 구문. 원장 지표. 미납은 준비 중.
                        <>{/* 요소. 원장 지표. 미납은 준비 중. */}
                            <StatusChip tone={card.tone}>{/* StatusChip. 원장 지표. 미납은 준비 중. */}
                                {card.label}{/* 원장 지표. 미납은 준비 중. */}
                            </StatusChip>{/* StatusChip 닫기. */}
                            <strong>{card.value}</strong>{/* 강조. */}
                            <p>{card.detail}</p>{/* 문장. */}
                        </> // 구문 끝.
                    ); // 호출/그룹 끝.

                    return card.href ? ( // 반환. 원장 지표. 미납은 준비 중.
                        <Link // 이동. layout 가드를 대신하지 않는다.
                            key={card.label} // key 필드.
                            href={card.href} // href 필드.
                            className={styles.metricCard} // className 필드.
                        >{/* 원장 지표. 미납은 준비 중. */}
                            {body}{/* 원장 지표. 미납은 준비 중. */}
                        </Link> // Link 닫기.
                    ) : ( // 구문. 원장 지표. 미납은 준비 중.
                        <article key={card.label} className={styles.metricCard}>{/* 원장 운영 홈. 미납은 준비 중 카피. */}
                            {body}{/* 원장 지표. 미납은 준비 중. */}
                        </article> // article 닫기.
                    ); // 호출/그룹 끝.
                })}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            <div className={styles.grid}>{/* 레이아웃 상자. */}
                <article className={styles.panel}>{/* 확인할 업무 큐 */}
                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                        <h2>확인할 업무</h2>{/* 소제목. */}
                        <StatusChip // StatusChip. 원장 지표. 미납은 준비 중.
                            tone={ // 객체/블록 시작.
                                metrics.pendingReports + metrics.openChurn > 0 // 원장 지표. 미납은 준비 중.
                                    ? "warning" // 원장 지표. 미납은 준비 중.
                                    : "success" // 원장 지표. 미납은 준비 중.
                            } // 블록 끝.
                        >{/* 원장 지표. 미납은 준비 중. */}
                            {metrics.pendingReports + metrics.openChurn > 0 // 원장 지표. 미납은 준비 중.
                                ? "조치 필요" // 원장 지표. 미납은 준비 중.
                                : "정상"}{/* 원장 지표. 미납은 준비 중. */}
                        </StatusChip>{/* StatusChip 닫기. */}
                    </div>{/* div 닫기. */}
                    <ul>{/* 목록. */}
                        {queue.map((item) => ( // 구문. 원장 지표. 미납은 준비 중.
                            <li key={item.label}>{/* 항목. */}
                                <strong>{item.label}</strong>{/* 강조. */}
                                <span>{item.detail}</span>{/* 인라인 표시. */}
                                <Link // 이동. layout 가드를 대신하지 않는다.
                                    href={item.href} // href 필드.
                                    className={styles.queueLink} // className 필드.
                                >{/* 원장 지표. 미납은 준비 중. */}
                                    <StatusChip tone={item.tone}>{/* StatusChip. 원장 지표. 미납은 준비 중. */}
                                        {item.count}{/* 원장 지표. 미납은 준비 중. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </Link>{/* Link 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul>{/* ul 닫기. */}
                </article>{/* article 닫기. */}

                <article className={styles.panel}>{/* 원장 전용 URL만. 교사 Screen을 쓰지 않는다. */}
                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                        <h2>빠른 이동</h2>{/* 소제목. */}
                        <StatusChip>원장</StatusChip>{/* StatusChip. 원장 지표. 미납은 준비 중. */}
                    </div>{/* div 닫기. */}
                    <div className={styles.shortcuts}>{/* 레이아웃 상자. */}
                        <Link href="/director/reports">AI 리포트</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                        <Link href="/director/churn">이탈 위험</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                        <Link href="/director/students">학생</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                        <Link href="/director/parents">학부모</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                        <Link href="/director/users">가입 사용자</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                        <Link href="/director/permissions">권한</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                    </div>{/* div 닫기. */}
                </article>{/* article 닫기. */}
            </div>{/* div 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
