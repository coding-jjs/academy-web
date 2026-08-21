/**
 * 원장 오늘 지표 카드 UI (서버 컴포넌트).
 *
 * props: `metrics` — `getDirectorDashboardMetrics`가 계산한 숫자.
 * 여기서는 표시와 바로가기만. 승인·이탈 처리는 각 업무 page 몫이다.
 *
 * 미납 값은 "준비 중". ParentPaymentsScreen·청구 API를 호출하지 않는다.
 * 신규 문의 카드는 href가 없어 직원 상담(`/employee/counseling`)으로 보내지 않는다.
 */

import Link from "next/link";
import StatusChip from "@/components/ui/StatusChip";
import type { DirectorDashboardMetrics } from "@/features/dashboard/types";
import { REPORT_STATUS_METADATA } from "@/features/reports/presentation";
import styles from "./DirectorDashboardScreen.module.css";

type MetricCard = {
    label: string;
    value: string;
    detail: string;
    tone: "neutral" | "success" | "warning" | "danger";
    href?: string;
};

type QueueItem = {
    label: string;
    detail: string;
    href: string;
    count: number;
    tone: "neutral" | "success" | "warning" | "danger";
};

/** 지표 카드·업무 큐·바로가기를 그린다. 저장 Action은 없다. */
export default function DirectorDashboardScreen({
    metrics,
}: {
    metrics: DirectorDashboardMetrics;
}) {
    const cards: MetricCard[] = [
        {
            label: REPORT_STATUS_METADATA.PENDING_APPROVAL.label,
            value: String(metrics.pendingReports),
            detail: "AI 리포트",
            tone: metrics.pendingReports > 0 ? "warning" : "success",
            href: "/director/reports",
        },
        {
            label: "이탈 위험",
            value: String(metrics.openChurn),
            detail: "감지·상담·검토",
            tone: metrics.openChurn > 0 ? "danger" : "success",
            href: "/director/churn",
        },
        {
            label: "미납",
            value: "준비 중",
            detail: "",
            tone: "neutral",
        },
        {
            label: "신규 문의",
            value: String(metrics.newInquiries),
            detail: "미처리",
            tone: metrics.newInquiries > 0 ? "warning" : "neutral",
        },
        {
            label: "재원 학생",
            value: String(metrics.enrolledStudents),
            detail: "등록 상태",
            tone: "neutral",
            href: "/director/students",
        },
        {
            label: "오늘 출석",
            value:
                metrics.todayAttendanceRate == null
                    ? "—"
                    : `${metrics.todayAttendanceRate}%`,
            detail:
                metrics.todaySessionCount > 0
                    ? `오늘 세션 ${metrics.todaySessionCount}건`
                    : "오늘 세션 없음",
            tone: "neutral",
        },
    ];

    const queue: QueueItem[] = [
        {
            label: "AI 리포트",
            detail: "승인 후 학부모 발송",
            href: "/director/reports",
            count: metrics.pendingReports,
            tone: metrics.pendingReports > 0 ? "warning" : "success",
        },
        {
            label: "이탈 위험",
            detail: "배정·검토 필요",
            href: "/director/churn",
            count: metrics.openChurn,
            tone: metrics.openChurn > 0 ? "danger" : "success",
        },
        {
            label: "가입 대기",
            detail: "역할 미배정 GUEST",
            href: "/director/users",
            count: metrics.guestUsers,
            tone: metrics.guestUsers > 0 ? "warning" : "neutral",
        },
        {
            label: "학부모 연결",
            detail: "자녀 연결 관리",
            href: "/director/parents",
            count: metrics.enrolledStudents,
            tone: "neutral",
        },
    ];

    const primaryHref =
        metrics.pendingReports > 0
            ? "/director/reports"
            : metrics.openChurn > 0
              ? "/director/churn"
              : "/director/students";

    const primaryLabel =
        metrics.pendingReports > 0
            ? "승인 대기 확인"
            : metrics.openChurn > 0
              ? "이탈 위험 확인"
              : "학생 목록";

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>DIRECTOR</span>
                    <h1>운영 대시보드</h1>
                    <p>
                        승인·이탈·미납·문의와 오늘 출결 요약을 한눈에
                        확인합니다.
                    </p>
                </div>
                <Link href={primaryHref} className={styles.primaryBtn}>
                    {primaryLabel}
                </Link>
            </header>
            <div className={styles.metrics}>
                {cards.map((card) => {
                    const body = (
                        <>
                            <StatusChip tone={card.tone}>
                                {card.label}
                            </StatusChip>
                            <strong>{card.value}</strong>
                            <p>{card.detail}</p>
                        </>
                    );

                    return card.href ? (
                        <Link
                            key={card.label}
                            href={card.href}
                            className={styles.metricCard}
                        >
                            {body}
                        </Link>
                    ) : (
                        <article key={card.label} className={styles.metricCard}>
                            {body}
                        </article>
                    );
                })}
            </div>
            <div className={styles.grid}>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>확인할 업무</h2>
                        <StatusChip
                            tone={
                                metrics.pendingReports + metrics.openChurn > 0
                                    ? "warning"
                                    : "success"
                            }
                        >
                            {metrics.pendingReports + metrics.openChurn > 0
                                ? "조치 필요"
                                : "정상"}
                        </StatusChip>
                    </div>
                    <ul>
                        {queue.map((item) => (
                            <li key={item.label}>
                                <strong>{item.label}</strong>
                                <span>{item.detail}</span>
                                <Link
                                    href={item.href}
                                    className={styles.queueLink}
                                >
                                    <StatusChip tone={item.tone}>
                                        {item.count}
                                    </StatusChip>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </article>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>빠른 이동</h2>
                        <StatusChip>원장</StatusChip>
                    </div>
                    <div className={styles.shortcuts}>
                        <Link href="/director/reports">AI 리포트</Link>
                        <Link href="/director/churn">이탈 위험</Link>
                        <Link href="/director/students">학생</Link>
                        <Link href="/director/parents">학부모</Link>
                        <Link href="/director/users">가입 사용자</Link>
                        <Link href="/director/permissions">권한</Link>
                    </div>
                </article>
            </div>
        </section>
    );
}
