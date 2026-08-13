import Link from "next/link";
import StatusChip from "@/components/ui/StatusChip";
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation";
import { formatKstMonthDay } from "@/lib/date-kst";
import type { StudentDashboardData } from "@/features/dashboard/types";
import styles from "./StudentDashboardScreen.module.css";

const statusMeta = ATTENDANCE_STATUS_METADATA;

const quickLinks = [
    { href: "/student/timetable", label: "시간표" },
    { href: "/student/grades", label: "성적" },
    { href: "/student/grades", label: "오답" },
    { href: "/student/inbox", label: "쪽지" },
];

export default function StudentDashboardScreen({
    data,
}: {
    data: StudentDashboardData;
}) {
    if (!data.linked) {
        return (
            <section className={styles.page}>
                <header className={styles.heading}>
                    <div>
                        <span>MY ACADEMY</span>
                        <h1>내 홈</h1>
                        <p>학생 프로필 연결을 기다리고 있습니다.</p>
                    </div>
                </header>
                <div className={styles.empty}>
                    <h2>연결된 학생 정보가 없습니다</h2>
                    <p>
                        학원에서 학생 계정 연결을 완료하면 수업·출결·성적이
                        표시됩니다.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MY ACADEMY</span>
                    <h1>내 홈</h1>
                    <p>오늘 수업, 숙제와 새로운 공지를 한눈에 확인하세요.</p>
                </div>
                {data.unreadCount > 0 && (
                    <Link href="/student/inbox" className={styles.alertLink}>
                        새 쪽지 {data.unreadCount}
                    </Link>
                )}
            </header>

            <div className={styles.hero}>
                {data.todayAttendanceLabel ? (
                    <StatusChip
                        tone={statusMeta[data.todayAttendanceLabel].tone}
                    >
                        오늘 {statusMeta[data.todayAttendanceLabel].label}
                    </StatusChip>
                ) : (
                    <StatusChip tone="neutral">오늘 출석</StatusChip>
                )}
                <h2>어서오세요, {data.studentName}님</h2>
                <p>
                    {data.nextSession
                        ? `다음 수업은 ${data.nextSession.timeLabel.split("~")[0]} ${data.nextSession.className}${
                              data.nextSession.classroom
                                  ? ` · ${data.nextSession.classroom}`
                                  : ""
                          }입니다.`
                        : "오늘 예정된 수업이 없습니다."}
                </p>
            </div>

            <div className={styles.quick}>
                {quickLinks.map((link) => (
                    <Link key={`${link.href}-${link.label}`} href={link.href}>
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className={styles.metrics}>
                <article>
                    <span>오늘 수업</span>
                    <strong>{data.todaySessions.length}</strong>
                    <p>건</p>
                </article>
                <article>
                    <span>최근 성적</span>
                    <strong>
                        {data.latestGrade
                            ? `${data.latestGrade.score}`
                            : "—"}
                    </strong>
                    <p>
                        {data.latestGrade
                            ? data.latestGrade.subject
                            : "기록 없음"}
                    </p>
                </article>
                <article>
                    <span>복습 오답</span>
                    <strong>{data.openWrongCount}</strong>
                    <p>개</p>
                </article>
            </div>

            <div className={styles.grid}>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>오늘 시간표</h2>
                        <Link href="/student/timetable">전체</Link>
                    </div>
                    {data.todaySessions.length === 0 ? (
                        <p className={styles.muted}>오늘 수업이 없습니다.</p>
                    ) : (
                        <ul className={styles.list}>
                            {data.todaySessions.map((s, index) => (
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
                                                statusMeta[s.attendanceStatus]
                                                    .tone
                                            }
                                        >
                                            {
                                                statusMeta[s.attendanceStatus]
                                                    .label
                                            }
                                        </StatusChip>
                                    ) : (
                                        <StatusChip>
                                            {index === 0 ? "예정" : "다음"}
                                        </StatusChip>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>숙제</h2>
                        <Link href="/student/grades">학습</Link>
                    </div>
                    {data.homework.length === 0 ? (
                        <p className={styles.muted}>등록된 숙제가 없습니다.</p>
                    ) : (
                        <ul className={styles.list}>
                            {data.homework.map((item) => (
                                <li key={item.id}>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <span>
                                            {formatKstMonthDay(item.recordDate)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            </div>

            <article className={styles.panel}>
                <div className={styles.panelHead}>
                    <h2>청소년 체험 소식</h2>
                    <Link href="/student/news">전체</Link>
                </div>
                {data.news.length === 0 ? (
                    <p className={styles.muted}>등록된 소식이 없습니다.</p>
                ) : (
                    <ul className={styles.list}>
                        {data.news.map((item) => (
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
        </section>
    );
}
