"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 자녀 주간 시간표 그리드 (클라이언트).
 *
 * props: childList, weekDays, activeChildId — timetable data.
 * Session 행이 진실이고 class.schedule JSON은 거의 비어 있다.
 * 일정을 고치지 않는다. 자녀 전환은 child 쿠키.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import { useMemo, useState } from "react"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import type { // 타입만. 런타임 로직이 아니다.
    ParentTimetableChild, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    WeekDay, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    WeekDayKey, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} from "@/features/timetable/types"; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { WEEK_DAY_LABELS } from "@/features/timetable/presentation"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import styles from "./ParentTimetableScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.
import { writeParentChildCookie } from "@/features/families/parent-child-cooke"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

/** 요일별 세션과 오늘 하이라이트를 그린다. */
export default function ParentTimetableScreen({ // 이 파일의 화면. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    weekDays, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    activeChildId, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
}: { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList: ParentTimetableChild[]; // childList 필드.
    weekDays: WeekDay[]; // weekDays 필드.
    activeChildId: string; // activeChildId 필드.
}) { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const child = // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList.find((item) => item.id === activeChildId) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        null; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const classNameLabel = // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        child && child.classes.length > 0 // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            ? ` · ${child.classes.map((c) => c.name).join(", ")}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            : ""; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const [weekExpanded, setWeekExpanded] = useState(false); // 자녀 주간 시간표. 일정은 고치지 않는다.

    const byDay = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        const map = Object.fromEntries( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            weekDays.map((d) => [ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                d.key, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                [] as NonNullable<typeof child>["sessions"], // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            ]), // 구문 끝.
        ) as Record<WeekDayKey, NonNullable<typeof child>["sessions"]>; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

        if (!child) return map; // 분기. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        for (const session of child.sessions) { // ClassSession을 요일 칸에 넣는다. schedule Json 반복 슬롯은 거의 비어 보조.
            map[session.dayKey]?.push(session); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        } // 블록 끝.
        return map; // 반환. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    }, [child, weekDays]); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const hasDenseDays = useMemo( // 자녀 주간 시간표. 일정은 고치지 않는다.
        () => weekDays.some((day) => byDay[day.key].length >= 2), // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        [byDay, weekDays], // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    ); // 호출/그룹 끝.

    const todaySessions = child?.sessions.filter((s) => s.isToday) ?? []; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.

    function selectChild(childId: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        writeParentChildCookie(childId); // 쿠키 + URL. 그리드는 ClassSession. 일정은 고치지 않는다.
        router.replace(`/parent/timetable?childId=${childId}`); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    } // 블록 끝.

    return ( // 자녀 주간 시간표. 일정은 고치지 않는다.
        <section className={styles.page}>{/* 자녀 주간 시간표. 일정은 고치지 않는다. */}
            <header className={styles.heading}>{/* 읽기 전용. 일정 변경은 원장 반 관리. */}
                <div>{/* 레이아웃 상자. */}
                    <span>CHILD TIMETABLE</span>{/* 인라인 표시. */}
                    <h1>자녀 시간표</h1>{/* 제목. */}
                    <p>선택한 자녀의 수업 시간과 강의실을 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <Link // 이동. layout 가드를 대신하지 않는다.
                    href={`/parent/attendance?childId=${child.id}`} // href 필드.
                    className={styles.secondaryBtn} // className 필드.
                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    출결·결석 신청{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                </Link>{/* Link 닫기. */}
            </header>{/* header 닫기. */}

            {childList.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.empty}>{/* 활성 링크 없음 */}
                    <h2>연결된 자녀가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 연결을 완료하면 시간표가 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    {childList.length > 1 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.childSwitch}>{/* 쿠키 전환. 그리드는 ClassSession. */}
                            {childList.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                    key={item.id} // key 필드.
                                    type="button" // type 필드.
                                    className={ // 객체/블록 시작.
                                        item.id === child?.id // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ? styles.childActive // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            : styles.childBtn // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    } // 블록 끝.
                                    onClick={() => selectChild(item.id)} // onClick 필드.
                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {item.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </button> // button 닫기.
                            ))}{/* 구문 끝. */}
                        </div> // div 닫기.
                    )}{/* 구문 끝. */}

                    {child && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                            <div className={styles.hero}>{/* 레이아웃 상자. */}
                                <StatusChip tone="neutral">이번 주</StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                <h2>{/* 소제목. */}
                                    {child.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {classNameLabel}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </h2>{/* h2 닫기. */}
                                <p>{/* 문장. */}
                                    수강 반 {child.classes.length}개 · 이번 주{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    수업 {child.sessions.length}건{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </p>{/* p 닫기. */}
                                {todaySessions.length > 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <ul className={styles.todayList}>{/* 목록. */}
                                        {todaySessions.map((s) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <li key={s.id}>{/* 항목. */}
                                                <strong>{s.className}</strong>{/* 강조. */}
                                                <span>{/* 인라인 표시. */}
                                                    {s.timeLabel}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    {s.classroom // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        ? ` · ${s.classroom}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                </span>{/* span 닫기. */}
                                            </li> // li 닫기.
                                        ))}{/* 구문 끝. */}
                                    </ul> // ul 닫기.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <p className={styles.muted}>{/* 문장. */}
                                        오늘 예정된 수업이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </p> // p 닫기.
                                )}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.weekSection}>{/* 레이아웃 상자. */}
                                <div className={styles.weekScroll}>{/* 레이아웃 상자. */}
                                    <div className={styles.weekGrid}>{/* 레이아웃 상자. */}
                                        {weekDays.map((day) => { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            const daySessions = byDay[day.key]; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            const visibleSessions = weekExpanded // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? daySessions // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : daySessions.slice(0, 1); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            const hiddenCount = // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                daySessions.length - // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                visibleSessions.length; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            return ( // 자녀 주간 시간표. 일정은 고치지 않는다.
                                                <article // 자녀 주간 시간표. 일정은 고치지 않는다.
                                                    key={day.key} // key 필드.
                                                    className={ // 객체/블록 시작.
                                                        day.isToday // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ? styles.dayToday // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            : styles.dayCard // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    } // 블록 끝.
                                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    <div // 레이아웃 상자.
                                                        className={ // 객체/블록 시작.
                                                            styles.dayHead // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        } // 블록 끝.
                                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        <strong>{/* 강조. */}
                                                            { // 객체/블록 시작.
                                                                WEEK_DAY_LABELS[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    day.key // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ] // 구문 끝.
                                                            }{/* 블록 끝. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <span>{day.label}</span>{/* 인라인 표시. */}
                                                        {day.isToday && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            <StatusChip tone="success">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                오늘{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            </StatusChip> // StatusChip 닫기.
                                                        )}{/* 구문 끝. */}
                                                    </div>{/* div 닫기. */}
                                                    {daySessions.length === // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        <p // 문장.
                                                            className={ // 객체/블록 시작.
                                                                styles.muted // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            } // 블록 끝.
                                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            없음{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </p> // p 닫기.
                                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            <ul // 목록.
                                                                className={ // 객체/블록 시작.
                                                                    styles.slotList // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                } // 블록 끝.
                                                            >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                {visibleSessions.map( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    (s) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        <li // 항목.
                                                                            key={ // 객체/블록 시작.
                                                                                s.id // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                            } // 블록 끝.
                                                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                            <strong>{/* 강조. */}
                                                                                { // 객체/블록 시작.
                                                                                    s.timeLabel // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                                }{/* 블록 끝. */}
                                                                            </strong>{/* strong 닫기. */}
                                                                            <span>{/* 인라인 표시. */}
                                                                                { // 객체/블록 시작.
                                                                                    s.className // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                                }{/* 블록 끝. */}
                                                                            </span>{/* span 닫기. */}
                                                                            <small>{/* 보조 문장. */}
                                                                                { // 객체/블록 시작.
                                                                                    s.subject // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                                }{/* 블록 끝. */}
                                                                            </small>{/* small 닫기. */}
                                                                        </li> // li 닫기.
                                                                    ), // 구문 끝.
                                                                )}{/* 구문 끝. */}
                                                            </ul>{/* ul 닫기. */}
                                                            {!weekExpanded && // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                hiddenCount > // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    0 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    <p // 문장.
                                                                        className={ // 객체/블록 시작.
                                                                            styles.moreHint // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        } // 블록 끝.
                                                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                        +{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                        { // 객체/블록 시작.
                                                                            hiddenCount // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        }{/* 블록 끝. */}
                                                                        개 더{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                                    </p> // p 닫기.
                                                                )}{/* 구문 끝. */}
                                                        </> // 구문 끝.
                                                    )}{/* 구문 끝. */}
                                                </article> // article 닫기.
                                            ); // 호출/그룹 끝.
                                        })}{/* 구문 끝. */}
                                    </div>{/* div 닫기. */}
                                </div>{/* div 닫기. */}
                                {hasDenseDays && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                        type="button" // type 필드.
                                        className={styles.weekToggleBtn} // className 필드.
                                        onClick={() => // onClick 필드.
                                            setWeekExpanded(!weekExpanded) // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        } // 블록 끝.
                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {weekExpanded ? "접기" : `더보기`}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </button> // button 닫기.
                                )}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}
                            <article className={styles.panel}>{/* 자녀 주간 시간표. 일정은 고치지 않는다. */}
                                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                    <h2>수강 반</h2>{/* 소제목. */}
                                    <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {child.classes.length}개{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </div>{/* div 닫기. */}
                                {child.classes.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <p className={styles.muted}>{/* 문장. */}
                                        등록된 반이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </p> // p 닫기.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <ul className={styles.classList}>{/* 목록. */}
                                        {child.classes.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <li key={item.id}>{/* 항목. */}
                                                <div>{/* 레이아웃 상자. */}
                                                    <strong>{item.name}</strong>{/* 강조. */}
                                                    <span>{/* 인라인 표시. */}
                                                        {item.subject}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        {item.teacherName // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ? ` · ${item.teacherName}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    </span>{/* span 닫기. */}
                                                </div>{/* div 닫기. */}
                                            </li> // li 닫기.
                                        ))}{/* 구문 끝. */}
                                    </ul> // ul 닫기.
                                )}{/* 구문 끝. */}
                            </article>{/* article 닫기. */}

                            {child.recurring.length > 0 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <article className={styles.panel}>{/* 자녀 주간 시간표. 일정은 고치지 않는다. */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>반복 시간표</h2>{/* 소제목. */}
                                        <StatusChip tone="neutral">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            템플릿{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                    </div>{/* div 닫기. */}
                                    <ul className={styles.classList}>{/* 목록. */}
                                        {child.recurring.map((slot, index) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <li // 항목.
                                                key={`${slot.classId}-${slot.day}-${index}`} // key 필드.
                                            >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                <div>{/* 레이아웃 상자. */}
                                                    <strong>{/* 강조. */}
                                                        { // 객체/블록 시작.
                                                            WEEK_DAY_LABELS[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                slot.day // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ] // 구문 끝.
                                                        }{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        {slot.start}~{slot.end}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    </strong>{/* strong 닫기. */}
                                                    <span>{/* 인라인 표시. */}
                                                        {slot.className}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        {slot.classroom // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ? ` · ${slot.classroom}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    </span>{/* span 닫기. */}
                                                </div>{/* div 닫기. */}
                                            </li> // li 닫기.
                                        ))}{/* 구문 끝. */}
                                    </ul>{/* ul 닫기. */}
                                </article> // article 닫기.
                            )}{/* 구문 끝. */}
                        </> // 구문 끝.
                    )}{/* 구문 끝. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
