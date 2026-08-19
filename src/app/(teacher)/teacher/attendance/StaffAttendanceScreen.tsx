/**
 * 오늘 출석 세션 목록 UI (서버 컴포넌트).
 *
 * props: sessions — staff-data 오늘 회차, role — 빈 화면 문구.
 * `role STAFF`를 받을 수 있지만 직원 URL에 출석 page가 없어 현재는 교사만 쓴다.
 *
 * 세션이 있으면 `AttendanceSessionEditor`(클라이언트)가 `saveSessionAttendance`를 제출한다.
 * 이 파일은 저장하지 않는다.
 */

import type { StaffAttendanceSession } from "@/features/attendance/staff-types"; // features 데이터/액션. 교사 출석. 직원 URL 없음.
import AttendanceSessionEditor from "./components/AttendanceSessionEditor"; // 같은 라우트 모듈. 교사 출석. 직원 URL 없음.
import styles from "./StaffAttendanceScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 오늘 세션이 없으면 안내, 있으면 편집기를 연다. */
export default function StaffAttendanceScreen({ sessions, role }: { sessions: StaffAttendanceSession[]; role: "TEACHER" | "STAFF" }) { // 이 파일의 화면. 교사 출석. 직원 URL 없음.
    return ( // JSX 반환. 교사 출석. 직원 URL 없음.
        <section className={styles.page}>{/* 오늘 출석. 직원 URL에는 이 page가 없다. */}
            <header className={styles.heading}><div><span>ATTENDANCE</span><h1>출석 체크</h1><p>등원, 지각, 결석과 하원 상태를 기록합니다.</p></div></header>{/* 제목 영역. */}
            {sessions.length === 0 ? ( // 오늘 세션 없음. STAFF 문구는 있어도 교사 라우트만 연결.
                <div className={styles.empty}><h2>오늘 수업이 없습니다</h2><p>{role === "TEACHER" ? "담당 반의 오늘 세션이 없으면 여기에 표시되지 않습니다." : "오늘 예정된 수업 세션이 없습니다."}</p></div> // 레이아웃 상자.
            ) : ( // AttendanceSessionEditor → saveSessionAttendance. 이 Screen은 저장하지 않는다.
                <AttendanceSessionEditor sessions={sessions} /> // AttendanceSessionEditor. 교사 출석. 직원 URL 없음.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
