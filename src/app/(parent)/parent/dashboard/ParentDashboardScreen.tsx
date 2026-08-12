"use client";

import Link from "next/link";
import { useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation";
import { formatKstMonthDay } from "@/lib/date-kst";
import type {
    DashboardNewsItem,
    ParentDashboardChild,
} from "@/features/dashboard/types";
import styles from "./ParentDashboardScreen.module.css";

const statusMeta = ATTENDANCE_STATUS_METADATA;

const quickLinks = [
    { href: "/parent/attendance", label: "출결" },
    { href: "/parent/reports", label: "리포트" },
    { href: "/parent/payments", label: "결제" },
    { href: "/parent/timetable", label: "시간표" },
    { href: "/parent/grades", label: "성적·오답" },
    { href: "/parent/inbox", label: "쪽지함" },
];

export default function ParentDashboardScreen({
    childList,
    unreadCount,
    news,
}: {
    childList: ParentDashboardChild[];
    unreadCount: number;
    news: DashboardNewsItem[];
}) {
    const [activeChildId, setActiveChildId] = useState(childList[0]?.id ?? "");
    const child =
        childList.find((item) => item.id === activeChildId) ??
        childList[0] ??
        null;

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MY CHILD</span>
                    <h1>자녀 홈</h1>
                    <p>선택한 자녀의 오늘 일정과 학습 소식을 확인하세요.</p>
                </div>
                {unreadCount > 0 && (
                    <Link href="/parent/inbox" className={styles.alertLink}>
                        미확인 쪽지 {unreadCount}
                    </Link>
                )}
            </header>

            {childList.length === 0 ? (
                <div className={styles.empty}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>학원에서 연결을 완료하면 자녀 홈이 표시됩니다.</p>
                </div>
            ) : (
                <>
                    {childList.length > 1 && (
                        <div className={styles.childSwitch}>
                            {childList.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        item.id === child?.id
                                            ? styles.childActive
                                            : styles.childBtn
                                    }
                                    onClick={() => setActiveChildId(item.id)}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {child && (
                        <>
                            <div className={styles.hero}>
                                {child.arrivalSummary ? (
                                    <>
                                        <StatusChip tone="neutral">오늘</StatusChip>
                                        <h2>{child.arrivalSummary.title}</h2>
                                        <p>{child.arrivalSummary.detail}</p>
                                        {child.arrivalSummary.status ? (
                                            <StatusChip
                                                tone={
                                                    statusMeta[
                                                        child.arrivalSummary.status
                                                    ].tone
                                                }
                                            >
                                                {
                                                    statusMeta[
                                                        child.arrivalSummary.status
                                                    ].label
                                                }
                                            </StatusChip>
                                        ) : (
                                            <StatusChip>미체크</StatusChip>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <StatusChip tone="neutral">오늘</StatusChip>
                                        <h2>오늘 수업 없음</h2>
                                        <p>
                                            {child.className
                                                ? `${child.name} · ${child.className}`
                                                : child.name}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className={styles.quick}>
                                {quickLinks.map((link) => (
                                    <Link key={link.href} href={link.href}>
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            <div className={styles.grid}>
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>오늘 시간표</h2>
                                        <Link href="/parent/attendance">전체</Link>
                                    </div>
                                    {child.todaySessions.length === 0 ? (
                                        <p className={styles.muted}>
                                            오늘 예정된 수업이 없습니다.
                                        </p>
                                    ) : (
                                        <ul className={styles.list}>
                                            {child.todaySessions.map((s) => (
                                                <li key={s.id}>
                                                    <div>
                                                        <strong>{s.className}</strong>
                                                        <span>
                                                            {s.timeLabel}
                                                            {s.classroom
                                                                ? ` · ${s.classroom}`
                                                                : ""}
                                                        </span>
                                                    </div>
                                                    {s.attendanceStatus ? (
                                                        <StatusChip
                                                            tone={
                                                                statusMeta[
                                                                    s.attendanceStatus
                                                                ].tone
                                                            }
                                                        >
                                                            {
                                                                statusMeta[
                                                                    s.attendanceStatus
                                                                ].label
                                                            }
                                                        </StatusChip>
                                                    ) : (
                                                        <StatusChip>예정</StatusChip>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>

                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>학습 보고서</h2>
                                        <Link href="/parent/reports">전체</Link>
                                    </div>
                                    {child.reports.length === 0 ? (
                                        <p className={styles.muted}>
                                            아직 받은 리포트가 없습니다.
                                        </p>
                                    ) : (
                                        <ul className={styles.list}>
                                            {child.reports.map((r) => (
                                                <li key={r.id}>
                                                    <div>
                                                        <strong>
                                                            {r.content.slice(0, 40) ||
                                                                "학습 보고서"}
                                                            {r.content.length > 40
                                                                ? "…"
                                                                : ""}
                                                        </strong>
                                                        <span>
                                                            {r.teacherName}
                                                            {r.sentAt
                                                                ? ` · ${formatKstMonthDay(r.sentAt)}`
                                                                : ""}
                                                        </span>
                                                    </div>
                                                    <StatusChip
                                                        tone={
                                                            r.parentReadAt
                                                                ? "neutral"
                                                                : "warning"
                                                        }
                                                    >
                                                        {r.parentReadAt
                                                            ? "읽음"
                                                            : "새 리포트"}
                                                    </StatusChip>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                            </div>

                            <article className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <h2>학원 소식</h2>
                                    <Link href="/parent/news">전체</Link>
                                </div>
                                {news.length === 0 ? (
                                    <p className={styles.muted}>
                                        등록된 소식이 없습니다.
                                    </p>
                                ) : (
                                    <ul className={styles.list}>
                                        {news.map((item) => (
                                            <li key={item.id}>
                                                <div>
                                                    <strong>{item.title}</strong>
                                                </div>
                                                <span className={styles.date}>
                                                    {formatKstMonthDay(item.createdAt)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        </>
                    )}
                </>
            )}
        </section>
    );
}
