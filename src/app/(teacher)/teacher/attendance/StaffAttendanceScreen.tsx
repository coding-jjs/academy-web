import type { StaffAttendanceSession } from "@/features/attendance/staff-types";
import AttendanceSessionEditor from "./components/AttendanceSessionEditor";
import styles from "./StaffAttendanceScreen.module.css";

export default function StaffAttendanceScreen({ sessions, role }: { sessions: StaffAttendanceSession[]; role: "TEACHER" | "STAFF" }) {
    return (
        <section className={styles.page}>
            <header className={styles.heading}><div><span>ATTENDANCE</span><h1>출석 체크</h1><p>등원, 지각, 결석과 하원 상태를 기록합니다.</p></div></header>
            {sessions.length === 0 ? <div className={styles.empty}><h2>오늘 수업이 없습니다</h2><p>{role === "TEACHER" ? "담당 반의 오늘 세션이 없으면 여기에 표시되지 않습니다." : "오늘 예정된 수업 세션이 없습니다."}</p></div> : <AttendanceSessionEditor sessions={sessions} />}
        </section>
    );
}
