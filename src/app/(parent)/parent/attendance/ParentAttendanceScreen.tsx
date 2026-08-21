"use client";

/**
 * 자녀 출결 확인·결석 신청 UI (클라이언트).
 *
 * props: childList, activeChildId — parent-data.
 * 제출: `requestAbsence`. 출석 행을 만들지 않고 AbsenceRequest만 남긴다.
 * 교사가 출석 체크할 때 사유를 참고한다. 승인 워크플로는 없다.
 */

import { useActionState, useMemo } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation";
import type { ParentAttendanceChild } from "@/features/attendance/parent-types";
import {
    requestAbsence,
    type AbsenceState,
} from "@/features/attendance/parent-actions";
import { writeParentChildCookie } from "@/features/families/parent-child-cooke";
import styles from "./ParentAttendanceScreen.module.css";

const statusMeta = ATTENDANCE_STATUS_METADATA;

const initialAbsence: AbsenceState = { status: "idle", message: "" };

/** 예정 수업 목록과 미래 세션 결석 신청 폼을 그린다. */
export default function ParentAttendanceScreen({
    childList,
    activeChildId,
}: {
    childList: ParentAttendanceChild[];
    activeChildId: string;
}) {
    const [state, formAction, pending] = useActionState(
        requestAbsence,
        initialAbsence,
    );
    const router = useRouter();

    const child =
        childList.find((item) => item.id === activeChildId) ??
        childList[0] ??
        null;

    const requestableSessions = useMemo(() => {
        if (!child) return [];
        return child.sessions.filter(
            (s) => new Date(s.startsAt) > new Date() && !s.absenceRequest,
        );
    }, [child]);

    function selectChild(childId: string) {
        writeParentChildCookie(childId);
        router.replace(`/parent/attendance?childId=${childId}`);
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>ATTENDANCE</span>
                    <h1>출결·수업</h1>
                    <p>자녀의 등하원 상태와 수업 일정을 확인합니다.</p>
                </div>
            </header>
            {childList.length === 0 ? (
                <div className={styles.empty}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>학원에서 연결을 완료하면 출결·일정이 표시됩니다.</p>
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
                                <StatusChip tone="neutral">오늘</StatusChip>
                                {child.todayHighlight ? (
                                    <>
                                        <h2>
                                            {child.todayHighlight.className}
                                        </h2>
                                        <p>
                                            {child.todayHighlight.timeLabel}
                                            {child.todayHighlight.classroom
                                                ? ` · ${child.todayHighlight.classroom}`
                                                : ""}
                                        </p>
                                        {child.todayHighlight.status ? (
                                            <StatusChip
                                                tone={
                                                    statusMeta[
                                                        child.todayHighlight
                                                            .status
                                                    ].tone
                                                }
                                            >
                                                {
                                                    statusMeta[
                                                        child.todayHighlight
                                                            .status
                                                    ].label
                                                }
                                            </StatusChip>
                                        ) : (
                                            <StatusChip>미체크</StatusChip>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h2>오늘 수업 없음</h2>
                                        <p>
                                            {child.className
                                                ? `${child.className} · ${child.name}`
                                                : child.name}
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className={styles.metrics}>
                                <article>
                                    <span>출석</span>
                                    <strong>{child.monthCounts.present}</strong>
                                </article>
                                <article>
                                    <span>지각</span>
                                    <strong>{child.monthCounts.late}</strong>
                                </article>
                                <article>
                                    <span>결석</span>
                                    <strong>{child.monthCounts.absent}</strong>
                                </article>
                            </div>
                            <div className={styles.grid}>
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>이번 주 일정</h2>
                                        <StatusChip>
                                            {child.sessions.length}건
                                        </StatusChip>
                                    </div>
                                    {child.sessions.length === 0 ? (
                                        <p className={styles.muted}>
                                            예정된 수업이 없습니다.
                                        </p>
                                    ) : (
                                        <ul className={styles.sessionList}>
                                            {child.sessions.map((s) => (
                                                <li key={s.id}>
                                                    <div>
                                                        <strong>
                                                            {s.className}
                                                        </strong>
                                                        <span>
                                                            {s.timeLabel}
                                                            {s.isToday
                                                                ? " · 오늘"
                                                                : ""}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.badges
                                                        }
                                                    >
                                                        {s.attendanceStatus ? (
                                                            <StatusChip
                                                                tone={
                                                                    statusMeta[
                                                                        s
                                                                            .attendanceStatus
                                                                    ].tone
                                                                }
                                                            >
                                                                {
                                                                    statusMeta[
                                                                        s
                                                                            .attendanceStatus
                                                                    ].label
                                                                }
                                                            </StatusChip>
                                                        ) : (
                                                            <StatusChip>
                                                                예정
                                                            </StatusChip>
                                                        )}
                                                        {s.absenceRequest && (
                                                            <StatusChip tone="warning">
                                                                결석 신청
                                                            </StatusChip>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>사유 결석 신청</h2>
                                    </div>
                                    <p className={styles.muted}>
                                        신청은 알림 기록만 남기며, 출석 상태를
                                        자동으로 바꾸지 않습니다.
                                    </p>
                                    {state.message && (
                                        <p
                                            className={
                                                state.status === "success"
                                                    ? styles.success
                                                    : styles.error
                                            }
                                            role="alert"
                                        >
                                            {state.message}
                                        </p>
                                    )}

                                    <form
                                        action={formAction}
                                        className={styles.form}
                                    >
                                        <input
                                            type="hidden"
                                            name="studentId"
                                            value={child.id}
                                        />
                                        <label className={styles.field}>
                                            <span>수업</span>
                                            <select
                                                name="sessionId"
                                                required
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    선택
                                                </option>
                                                {requestableSessions.map(
                                                    (s) => (
                                                        <option
                                                            key={s.id}
                                                            value={s.id}
                                                        >
                                                            {s.className} ·
                                                            {s.timeLabel}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>
                                        <label className={styles.field}>
                                            <span>사유</span>
                                            <textarea
                                                name="reason"
                                                rows={4}
                                                required
                                                maxLength={300}
                                                placeholder="예: 병원 진료"
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            className={styles.primaryBtn}
                                            disabled={
                                                pending ||
                                                requestableSessions.length === 0
                                            }
                                        >
                                            {pending ? "신청 중…" : "결석 요청"}
                                        </button>
                                    </form>
                                </article>
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    );
}
