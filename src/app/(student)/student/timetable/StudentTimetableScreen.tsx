"use client";

import { useMemo } from "react";
import StatusChip from "@/components/ui/StatusChip";
import styles from "./StudentTimetableScreen.module.css";

export type WeekDayKey =
    | "mon"
    | "tue"
    | "wed"
    | "thu"
    | "fri"
    | "sat"
    | "sun";

export type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "ABSENT"
    | "EXCUSED"
    | "EARLY_LEAVE";

export type WeekDay = {
    key: WeekDayKey;
    label: string;
    isToday: boolean;
    dateIso: string;
};

export type StudentTimetableData = {
    linked: boolean;
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    classes: {
        id: string;
        name: string;
        subject: string;
        teacherName: string | null;
    }[];
    sessions: {
        id: string;
        className: string;
        subject: string;
        teacherName: string | null;
        classroom: string | null;
        dayKey: WeekDayKey;
        timeLabel: string;
        startsAt: string;
        endsAt: string;
        isToday: boolean;
        status: string;
        attendanceStatus: AttendanceStatus | null;
        checkInAt: string | null;
    }[];
    recurring: {
        classId: string;
        className: string;
        subject: string;
        teacherName: string | null;
        day: WeekDayKey;
        start: string;
        end: string;
        classroom: string | null;
    }[];
};

const DAY_LABEL: Record<WeekDayKey, string> = {
    mon: "월",
    tue: "화",
    wed: "수",
    thu: "목",
    fri: "금",
    sat: "토",
    sun: "일",
};

const statusMeta: Record<
    AttendanceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PRESENT: { label: "출석", tone: "success" },
    LATE: { label: "지각", tone: "warning" },
    ABSENT: { label: "결석", tone: "danger" },
    EXCUSED: { label: "공결", tone: "neutral" },
    EARLY_LEAVE: { label: "조퇴", tone: "warning" },
};

function formatCheckIn(iso: string | null) {
    if (!iso) return null;
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(iso));
}

export default function StudentTimetableScreen({
    weekDays,
    data,
}: {
    weekDays: WeekDay[];
    data: StudentTimetableData;
}) {
    const byDay = useMemo(() => {
        const map = Object.fromEntries(
            weekDays.map((d) => [d.key, [] as typeof data.sessions]),
        ) as Record<WeekDayKey, typeof data.sessions>;

        for (const session of data.sessions) {
            map[session.dayKey]?.push(session);
        }
        return map;
    }, [data, weekDays]);

    const todaySessions = data.sessions.filter((s) => s.isToday);

    if (!data.linked) {
        return (
            <section className={styles.page}>
                <header className={styles.heading}>
                    <div>
                        <span>TIMETABLE</span>
                        <h1>시간표</h1>
                        <p>이번 주 수업 시간과 강의실을 확인합니다.</p>
                    </div>
                </header>
                <div className={styles.empty}>
                    <h2>연결된 학생 정보가 없습니다</h2>
                    <p>학원에서 학생 계정 연결 후 시간표를 볼 수 있습니다.</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>TIMETABLE</span>
                    <h1>시간표</h1>
                    <p>이번 주 수업 시간과 강의실을 확인합니다.</p>
                </div>
            </header>

            <div className={styles.hero}>
                <StatusChip tone="neutral">이번 주</StatusChip>
                <h2>
                    {data.studentName}
                    {data.classes[0] ? ` · ${data.classes[0].name}` : ""}
                </h2>
                <p>
                    수강 반 {data.classes.length}개 · 이번 주 수업{" "}
                    {data.sessions.length}건
                </p>

                {todaySessions.length > 0 ? (
                    <ul className={styles.todayList}>
                        {todaySessions.map((s) => (
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
                                            statusMeta[s.attendanceStatus].tone
                                        }
                                    >
                                        {statusMeta[s.attendanceStatus].label}
                                        {formatCheckIn(s.checkInAt)
                                            ? ` ${formatCheckIn(s.checkInAt)}`
                                            : ""}
                                    </StatusChip>
                                ) : (
                                    <StatusChip>예정</StatusChip>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.muted}>오늘 예정된 수업이 없습니다.</p>
                )}
            </div>

            <div className={styles.weekGrid}>
                {weekDays.map((day) => (
                    <article
                        key={day.key}
                        className={
                            day.isToday ? styles.dayToday : styles.dayCard
                        }
                    >
                        <div className={styles.dayHead}>
                            <strong>{DAY_LABEL[day.key]}</strong>
                            <span>{day.label}</span>
                            {day.isToday && (
                                <StatusChip tone="success">오늘</StatusChip>
                            )}
                        </div>
                        {byDay[day.key].length === 0 ? (
                            <p className={styles.muted}>없음</p>
                        ) : (
                            <ul className={styles.slotList}>
                                {byDay[day.key].map((s) => (
                                    <li key={s.id}>
                                        <strong>{s.timeLabel}</strong>
                                        <span>{s.className}</span>
                                        <small>
                                            {s.subject}
                                            {s.classroom
                                                ? ` · ${s.classroom}`
                                                : ""}
                                            {s.teacherName
                                                ? ` · ${s.teacherName}`
                                                : ""}
                                        </small>
                                        {s.attendanceStatus && (
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
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                ))}
            </div>

            <article className={styles.panel}>
                <div className={styles.panelHead}>
                    <h2>수강 반</h2>
                    <StatusChip>{data.classes.length}개</StatusChip>
                </div>
                {data.classes.length === 0 ? (
                    <p className={styles.muted}>등록된 반이 없습니다.</p>
                ) : (
                    <ul className={styles.classList}>
                        {data.classes.map((item) => (
                            <li key={item.id}>
                                <div>
                                    <strong>{item.name}</strong>
                                    <span>
                                        {item.subject}
                                        {item.teacherName
                                            ? ` · ${item.teacherName}`
                                            : ""}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </article>

            {data.recurring.length > 0 && (
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>반복 시간표</h2>
                        <StatusChip tone="neutral">템플릿</StatusChip>
                    </div>
                    <ul className={styles.classList}>
                        {data.recurring.map((slot, index) => (
                            <li
                                key={`${slot.classId}-${slot.day}-${index}`}
                            >
                                <div>
                                    <strong>
                                        {DAY_LABEL[slot.day]} {slot.start}~
                                        {slot.end}
                                    </strong>
                                    <span>
                                        {slot.className}
                                        {slot.classroom
                                            ? ` · ${slot.classroom}`
                                            : ""}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
