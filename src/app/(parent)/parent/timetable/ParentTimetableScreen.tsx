"use client";

/**
 * 자녀 주간 시간표 그리드 (클라이언트).
 *
 * props: childList, weekDays, activeChildId — timetable data.
 * Session 행이 진실이고 class.schedule JSON은 거의 비어 있다.
 * 일정을 고치지 않는다. 자녀 전환은 child 쿠키.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import type {
    ParentTimetableChild,
    WeekDay,
    WeekDayKey,
} from "@/features/timetable/types";
import { WEEK_DAY_LABELS } from "@/features/timetable/presentation";
import styles from "./ParentTimetableScreen.module.css";
import { writeParentChildCookie } from "@/features/families/parent-child-cooke";

/** 요일별 세션과 오늘 하이라이트를 그린다. */
export default function ParentTimetableScreen({
    childList,
    weekDays,
    activeChildId,
}: {
    childList: ParentTimetableChild[];
    weekDays: WeekDay[];
    activeChildId: string;
}) {
    const child =
        childList.find((item) => item.id === activeChildId) ??
        childList[0] ??
        null;

    const classNameLabel =
        child && child.classes.length > 0
            ? ` · ${child.classes.map((c) => c.name).join(", ")}`
            : "";

    const [weekExpanded, setWeekExpanded] = useState(false);

    const byDay = useMemo(() => {
        const map = Object.fromEntries(
            weekDays.map((d) => [
                d.key,
                [] as NonNullable<typeof child>["sessions"],
            ]),
        ) as Record<WeekDayKey, NonNullable<typeof child>["sessions"]>;

        if (!child) return map;
        for (const session of child.sessions) {
            map[session.dayKey]?.push(session);
        }
        return map;
    }, [child, weekDays]);

    const hasDenseDays = useMemo(
        () => weekDays.some((day) => byDay[day.key].length >= 2),
        [byDay, weekDays],
    );

    const todaySessions = child?.sessions.filter((s) => s.isToday) ?? [];
    const router = useRouter();

    function selectChild(childId: string) {
        writeParentChildCookie(childId);
        router.replace(`/parent/timetable?childId=${childId}`);
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>CHILD TIMETABLE</span>
                    <h1>자녀 시간표</h1>
                    <p>선택한 자녀의 수업 시간과 강의실을 확인합니다.</p>
                </div>
                <Link
                    href={`/parent/attendance?childId=${child.id}`}
                    className={styles.secondaryBtn}
                >
                    출결·결석 신청
                </Link>
            </header>
            {childList.length === 0 ? (
                <div className={styles.empty}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>학원에서 연결을 완료하면 시간표가 표시됩니다.</p>
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
                                    onClick={() => selectChild(item.id)}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {child && (
                        <>
                            <div className={styles.hero}>
                                <StatusChip tone="neutral">이번 주</StatusChip>
                                <h2>
                                    {child.name}
                                    {classNameLabel}
                                </h2>
                                <p>
                                    수강 반 {child.classes.length}개 · 이번 주
                                    수업 {child.sessions.length}건
                                </p>
                                {todaySessions.length > 0 ? (
                                    <ul className={styles.todayList}>
                                        {todaySessions.map((s) => (
                                            <li key={s.id}>
                                                <strong>{s.className}</strong>
                                                <span>
                                                    {s.timeLabel}
                                                    {s.classroom
                                                        ? ` · ${s.classroom}`
                                                        : ""}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={styles.muted}>
                                        오늘 예정된 수업이 없습니다.
                                    </p>
                                )}
                            </div>
                            <div className={styles.weekSection}>
                                <div className={styles.weekScroll}>
                                    <div className={styles.weekGrid}>
                                        {weekDays.map((day) => {
                                            const daySessions = byDay[day.key];
                                            const visibleSessions = weekExpanded
                                                ? daySessions
                                                : daySessions.slice(0, 1);
                                            const hiddenCount =
                                                daySessions.length -
                                                visibleSessions.length;
                                            return (
                                                <article
                                                    key={day.key}
                                                    className={
                                                        day.isToday
                                                            ? styles.dayToday
                                                            : styles.dayCard
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.dayHead
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                WEEK_DAY_LABELS[
                                                                    day.key
                                                                ]
                                                            }
                                                        </strong>
                                                        <span>{day.label}</span>
                                                        {day.isToday && (
                                                            <StatusChip tone="success">
                                                                오늘
                                                            </StatusChip>
                                                        )}
                                                    </div>
                                                    {daySessions.length ===
                                                    0 ? (
                                                        <p
                                                            className={
                                                                styles.muted
                                                            }
                                                        >
                                                            없음
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <ul
                                                                className={
                                                                    styles.slotList
                                                                }
                                                            >
                                                                {visibleSessions.map(
                                                                    (s) => (
                                                                        <li
                                                                            key={
                                                                                s.id
                                                                            }
                                                                        >
                                                                            <strong>
                                                                                {
                                                                                    s.timeLabel
                                                                                }
                                                                            </strong>
                                                                            <span>
                                                                                {
                                                                                    s.className
                                                                                }
                                                                            </span>
                                                                            <small>
                                                                                {
                                                                                    s.subject
                                                                                }
                                                                            </small>
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                            {!weekExpanded &&
                                                                hiddenCount >
                                                                    0 && (
                                                                    <p
                                                                        className={
                                                                            styles.moreHint
                                                                        }
                                                                    >
                                                                        +
                                                                        {
                                                                            hiddenCount
                                                                        }
                                                                        개 더
                                                                    </p>
                                                                )}
                                                        </>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                                {hasDenseDays && (
                                    <button
                                        type="button"
                                        className={styles.weekToggleBtn}
                                        onClick={() =>
                                            setWeekExpanded(!weekExpanded)
                                        }
                                    >
                                        {weekExpanded ? "접기" : `더보기`}
                                    </button>
                                )}
                            </div>
                            <article className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <h2>수강 반</h2>
                                    <StatusChip>
                                        {child.classes.length}개
                                    </StatusChip>
                                </div>
                                {child.classes.length === 0 ? (
                                    <p className={styles.muted}>
                                        등록된 반이 없습니다.
                                    </p>
                                ) : (
                                    <ul className={styles.classList}>
                                        {child.classes.map((item) => (
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
                            {child.recurring.length > 0 && (
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>반복 시간표</h2>
                                        <StatusChip tone="neutral">
                                            템플릿
                                        </StatusChip>
                                    </div>
                                    <ul className={styles.classList}>
                                        {child.recurring.map((slot, index) => (
                                            <li
                                                key={`${slot.classId}-${slot.day}-${index}`}
                                            >
                                                <div>
                                                    <strong>
                                                        {
                                                            WEEK_DAY_LABELS[
                                                                slot.day
                                                            ]
                                                        }
                                                        {slot.start}~{slot.end}
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
                        </>
                    )}
                </>
            )}
        </section>
    );
}
