"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학부모 자녀 홈 카드 UI (클라이언트).
 *
 * `/parent/dashboard`가 넘긴 childList·news·unreadCount·activeChildId를 표시한다.
 * 자녀 전환은 `writeParentChildCookie` + `router.replace`. Server Action은 없다.
 *
 * 출결·리포트·결제 바로가기를 두지만 `/parent/payments`는 준비 중 카피다.
 * 연결된 자녀가 없으면 빈 안내만.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { formatKstMonthDay } from "@/lib/date-kst"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import type { // 타입만. 런타임 로직이 아니다.
    DashboardNewsItem, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    ParentDashboardChild, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} from "@/features/dashboard/types"; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import styles from "./ParentDashboardScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.
import { writeParentChildCookie } from "@/features/families/parent-child-cooke"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

const statusMeta = ATTENDANCE_STATUS_METADATA; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

const quickLinks = [ // /parent/payments 는 준비 중 카피. ParentPaymentsScreen을 연결하지 않는다.
    { href: "/parent/attendance", label: "출결" }, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    { href: "/parent/reports", label: "리포트" }, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    { href: "/parent/payments", label: "결제" }, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    { href: "/parent/timetable", label: "시간표" }, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    { href: "/parent/grades", label: "성적·오답" }, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    { href: "/parent/inbox", label: "쪽지함" }, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
]; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

/** 활성 자녀의 오늘 일정·리포트 미리보기와 바로가기를 그린다. */
export default function ParentDashboardScreen({ // 이 파일의 화면. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    unreadCount, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    news, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    activeChildId, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
}: { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    childList: ParentDashboardChild[]; // childList 필드.
    unreadCount: number; // unreadCount 필드.
    news: DashboardNewsItem[]; // news 필드.
    activeChildId: string; // activeChildId 필드.
}) { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const child = // ?childId/쿠키로 고른 자녀. 없으면 첫 자녀 또는 빈 안내.
        childList.find((item) => item.id === activeChildId) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        childList[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        null; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const router = useRouter(); // 자녀 전환 replace. Server Action·역할 변경 없음.
    function selectChild(childId: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        writeParentChildCookie(childId); // 쿠키 + URL만. Server Action 없음.
        router.replace(`/parent/dashboard?childId=${childId}`); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    } // 블록 끝.

    return ( // 자녀 홈. 결제는 준비 중 카피.
        <section className={styles.page}>{/* 자녀 홈. 결제는 준비 중 카피. */}
            <header className={styles.heading}>{/* 미읽음 쪽지만 inbox로. */}
                <div>{/* 레이아웃 상자. */}
                    <span>MY CHILD</span>{/* 인라인 표시. */}
                    <h1>자녀 홈</h1>{/* 제목. */}
                    <p>선택한 자녀의 오늘 일정과 학습 소식을 확인하세요.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                {unreadCount > 0 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                    <Link href="/parent/inbox" className={styles.alertLink}>{/* 이동. layout 가드를 대신하지 않는다. */}
                        미확인 쪽지 {unreadCount}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    </Link> // Link 닫기.
                )}{/* 구문 끝. */}
            </header>{/* header 닫기. */}

            {childList.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.empty}>{/* 원장이 연결하기 전. */}
                    <h2>연결된 자녀가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 연결을 완료하면 자녀 홈이 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    {childList.length > 1 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <div className={styles.childSwitch}>{/* 여러 자녀면 전환 칩. */}
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
                            <div className={styles.hero}>{/* 오늘 등원/수업. 출석 행을 쓰지 않는다. */}
                                {child.arrivalSummary ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        <StatusChip tone="neutral">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            오늘{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                        <h2>{child.arrivalSummary.title}</h2>{/* 소제목. */}
                                        <p>{child.arrivalSummary.detail}</p>{/* 문장. */}
                                        {child.arrivalSummary.status ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                tone={ // 객체/블록 시작.
                                                    statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        child.arrivalSummary // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            .status // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    ].tone // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                } // 블록 끝.
                                            >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                { // 객체/블록 시작.
                                                    statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        child.arrivalSummary // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            .status // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    ].label // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                }{/* 블록 끝. */}
                                            </StatusChip> // StatusChip 닫기.
                                        ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <StatusChip>미체크</StatusChip> // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        )}{/* 구문 끝. */}
                                    </> // 구문 끝.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <>{/* 요소. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        <StatusChip tone="neutral">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            오늘{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </StatusChip>{/* StatusChip 닫기. */}
                                        <h2>오늘 수업 없음</h2>{/* 소제목. */}
                                        <p>{/* 문장. */}
                                            {child.className // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? `${child.name} · ${child.className}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : child.name}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p>{/* p 닫기. */}
                                    </> // 구문 끝.
                                )}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.quick}>{/* 결제는 /parent/payments — 준비 중 카피. */}
                                {quickLinks.map((link) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <Link // 이동. layout 가드를 대신하지 않는다.
                                        key={link.href} // key 필드.
                                        href={ // 객체/블록 시작.
                                            [ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                "/parent/attendance", // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                "/parent/reports", // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                "/parent/timetable", // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                "/parent/grades", // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            ].includes(link.href) // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? `${link.href}?childId=${child.id}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : link.href // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        } // 블록 끝.
                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {link.label}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </Link> // Link 닫기.
                                ))}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.grid}>{/* 레이아웃 상자. */}
                                <article className={styles.panel}>{/* 오늘 시간표. 비면 안내만. */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>오늘 시간표</h2>{/* 소제목. */}
                                        <Link // 이동. layout 가드를 대신하지 않는다.
                                            href={`/parent/attendance?childId=${child.id}`} // href 필드.
                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            전체{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </Link>{/* Link 닫기. */}
                                    </div>{/* div 닫기. */}
                                    {child.todaySessions.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <p className={styles.muted}>{/* 오늘 세션 없음 */}
                                            오늘 예정된 수업이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p> // p 닫기.
                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <ul className={styles.list}>{/* 목록. */}
                                            {child.todaySessions.map((s) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <li key={s.id}>{/* 항목. */}
                                                    <div>{/* 레이아웃 상자. */}
                                                        <strong>{/* 강조. */}
                                                            {s.className}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <span>{/* 인라인 표시. */}
                                                            {s.timeLabel}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {s.classroom // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? ` · ${s.classroom}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </span>{/* span 닫기. */}
                                                    </div>{/* div 닫기. */}
                                                    {s.attendanceStatus ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            tone={ // 객체/블록 시작.
                                                                statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    s // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        .attendanceStatus // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ].tone // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            } // 블록 끝.
                                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            { // 객체/블록 시작.
                                                                statusMeta[ // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                    s // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                        .attendanceStatus // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ].label // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            }{/* 블록 끝. */}
                                                        </StatusChip> // StatusChip 닫기.
                                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            예정{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </StatusChip> // StatusChip 닫기.
                                                    )}{/* 구문 끝. */}
                                                </li> // li 닫기.
                                            ))}{/* 구문 끝. */}
                                        </ul> // ul 닫기.
                                    )}{/* 구문 끝. */}
                                </article>{/* article 닫기. */}

                                <article className={styles.panel}>{/* 받은 리포트 미리보기 */}
                                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                        <h2>학습 보고서</h2>{/* 소제목. */}
                                        <Link // 이동. layout 가드를 대신하지 않는다.
                                            href={`/parent/reports?childId=${child.id}`} // href 필드.
                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            전체{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </Link>{/* Link 닫기. */}
                                    </div>{/* div 닫기. */}
                                    {child.reports.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <p className={styles.muted}>{/* 문장. */}
                                            아직 받은 리포트가 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </p> // p 닫기.
                                    ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <ul className={styles.list}>{/* 목록. */}
                                            {child.reports.map((r) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <li key={r.id}>{/* 항목. */}
                                                    <div>{/* 레이아웃 상자. */}
                                                        <strong>{/* 강조. */}
                                                            {r.content.slice( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                0, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                40, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ) || "학습 보고서"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {r.content.length > // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            40 // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? "…" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </strong>{/* strong 닫기. */}
                                                        <span>{/* 인라인 표시. */}
                                                            {r.teacherName}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                            {r.sentAt // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? ` · ${formatKstMonthDay(r.sentAt)}` // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : ""}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        </span>{/* span 닫기. */}
                                                    </div>{/* div 닫기. */}
                                                    <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        tone={ // 객체/블록 시작.
                                                            r.parentReadAt // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                ? "neutral" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                                : "warning" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        } // 블록 끝.
                                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                        {r.parentReadAt // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            ? "읽음" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                            : "새 리포트"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    </StatusChip>{/* StatusChip 닫기. */}
                                                </li> // li 닫기.
                                            ))}{/* 구문 끝. */}
                                        </ul> // ul 닫기.
                                    )}{/* 구문 끝. */}
                                </article>{/* article 닫기. */}
                            </div>{/* div 닫기. */}

                            <article className={styles.panel}>{/* 학원 소식. 공개 /notices가 아니라 PARENT 뉴스. */}
                                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                                    <h2>학원 소식</h2>{/* 소제목. */}
                                    <Link href="/parent/news">전체</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                                </div>{/* div 닫기. */}
                                {news.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <p className={styles.muted}>{/* 문장. */}
                                        등록된 소식이 없습니다.{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </p> // p 닫기.
                                ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <ul className={styles.list}>{/* 목록. */}
                                        {news.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                            <li key={item.id}>{/* 항목. */}
                                                <div>{/* 레이아웃 상자. */}
                                                    <strong>{/* 강조. */}
                                                        {item.title}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    </strong>{/* strong 닫기. */}
                                                </div>{/* div 닫기. */}
                                                <span className={styles.date}>{/* 인라인 표시. */}
                                                    {formatKstMonthDay( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                        item.createdAt, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                    )}{/* 구문 끝. */}
                                                </span>{/* span 닫기. */}
                                            </li> // li 닫기.
                                        ))}{/* 구문 끝. */}
                                    </ul> // ul 닫기.
                                )}{/* 구문 끝. */}
                            </article>{/* article 닫기. */}
                        </> // 구문 끝.
                    )}{/* 구문 끝. */}
                </> // 구문 끝.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
