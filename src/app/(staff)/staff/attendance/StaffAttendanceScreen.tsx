"use client";

import {
    useActionState,
    useMemo,
    useState,
} from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    saveSessionAttendance,
    type SaveAttendanceState,
} from "./actions";
import styles from "./StaffAttendanceScreen.module.css";

export type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "ABSENT"
    | "EXCUSED"
    | "EARLY_LEAVE";

export type StaffAttendanceStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: AttendanceStatus | null;
    checkInAt: string | null;
    checkOutAt: string | null;
    note: string | null;
    absenceRequest: {
        reason: string;
    } | null;
};

export type StaffAttendanceSession = {
    id: string;
    classId: string;
    className: string;
    subject: string;
    teacherName: string | null;
    classroom: string | null;
    startsAt: string;
    endsAt: string;
    timeLabel: string;
    students: StaffAttendanceStudent[];
};

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
    { value: "PRESENT", label: "출석" },
    { value: "LATE", label: "지각" },
    { value: "ABSENT", label: "결석" },
    { value: "EXCUSED", label: "공결" },
    { value: "EARLY_LEAVE", label: "조퇴" },
];

const initialState: SaveAttendanceState = {
    status: "idle",
    message: "",
};

function formatCheckIn(iso: string | null) {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(iso));
}

function attendanceDraft(session: StaffAttendanceSession | undefined) {
    if (!session) return {};
    return Object.fromEntries(
        session.students.map((student) => [student.id, student.status ?? ""]),
    ) as Record<string, AttendanceStatus | "">;
}

export default function StaffAttendanceScreen({
    sessions,
    role,
}: {
    sessions: StaffAttendanceSession[];
    role: "TEACHER" | "STAFF";
}) {
    const [activeSessionId, setActiveSessionId] = useState(
        sessions[0]?.id ?? "",
    );
    const active =
        sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null;

    const [draft, setDraft] = useState<Record<string, AttendanceStatus | "">>(
        () => attendanceDraft(sessions[0]),
    );
    const [state, formAction, pending] = useActionState(
        saveSessionAttendance,
        initialState,
    );

    function selectSession(session: StaffAttendanceSession) {
        setActiveSessionId(session.id);
        setDraft(attendanceDraft(session));
    }

    const uncheckedCount = useMemo(() => {
        if (!active) return 0;
        return active.students.filter((s) => !draft[s.id]).length;
    }, [active, draft]);

    function markAllPresent() {
        if (!active) return;
        const next: Record<string, AttendanceStatus | ""> = {};
        for (const student of active.students) {
            next[student.id] = "PRESENT";
        }
        setDraft(next);
    }

    const payload = useMemo(() => {
        if (!active) return "[]";
        return JSON.stringify(
            active.students
                .filter((s) => draft[s.id])
                .map((s) => ({
                    studentId: s.id,
                    status: draft[s.id],
                })),
        );
    }, [active, draft]);

    const busy = pending;

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>ATTENDANCE</span>
                    <h1>출석 체크</h1>
                    <p>등원, 지각, 결석과 하원 상태를 기록합니다.</p>
                </div>
                <StatusChip>
                    {role === "TEACHER" ? "담당 반" : "전체 수업"}
                </StatusChip>
            </header>

            {sessions.length === 0 ? (
                <div className={styles.empty}>
                    <h2>오늘 수업이 없습니다</h2>
                    <p>
                        {role === "TEACHER"
                            ? "담당 반의 오늘 세션이 없으면 여기에 표시되지 않습니다."
                            : "오늘 예정된 수업 세션이 없습니다."}
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.sessionSwitch}>
                        {sessions.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={
                                    item.id === active?.id
                                        ? styles.sessionActive
                                        : styles.sessionBtn
                                }
                                onClick={() => selectSession(item)}
                            >
                                <strong>{item.className}</strong>
                                <span>{item.timeLabel}</span>
                            </button>
                        ))}
                    </div>

                    {active && (
                        <article className={styles.panel}>
                            <div className={styles.panelHead}>
                                <div>
                                    <StatusChip tone="neutral">
                                        {active.timeLabel}
                                    </StatusChip>
                                    <h2>
                                        {active.className}
                                        {active.classroom
                                            ? ` · ${active.classroom}`
                                            : ""}
                                    </h2>
                                    <p>
                                        {active.subject}
                                        {active.teacherName
                                            ? ` · ${active.teacherName}`
                                            : ""}
                                        {` · 미체크 ${uncheckedCount}명`}
                                    </p>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.secondaryBtn}
                                        onClick={markAllPresent}
                                        disabled={busy}
                                    >
                                        전원 출석
                                    </button>
                                    <form action={formAction}>
                                        <input
                                            type="hidden"
                                            name="sessionId"
                                            value={active.id}
                                        />
                                        <input
                                            type="hidden"
                                            name="payload"
                                            value={payload}
                                        />
                                        <button
                                            type="submit"
                                            className={styles.primaryBtn}
                                            disabled={busy}
                                        >
                                            {pending
                                                ? "저장 중…"
                                                : "출석 저장"}
                                        </button>
                                    </form>
                                </div>
                            </div>

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

                            {active.students.length === 0 ? (
                                <p className={styles.muted}>
                                    이 반에 등록된 학생이 없습니다.
                                </p>
                            ) : (
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>학생</th>
                                                <th>사유 결석</th>
                                                <th>출결</th>
                                                <th>등원 시각</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {active.students.map((student) => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <strong>
                                                            {student.name}
                                                        </strong>
                                                        <span>
                                                            {student.grade ??
                                                                ""}
                                                            {student.schoolName
                                                                ? ` · ${student.schoolName}`
                                                                : ""}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {student.absenceRequest ? (
                                                            <div
                                                                className={
                                                                    styles.absenceBox
                                                                }
                                                            >
                                                                <StatusChip tone="warning">
                                                                    사유 접수
                                                                </StatusChip>
                                                                <small>
                                                                    {
                                                                        student
                                                                            .absenceRequest
                                                                            .reason
                                                                    }
                                                                </small>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    styles.muted
                                                                }
                                                            >
                                                                없음
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={
                                                                styles.select
                                                            }
                                                            value={
                                                                draft[
                                                                    student.id
                                                                ] ?? ""
                                                            }
                                                            onChange={(e) =>
                                                                setDraft(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [student.id]:
                                                                            e
                                                                                .target
                                                                                .value as
                                                                                | AttendanceStatus
                                                                                | "",
                                                                    }),
                                                                )
                                                            }
                                                            disabled={busy}
                                                        >
                                                            <option value="">
                                                                미체크
                                                            </option>
                                                            {STATUS_OPTIONS.map(
                                                                (opt) => (
                                                                    <option
                                                                        key={
                                                                            opt.value
                                                                        }
                                                                        value={
                                                                            opt.value
                                                                        }
                                                                    >
                                                                        {
                                                                            opt.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        {formatCheckIn(
                                                            student.checkInAt,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </article>
                    )}
                </>
            )}
        </section>
    );
}
