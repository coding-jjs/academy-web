"use client";

/**
 * 오늘 담당 수업·지표 요약 UI (클라이언트).
 *
 * `/teacher/dashboard`만 이 Screen을 연결한다. 직원 대시보드는 재사용하지 않는다.
 * props `role`은 TEACHER/STAFF 라벨·지표 문구용이나, 바로가기는 `/teacher/*`로 고정이다.
 *
 * props: staffName, metrics, sessions — `getStaffDashboardData` 결과.
 * Server Action을 제출하지 않는다. 출석 저장은 `/teacher/attendance`.
 */

import Link from "next/link";
import StatusChip from "@/components/ui/StatusChip";
import type {
    StaffDashboardMetrics,
    StaffDashboardSession,
} from "@/features/dashboard/types";
import styles from "./StaffDashboardScreen.module.css";

/** 오늘 수업 카드와 출석/리포트 바로가기를 그린다. */
export default function StaffDashboardScreen({
    role,
    staffName,
    metrics,
    sessions,
}: {
    role: "TEACHER" | "STAFF";
    staffName: string;
    metrics: StaffDashboardMetrics;
    sessions: StaffDashboardSession[];
}) {
    const quickLinks = [
        { href: "/teacher/attendance", label: "출석 체크" },
        { href: "/teacher/reports", label: "AI 리포트" },
        { href: "/teacher/students", label: "담당 학생" },
        {
            href: "/teacher/counseling",
            label:
                metrics.pendingChurnCare > 0
                    ? `상담 관리 (${metrics.pendingChurnCare})`
                    : "상담 관리",
        },
    ];

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>{role === "TEACHER" ? "TEACHER" : "STAFF"}</span>
                    <h1>내 수업</h1>
                    <p>
                        {staffName}님, 오늘 담당 수업과 학생 현황을 확인하세요.
                    </p>
                </div>
            </header>
            <div className={styles.metrics}>
                <article>
                    <span>오늘 수업</span>
                    <strong>{metrics.todayClassCount}개</strong>
                    <p>
                        {metrics.firstClassTime
                            ? `첫 수업 ${metrics.firstClassTime}`
                            : "예정 없음"}
                    </p>
                </article>
                <article>
                    <span>출결 미입력</span>
                    <strong>{metrics.uncheckedSessions}개 반</strong>
                    <p>
                        {metrics.uncheckedSessions > 0
                            ? "출석 체크가 필요합니다"
                            : "모두 입력됨"}
                    </p>
                </article>
                <article>
                    <span>보고서 작업</span>
                    <strong>{metrics.pendingReports}건</strong>
                    <p>작성·승인대기·반려</p>
                </article>
                <article>
                    <span>
                        {role === "TEACHER" ? "담당 학생" : "상담 문의"}
                    </span>
                    <strong>
                        {role === "TEACHER"
                            ? `${metrics.myStudentCount}명`
                            : `${metrics.openInquiries}건`}
                    </strong>
                    <p>
                        {role === "TEACHER" ? "재원 학생" : "신규·진행중 문의"}
                    </p>
                </article>
            </div>
            <div className={styles.quick}>
                {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        {link.label}
                    </Link>
                ))}
            </div>
            <article className={styles.panel}>
                <div className={styles.panelHead}>
                    <h2>오늘 일정</h2>
                    <StatusChip>{sessions.length}건</StatusChip>
                </div>
                {sessions.length === 0 ? (
                    <p className={styles.muted}>오늘 예정된 수업이 없습니다.</p>
                ) : (
                    <ul className={styles.list}>
                        {sessions.map((item) => (
                            <li key={item.id}>
                                <div>
                                    <strong>{item.className}</strong>
                                    <span>
                                        {item.timeLabel}
                                        {item.classroom
                                            ? ` · ${item.classroom}`
                                            : ""}
                                        {` · ${item.subject}`}
                                    </span>
                                    <small>
                                        학생 {item.studentCount}명
                                        {item.uncheckedCount > 0
                                            ? ` · 미체크 ${item.uncheckedCount}명`
                                            : " · 출결 완료"}
                                    </small>
                                </div>
                                <div className={styles.rowActions}>
                                    {item.uncheckedCount > 0 ? (
                                        <StatusChip tone="warning">
                                            미입력
                                        </StatusChip>
                                    ) : (
                                        <StatusChip tone="success">
                                            완료
                                        </StatusChip>
                                    )}
                                    <Link
                                        href="/teacher/attendance"
                                        className={
                                            item.uncheckedCount > 0
                                                ? styles.primaryLink
                                                : styles.secondaryLink
                                        }
                                    >
                                        출석 체크
                                    </Link>
                                    <Link
                                        href="/teacher/students"
                                        className={styles.secondaryLink}
                                    >
                                        학생 보기
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </article>
        </section>
    );
}
