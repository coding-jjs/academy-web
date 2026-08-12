"use client";

import { useActionState, useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    ATTENDANCE_STATUS_OPTIONS,
    formatAttendanceCheckInTime,
} from "@/features/attendance/presentation";
import type { StaffAttendanceSession } from "@/features/attendance/staff-types";
import type { AttendanceStatus } from "@/features/attendance/types";
import {
    saveSessionAttendance,
    type SaveAttendanceState,
} from "@/features/attendance/staff-actions";
import styles from "../StaffAttendanceScreen.module.css";

const INITIAL_STATE: SaveAttendanceState = { status: "idle", message: "" };
type AttendanceDraft = Record<string, AttendanceStatus | "">;

export default function AttendanceSessionEditor({ sessions }: { sessions: StaffAttendanceSession[] }) {
    const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id ?? "");
    const activeSession =
        sessions.find((session) => session.id === activeSessionId) ??
        sessions[0]!;
    const [draft, setDraft] = useState<AttendanceDraft>(() => createAttendanceDraft(sessions[0]));
    const [state, formAction, isPending] = useActionState(saveSessionAttendance, INITIAL_STATE);
    const changedAttendance = useMemo(() => activeSession.students.filter((student) => draft[student.id] && draft[student.id] !== student.status).map((student) => ({ studentId: student.id, status: draft[student.id] })), [activeSession, draft]);
    const uncheckedCount = activeSession.students.filter((student) => !draft[student.id]).length;

    function selectSession(session: StaffAttendanceSession) {
        setActiveSessionId(session.id);
        setDraft(createAttendanceDraft(session));
    }

    function markAllPresent() {
        setDraft(Object.fromEntries(activeSession.students.map((student) => [student.id, "PRESENT"])) as AttendanceDraft);
    }

    return (
        <>
            <div className={styles.sessionSwitch}>{sessions.map((session) => <button key={session.id} type="button" className={session.id === activeSession.id ? styles.sessionActive : styles.sessionBtn} onClick={() => selectSession(session)}><strong>{session.className}</strong><span>{session.timeLabel}</span></button>)}</div>
            <article className={styles.panel}>
                <div className={styles.panelHead}>
                    <div><StatusChip tone="neutral">{activeSession.timeLabel}</StatusChip><h2>{activeSession.className}{activeSession.classroom ? ` · ${activeSession.classroom}` : ""}</h2><p>{activeSession.subject}{activeSession.teacherName ? ` · ${activeSession.teacherName}` : ""}{` · 미체크 ${uncheckedCount}명`}</p></div>
                    <div className={styles.actions}><button type="button" className={styles.secondaryBtn} onClick={markAllPresent} disabled={isPending}>전원 출석</button><form action={formAction}><input type="hidden" name="sessionId" value={activeSession.id} /><input type="hidden" name="payload" value={JSON.stringify(changedAttendance)} /><button type="submit" className={styles.primaryBtn} disabled={isPending || changedAttendance.length === 0}>{isPending ? "저장 중…" : changedAttendance.length === 0 ? "변경 없음" : `출석 저장 (${changedAttendance.length})`}</button></form></div>
                </div>
                {state.message && <p className={state.status === "success" ? styles.success : styles.error} role="alert">{state.message}</p>}
                {activeSession.students.length === 0 ? <p className={styles.muted}>이 반에 등록된 학생이 없습니다.</p> : <AttendanceStudentTable session={activeSession} draft={draft} isPending={isPending} onStatusChange={(studentId, status) => setDraft((current) => ({ ...current, [studentId]: status }))} />}
            </article>
        </>
    );
}

function AttendanceStudentTable({ session, draft, isPending, onStatusChange }: { session: StaffAttendanceSession; draft: AttendanceDraft; isPending: boolean; onStatusChange: (studentId: string, status: AttendanceStatus | "") => void }) {
    return (
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>학생</th><th>사유 결석</th><th>출결</th><th>등원 시각</th></tr></thead><tbody>{session.students.map((student) => <tr key={student.id}>
            <td><strong>{student.name}</strong><span>{student.grade ?? ""}{student.schoolName ? ` · ${student.schoolName}` : ""}</span></td>
            <td>{student.absenceRequest ? <div className={styles.absenceBox}><StatusChip tone="warning">사유 접수</StatusChip><small>{student.absenceRequest.reason}</small></div> : <span className={styles.muted}>없음</span>}</td>
            <td><select className={styles.select} value={draft[student.id] ?? ""} onChange={(event) => onStatusChange(student.id, event.target.value as AttendanceStatus | "")} disabled={isPending}><option value="">미체크</option>{ATTENDANCE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>
            <td>{formatCheckInTime(student.checkInAt)}</td>
        </tr>)}</tbody></table></div>
    );
}

function createAttendanceDraft(session: StaffAttendanceSession | undefined): AttendanceDraft {
    if (!session) return {};
    return Object.fromEntries(session.students.map((student) => [student.id, student.status ?? ""])) as AttendanceDraft;
}

function formatCheckInTime(isoDate: string | null) {
    return formatAttendanceCheckInTime(isoDate) ?? "—";
}
