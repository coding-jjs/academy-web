"use client";

import { useMemo } from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    ATTENDANCE_STATUS_METADATA,
    formatAttendanceCheckInTime,
} from "@/features/attendance/presentation";
import { WEEK_DAY_LABELS } from "@/features/timetable/presentation";
import type {
    StudentTimetableData,
    WeekDay,
    WeekDayKey,
} from "@/features/timetable/types";
import styles from "./StudentTimetableScreen.module.css";

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
                                            ATTENDANCE_STATUS_METADATA[
                                                s.attendanceStatus
                                            ].tone
                                        }
                                    >
                                        {
                                            ATTENDANCE_STATUS_METADATA[
                                                s.attendanceStatus
                                            ].label
                                        }
                                        {formatAttendanceCheckInTime(s.checkInAt)
                                            ? ` ${formatAttendanceCheckInTime(s.checkInAt)}`
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
                            <strong>{WEEK_DAY_LABELS[day.key]}</strong>
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
                                                    ATTENDANCE_STATUS_METADATA[
                                                        s.attendanceStatus
                                                    ].tone
                                                }
                                            >
                                                {
                                                    ATTENDANCE_STATUS_METADATA[
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
                                        {WEEK_DAY_LABELS[slot.day]} {slot.start}~
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
