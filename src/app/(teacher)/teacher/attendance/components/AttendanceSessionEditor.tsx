"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학생별 출석 상태 편집기 (클라이언트).
 *
 * `useActionState(saveSessionAttendance)`로 변경된 행만 JSON payload로 낸다.
 * 출석 행을 미리 만들지 않고 서버가 upsert한다.
 *
 * props: sessions — 오늘 담당 회차. 탭으로 활성 세션을 고른다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 결석 신청을 승인/거절하지 않는다. 사유는 참고 표시만.
 * - 과거 날짜 세션을 열지 않는다. page가 오늘 KST만 조회한다.
 */

import { useActionState, useMemo, useState } from "react"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    ATTENDANCE_STATUS_OPTIONS, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    formatAttendanceCheckInTime, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/attendance/presentation"; // 교사 Screen. StaffDashboard는 교사 전용.
import type { StaffAttendanceSession } from "@/features/attendance/staff-types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import type { AttendanceStatus } from "@/features/attendance/types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    saveSessionAttendance, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    type SaveAttendanceState, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/attendance/staff-actions"; // 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffAttendanceScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const INITIAL_STATE: SaveAttendanceState = { status: "idle", message: "" }; // saveSessionAttendance 초기값. 학부모 결석 신청 승인이 아니다.
type AttendanceDraft = Record<string, AttendanceStatus | "">; // 교사 Screen. StaffDashboard는 교사 전용.

/** 세션 전환·전원 출석·변경분 저장 폼을 그린다. */
export default function AttendanceSessionEditor({ sessions }: { sessions: StaffAttendanceSession[] }) { // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id ?? ""); // 오늘 담당 회차. 과거 날짜를 열지 않는다.
    const activeSession = // page가 오늘 KST만 조회. 직원 출석 URL은 없다.
        sessions.find((session) => session.id === activeSessionId) ?? // 교사 Screen. StaffDashboard는 교사 전용.
        sessions[0]!; // 교사 Screen. StaffDashboard는 교사 전용.
    const [draft, setDraft] = useState<AttendanceDraft>(() => createAttendanceDraft(sessions[0])); // 기존 출석 복사. 빈 행을 미리 만들지 않는다.
    const [state, formAction, isPending] = useActionState(saveSessionAttendance, INITIAL_STATE); // 변경 JSON만 upsert. 결석 신청을 승인하지 않는다.
    const changedAttendance = useMemo(() => activeSession.students.filter((student) => draft[student.id] && draft[student.id] !== student.status).map((student) => ({ studentId: student.id, status: draft[student.id] })), [activeSession, draft]); // 서버 status와 다른 행만 payload. 미체크·동일 상태는 upsert하지 않는다.
    const uncheckedCount = activeSession.students.filter((student) => !draft[student.id]).length; // 미체크 수. 학부모 결석 신청과 별개.

    function selectSession(session: StaffAttendanceSession) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        setActiveSessionId(session.id); // 오늘 회차 탭. 과거 세션을 열지 않는다.
        setDraft(createAttendanceDraft(session)); // 해당 세션 초안만. 출석 행을 미리 만들지 않는다.
    } // 블록 끝.

    function markAllPresent() { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
        setDraft(Object.fromEntries(activeSession.students.map((student) => [student.id, "PRESENT"])) as AttendanceDraft); // 전원 출석 초안. 저장은 form submit.
    } // 블록 끝.

    return ( // 오늘 회차 출석. 결석 신청을 승인하지 않는다.
        <>{/* 요소. 교사 Screen. StaffDashboard는 교사 전용. */}
            <div className={styles.sessionSwitch}>{sessions.map((session) => <button key={session.id} type="button" className={session.id === activeSession.id ? styles.sessionActive : styles.sessionBtn} onClick={() => selectSession(session)}><strong>{session.className}</strong><span>{session.timeLabel}</span></button>)}</div>{/* 오늘 회차만. 학부모 결석 신청은 승인하지 않고 사유만 보여 준다. */}
            <article className={styles.panel}>{/* 오늘 회차 출석. 결석 신청을 승인하지 않는다. */}
                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                    <div><StatusChip tone="neutral">{activeSession.timeLabel}</StatusChip><h2>{activeSession.className}{activeSession.classroom ? ` · ${activeSession.classroom}` : ""}</h2><p>{activeSession.subject}{activeSession.teacherName ? ` · ${activeSession.teacherName}` : ""}{` · 미체크 ${uncheckedCount}명`}</p></div>{/* 레이아웃 상자. */}
                    <div className={styles.actions}><button type="button" className={styles.secondaryBtn} onClick={markAllPresent} disabled={isPending}>전원 출석</button><form action={formAction}><input type="hidden" name="sessionId" value={activeSession.id} /><input type="hidden" name="payload" value={JSON.stringify(changedAttendance)} /><button type="submit" className={styles.primaryBtn} disabled={isPending || changedAttendance.length === 0}>{isPending ? "저장 중…" : changedAttendance.length === 0 ? "변경 없음" : `출석 저장 (${changedAttendance.length})`}</button></form></div>{/* 변경 JSON만. 결석 신청을 AttendanceRecord로 승격하지 않는다. */}
                </div>{/* div 닫기. */}
                {state.message && <p className={state.status === "success" ? styles.success : styles.error} role="alert">{state.message}</p>}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                {activeSession.students.length === 0 ? <p className={styles.muted}>이 반에 등록된 학생이 없습니다.</p> : <AttendanceStudentTable session={activeSession} draft={draft} isPending={isPending} onStatusChange={(studentId, status) => setDraft((current) => ({ ...current, [studentId]: status }))} />}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
            </article>{/* article 닫기. */}
        </> // 구문 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 학생 행 테이블. select 값이 draft와 서버 status가 다를 때만 저장 대상. */
function AttendanceStudentTable({ session, draft, isPending, onStatusChange }: { session: StaffAttendanceSession; draft: AttendanceDraft; isPending: boolean; onStatusChange: (studentId: string, status: AttendanceStatus | "") => void }) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // 오늘 회차 출석. 결석 신청을 승인하지 않는다.
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>학생</th><th>사유 결석</th><th>출결</th><th>등원 시각</th></tr></thead><tbody>{session.students.map((student) => <tr key={student.id}>{/* 레이아웃 상자. */}
            <td><strong>{student.name}</strong><span>{student.grade ?? ""}{student.schoolName ? ` · ${student.schoolName}` : ""}</span></td>{/* 칸. */}
            <td>{student.absenceRequest ? <div className={styles.absenceBox}><StatusChip tone="warning">사유 접수</StatusChip><small>{student.absenceRequest.reason}</small></div> : <span className={styles.muted}>없음</span>}</td>{/* 칸. */}
            <td><select className={styles.select} value={draft[student.id] ?? ""} onChange={(event) => onStatusChange(student.id, event.target.value as AttendanceStatus | "")} disabled={isPending}><option value="">미체크</option>{ATTENDANCE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>{/* 칸. */}
            <td>{formatCheckInTime(student.checkInAt)}</td>{/* 칸. */}
        </tr>)}</tbody></table></div> // tr 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 세션의 현재 출석 상태를 초안 맵으로 복사한다. */
function createAttendanceDraft(session: StaffAttendanceSession | undefined): AttendanceDraft { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    if (!session) return {}; // 기존 출석 상태를 복사. 없으면 빈 맵 — 빈 출석 행을 미리 만들지 않는다.
    return Object.fromEntries(session.students.map((student) => [student.id, student.status ?? ""])) as AttendanceDraft; // 반환. 교사 Screen. StaffDashboard는 교사 전용.
} // 블록 끝.

/** 등원 시각 표시. 없으면 대시. */
function formatCheckInTime(isoDate: string | null) { // 로컬 헬퍼. 교사 Screen. StaffDashboard는 교사 전용.
    return formatAttendanceCheckInTime(isoDate) ?? "—"; // 반환. 교사 Screen. StaffDashboard는 교사 전용.
} // 블록 끝.
