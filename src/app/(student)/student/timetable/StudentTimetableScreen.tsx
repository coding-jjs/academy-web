"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 본인 주간 시간표 그리드 (클라이언트).
 *
 * props: weekDays, data — timetable data. 세션별 출석 상태까지 표시한다.
 * 학생은 일정을 고치지 못한다. 미연결이면 빈 안내만.
 */

import { useMemo } from "react"; // 의존성. 학생 Screen. 본인 Student.userId만.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { // 의존성. 학생 Screen. 본인 Student.userId만.
    ATTENDANCE_STATUS_METADATA, // 구문. 학생 Screen. 본인 Student.userId만.
    formatAttendanceCheckInTime, // 구문. 학생 Screen. 본인 Student.userId만.
} from "@/features/attendance/presentation"; // 학생 Screen. 본인 Student.userId만.
import { WEEK_DAY_LABELS } from "@/features/timetable/presentation"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import type { // 타입만. 런타임 로직이 아니다.
    StudentTimetableData, // 구문. 학생 Screen. 본인 Student.userId만.
    WeekDay, // 구문. 학생 Screen. 본인 Student.userId만.
    WeekDayKey, // 구문. 학생 Screen. 본인 Student.userId만.
} from "@/features/timetable/types"; // 학생 Screen. 본인 Student.userId만.
import styles from "./StudentTimetableScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 오늘/요일별 세션을 읽기 전용으로 그린다. */
export default function StudentTimetableScreen({ // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    weekDays, // 구문. 학생 Screen. 본인 Student.userId만.
    data, // 구문. 학생 Screen. 본인 Student.userId만.
}: { // 구문. 학생 Screen. 본인 Student.userId만.
    weekDays: WeekDay[]; // weekDays 필드.
    data: StudentTimetableData; // data 필드.
}) { // 구문. 학생 Screen. 본인 Student.userId만.
    const byDay = useMemo(() => { // 요일별 세션. 일정은 고치지 않는다.
        const map = Object.fromEntries( // 구문. 학생 Screen. 본인 Student.userId만.
            weekDays.map((d) => [d.key, [] as typeof data.sessions]), // 구문. 학생 Screen. 본인 Student.userId만.
        ) as Record<WeekDayKey, typeof data.sessions>; // 학생 Screen. 본인 Student.userId만.

        for (const session of data.sessions) { // ClassSession을 요일 칸에. schedule Json은 거의 비어 그리드 본체가 아니다.
            map[session.dayKey]?.push(session); // 학생 Screen. 본인 Student.userId만.
        } // 블록 끝.
        return map; // 반환. 학생 Screen. 본인 Student.userId만.
    }, [data, weekDays]); // 학생 Screen. 본인 Student.userId만.

    const todaySessions = data.sessions.filter((s) => s.isToday); // 학생 Screen. 본인 Student.userId만.

    if (!data.linked) { // 원장이 학생 계정을 연결하기 전. 점수를 추측하지 않는다.
        return ( // 본인 시간표. 출석 저장이 아니다.
            <section className={styles.page}>{/* 본인 시간표. 출석 저장이 아니다. */}
                <header className={styles.heading}>{/* Student.userId 없음. 타인 반을 보여 주지 않는다. */}
                    <div>{/* 레이아웃 상자. */}
                        <span>TIMETABLE</span>{/* 인라인 표시. */}
                        <h1>시간표</h1>{/* 제목. */}
                        <p>이번 주 수업 시간과 강의실을 확인합니다.</p>{/* 문장. */}
                    </div>{/* div 닫기. */}
                </header>{/* header 닫기. */}
                <div className={styles.empty}>{/* 레이아웃 상자. */}
                    <h2>연결된 학생 정보가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 학생 계정 연결 후 시간표를 볼 수 있습니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </section> // section 닫기.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    return ( // 본인 시간표. 출석 저장이 아니다.
        <section className={styles.page}>{/* 본인 시간표. 출석 저장이 아니다. */}
            <header className={styles.heading}>{/* 읽기 전용. 출석 상태는 회차 take:1. */}
                <div>{/* 레이아웃 상자. */}
                    <span>TIMETABLE</span>{/* 인라인 표시. */}
                    <h1>시간표</h1>{/* 제목. */}
                    <p>이번 주 수업 시간과 강의실을 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.hero}>{/* 오늘 수업·출석 상태. 출석 행을 쓰지 않는다. */}
                <StatusChip tone="neutral">이번 주</StatusChip>{/* StatusChip. 학생 Screen. 본인 Student.userId만. */}
                <h2>{/* 소제목. */}
                    {data.studentName}{/* 학생 Screen. 본인 Student.userId만. */}
                    {data.classes[0] ? ` · ${data.classes[0].name}` : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                </h2>{/* h2 닫기. */}
                <p>{/* 문장. */}
                    수강 반 {data.classes.length}개 · 이번 주 수업{" "}{/* 학생 Screen. 본인 Student.userId만. */}
                    {data.sessions.length}건{/* 학생 Screen. 본인 Student.userId만. */}
                </p>{/* p 닫기. */}

                {todaySessions.length > 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <ul className={styles.todayList}>{/* 목록. */}
                        {todaySessions.map((s) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                            <li key={s.id}>{/* 항목. */}
                                <div>{/* 레이아웃 상자. */}
                                    <strong>{s.className}</strong>{/* 강조. */}
                                    <span>{/* 인라인 표시. */}
                                        {s.timeLabel}{/* 학생 Screen. 본인 Student.userId만. */}
                                        {s.classroom // 학생 Screen. 본인 Student.userId만.
                                            ? ` · ${s.classroom}` // 학생 Screen. 본인 Student.userId만.
                                            : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                                    </span>{/* span 닫기. */}
                                </div>{/* div 닫기. */}
                                {s.attendanceStatus ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                                    <StatusChip // StatusChip. 학생 Screen. 본인 Student.userId만.
                                        tone={ // 객체/블록 시작.
                                            ATTENDANCE_STATUS_METADATA[ // 학생 Screen. 본인 Student.userId만.
                                                s.attendanceStatus // 학생 Screen. 본인 Student.userId만.
                                            ].tone // 학생 Screen. 본인 Student.userId만.
                                        } // 블록 끝.
                                    >{/* 학생 Screen. 본인 Student.userId만. */}
                                        { // 객체/블록 시작.
                                            ATTENDANCE_STATUS_METADATA[ // 학생 Screen. 본인 Student.userId만.
                                                s.attendanceStatus // 학생 Screen. 본인 Student.userId만.
                                            ].label // 학생 Screen. 본인 Student.userId만.
                                        }{/* 블록 끝. */}
                                        {formatAttendanceCheckInTime(s.checkInAt) // 학생 Screen. 본인 Student.userId만.
                                            ? ` ${formatAttendanceCheckInTime(s.checkInAt)}` // 학생 Screen. 본인 Student.userId만.
                                            : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                                    </StatusChip> // StatusChip 닫기.
                                ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                                    <StatusChip>예정</StatusChip> // StatusChip. 학생 Screen. 본인 Student.userId만.
                                )}{/* 구문 끝. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <p className={styles.muted}>오늘 예정된 수업이 없습니다.</p> // 문장.
                )}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            <div className={styles.weekGrid}>{/* 요일별 세션 */}
                {weekDays.map((day) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <article // 본인 시간표. 출석 저장이 아니다.
                        key={day.key} // key 필드.
                        className={ // 객체/블록 시작.
                            day.isToday ? styles.dayToday : styles.dayCard // 학생 Screen. 본인 Student.userId만.
                        } // 블록 끝.
                    >{/* 학생 Screen. 본인 Student.userId만. */}
                        <div className={styles.dayHead}>{/* 레이아웃 상자. */}
                            <strong>{WEEK_DAY_LABELS[day.key]}</strong>{/* 강조. */}
                            <span>{day.label}</span>{/* 인라인 표시. */}
                            {day.isToday && ( // 구문. 학생 Screen. 본인 Student.userId만.
                                <StatusChip tone="success">오늘</StatusChip> // StatusChip. 학생 Screen. 본인 Student.userId만.
                            )}{/* 구문 끝. */}
                        </div>{/* div 닫기. */}
                        {byDay[day.key].length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                            <p className={styles.muted}>없음</p> // 문장.
                        ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                            <ul className={styles.slotList}>{/* 목록. */}
                                {byDay[day.key].map((s) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                                    <li key={s.id}>{/* 항목. */}
                                        <strong>{s.timeLabel}</strong>{/* 강조. */}
                                        <span>{s.className}</span>{/* 인라인 표시. */}
                                        <small>{/* 보조 문장. */}
                                            {s.subject}{/* 학생 Screen. 본인 Student.userId만. */}
                                            {s.classroom // 학생 Screen. 본인 Student.userId만.
                                                ? ` · ${s.classroom}` // 학생 Screen. 본인 Student.userId만.
                                                : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                                            {s.teacherName // 학생 Screen. 본인 Student.userId만.
                                                ? ` · ${s.teacherName}` // 학생 Screen. 본인 Student.userId만.
                                                : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                                        </small>{/* small 닫기. */}
                                        {s.attendanceStatus && ( // 구문. 학생 Screen. 본인 Student.userId만.
                                            <StatusChip // StatusChip. 학생 Screen. 본인 Student.userId만.
                                                tone={ // 객체/블록 시작.
                                                    ATTENDANCE_STATUS_METADATA[ // 학생 Screen. 본인 Student.userId만.
                                                        s.attendanceStatus // 학생 Screen. 본인 Student.userId만.
                                                    ].tone // 학생 Screen. 본인 Student.userId만.
                                                } // 블록 끝.
                                            >{/* 학생 Screen. 본인 Student.userId만. */}
                                                { // 객체/블록 시작.
                                                    ATTENDANCE_STATUS_METADATA[ // 학생 Screen. 본인 Student.userId만.
                                                        s.attendanceStatus // 학생 Screen. 본인 Student.userId만.
                                                    ].label // 학생 Screen. 본인 Student.userId만.
                                                }{/* 블록 끝. */}
                                            </StatusChip> // StatusChip 닫기.
                                        )}{/* 구문 끝. */}
                                    </li> // li 닫기.
                                ))}{/* 구문 끝. */}
                            </ul> // ul 닫기.
                        )}{/* 구문 끝. */}
                    </article> // article 닫기.
                ))}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            <article className={styles.panel}>{/* 수강 반 */}
                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                    <h2>수강 반</h2>{/* 소제목. */}
                    <StatusChip>{data.classes.length}개</StatusChip>{/* StatusChip. 학생 Screen. 본인 Student.userId만. */}
                </div>{/* div 닫기. */}
                {data.classes.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <p className={styles.muted}>등록된 반이 없습니다.</p> // 문장.
                ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <ul className={styles.classList}>{/* 목록. */}
                        {data.classes.map((item) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                            <li key={item.id}>{/* 항목. */}
                                <div>{/* 레이아웃 상자. */}
                                    <strong>{item.name}</strong>{/* 강조. */}
                                    <span>{/* 인라인 표시. */}
                                        {item.subject}{/* 학생 Screen. 본인 Student.userId만. */}
                                        {item.teacherName // 학생 Screen. 본인 Student.userId만.
                                            ? ` · ${item.teacherName}` // 학생 Screen. 본인 Student.userId만.
                                            : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                                    </span>{/* span 닫기. */}
                                </div>{/* div 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </article>{/* article 닫기. */}

            {data.recurring.length > 0 && ( // 구문. 학생 Screen. 본인 Student.userId만.
                <article className={styles.panel}>{/* 본인 시간표. 출석 저장이 아니다. */}
                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                        <h2>반복 시간표</h2>{/* 소제목. */}
                        <StatusChip tone="neutral">템플릿</StatusChip>{/* StatusChip. 학생 Screen. 본인 Student.userId만. */}
                    </div>{/* div 닫기. */}
                    <ul className={styles.classList}>{/* 목록. */}
                        {data.recurring.map((slot, index) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                            <li // 항목.
                                key={`${slot.classId}-${slot.day}-${index}`} // key 필드.
                            >{/* 학생 Screen. 본인 Student.userId만. */}
                                <div>{/* 레이아웃 상자. */}
                                    <strong>{/* 강조. */}
                                        {WEEK_DAY_LABELS[slot.day]} {slot.start}~{/* 학생 Screen. 본인 Student.userId만. */}
                                        {slot.end}{/* 학생 Screen. 본인 Student.userId만. */}
                                    </strong>{/* strong 닫기. */}
                                    <span>{/* 인라인 표시. */}
                                        {slot.className}{/* 학생 Screen. 본인 Student.userId만. */}
                                        {slot.classroom // 학생 Screen. 본인 Student.userId만.
                                            ? ` · ${slot.classroom}` // 학생 Screen. 본인 Student.userId만.
                                            : ""}{/* 학생 Screen. 본인 Student.userId만. */}
                                    </span>{/* span 닫기. */}
                                </div>{/* div 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul>{/* ul 닫기. */}
                </article> // article 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
