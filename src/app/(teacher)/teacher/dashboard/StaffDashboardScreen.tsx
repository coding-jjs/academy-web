"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 오늘 담당 수업·지표 요약 UI (클라이언트).
 *
 * `/teacher/dashboard`만 이 Screen을 연결한다. 직원 대시보드는 재사용하지 않는다.
 * props `role`은 TEACHER/STAFF 라벨·지표 문구용이나, 바로가기는 `/teacher/*`로 고정이다.
 *
 * props: staffName, metrics, sessions — `getStaffDashboardData` 결과.
 * Server Action을 제출하지 않는다. 출석 저장은 `/teacher/attendance`.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 라우트 전용. 직원이 쓰지 않는다.
import type { // 타입만. 런타임 로직이 아니다.
    StaffDashboardMetrics, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
    StaffDashboardSession, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
} from "@/features/dashboard/types"; // 교사 라우트 전용. 직원이 쓰지 않는다.
import styles from "./StaffDashboardScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 오늘 수업 카드와 출석/리포트 바로가기를 그린다. */
export default function StaffDashboardScreen({ // 이 파일의 화면. 교사 라우트 전용. 직원이 쓰지 않는다.
    role, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
    staffName, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
    metrics, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
    sessions, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
}: { // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
    role: "TEACHER" | "STAFF"; // role 필드.
    staffName: string; // staffName 필드.
    metrics: StaffDashboardMetrics; // metrics 필드.
    sessions: StaffDashboardSession[]; // sessions 필드.
}) { // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
    const quickLinks = [ // /teacher/* 고정. 직원 대시보드는 이 Screen을 연결하지 않는다.
        { href: "/teacher/attendance", label: "출석 체크" }, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
        { href: "/teacher/reports", label: "AI 리포트" }, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
        { href: "/teacher/students", label: "담당 학생" }, // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
        { // 배정 케어가 있으면 건수를 붙인다.
            href: "/teacher/counseling", // 교사 상담. 직원이 이 Screen을 쓰지 않는다.
            label: // 배지.
                metrics.pendingChurnCare > 0 // COUNSELING 배정 건.
                    ? `상담 관리 (${metrics.pendingChurnCare})` // 할 일 숫자.
                    : "상담 관리", // 건수 0이면 라벨만.
        },
    ]; // 교사 라우트 전용. 직원이 쓰지 않는다.

    return ( // 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다.
        <section className={styles.page}>{/* 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다. */}
            <header className={styles.heading}>{/* 교사 오늘 수업 홈. role 라벨은 TEACHER/STAFF 문구용. */}
                <div>{/* 레이아웃 상자. */}
                    <span>{role === "TEACHER" ? "TEACHER" : "STAFF"}</span>{/* 인라인 표시. */}
                    <h1>내 수업</h1>{/* 제목. */}
                    <p>{/* 문장. */}
                        {staffName}님, 오늘 담당 수업과 학생 현황을 확인하세요.{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </p>{/* p 닫기. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.metrics}>{/* 출결 미입력·리포트. STAFF면 상담 문의 숫자를 보여 주지만 라우트는 교사뿐. */}
                <article>{/* 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다. */}
                    <span>오늘 수업</span>{/* 인라인 표시. */}
                    <strong>{metrics.todayClassCount}개</strong>{/* 강조. */}
                    <p>{/* 문장. */}
                        {metrics.firstClassTime // 교사 라우트 전용. 직원이 쓰지 않는다.
                            ? `첫 수업 ${metrics.firstClassTime}` // 교사 라우트 전용. 직원이 쓰지 않는다.
                            : "예정 없음"}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </p>{/* p 닫기. */}
                </article>{/* article 닫기. */}
                <article>{/* 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다. */}
                    <span>출결 미입력</span>{/* 인라인 표시. */}
                    <strong>{metrics.uncheckedSessions}개 반</strong>{/* 강조. */}
                    <p>{/* 문장. */}
                        {metrics.uncheckedSessions > 0 // 교사 라우트 전용. 직원이 쓰지 않는다.
                            ? "출석 체크가 필요합니다" // 교사 라우트 전용. 직원이 쓰지 않는다.
                            : "모두 입력됨"}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </p>{/* p 닫기. */}
                </article>{/* article 닫기. */}
                <article>{/* 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다. */}
                    <span>보고서 작업</span>{/* 인라인 표시. */}
                    <strong>{metrics.pendingReports}건</strong>{/* 강조. */}
                    <p>작성·승인대기·반려</p>{/* 문장. */}
                </article>{/* article 닫기. */}
                <article>{/* 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다. */}
                    <span>{/* 인라인 표시. */}
                        {role === "TEACHER" ? "담당 학생" : "상담 문의"}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </span>{/* span 닫기. */}
                    <strong>{/* 강조. */}
                        {role === "TEACHER" // 교사 라우트 전용. 직원이 쓰지 않는다.
                            ? `${metrics.myStudentCount}명` // 교사 라우트 전용. 직원이 쓰지 않는다.
                            : `${metrics.openInquiries}건`}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </strong>{/* strong 닫기. */}
                    <p>{/* 문장. */}
                        {role === "TEACHER" ? "재원 학생" : "신규·진행중 문의"}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </p>{/* p 닫기. */}
                </article>{/* article 닫기. */}
            </div>{/* div 닫기. */}

            <div className={styles.quick}>{/* 출석·리포트는 교사 URL. 직원이 쓰면 잘못된 경로다. */}
                {quickLinks.map((link) => ( // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
                    <Link key={link.href} href={link.href}>{/* 이동. layout 가드를 대신하지 않는다. */}
                        {link.label}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                    </Link> // Link 닫기.
                ))}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            <article className={styles.panel}>{/* 교사 오늘 수업 홈. 직원 dashboard가 쓰지 않는다. */}
                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                    <h2>오늘 일정</h2>{/* 소제목. */}
                    <StatusChip>{sessions.length}건</StatusChip>{/* StatusChip. 교사 라우트 전용. 직원이 쓰지 않는다. */}
                </div>{/* div 닫기. */}

                {sessions.length === 0 ? ( // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
                    <p className={styles.muted}>오늘 예정된 수업이 없습니다.</p> // 오늘 세션 없음. 저장 Action은 없다.
                ) : ( // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
                    <ul className={styles.list}>{/* 미체크면 출석 화면으로. */}
                        {sessions.map((item) => ( // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
                            <li key={item.id}>{/* 항목. */}
                                <div>{/* 레이아웃 상자. */}
                                    <strong>{item.className}</strong>{/* 강조. */}
                                    <span>{/* 인라인 표시. */}
                                        {item.timeLabel}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        {item.classroom // 교사 라우트 전용. 직원이 쓰지 않는다.
                                            ? ` · ${item.classroom}` // 교사 라우트 전용. 직원이 쓰지 않는다.
                                            : ""}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        {` · ${item.subject}`}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                    </span>{/* span 닫기. */}
                                    <small>{/* 보조 문장. */}
                                        학생 {item.studentCount}명{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        {item.uncheckedCount > 0 // 교사 라우트 전용. 직원이 쓰지 않는다.
                                            ? ` · 미체크 ${item.uncheckedCount}명` // 교사 라우트 전용. 직원이 쓰지 않는다.
                                            : " · 출결 완료"}{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                    </small>{/* small 닫기. */}
                                </div>{/* div 닫기. */}
                                <div className={styles.rowActions}>{/* 레이아웃 상자. */}
                                    {item.uncheckedCount > 0 ? ( // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
                                        <StatusChip tone="warning">{/* StatusChip. 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                            미입력{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        </StatusChip> // StatusChip 닫기.
                                    ) : ( // 구문. 교사 라우트 전용. 직원이 쓰지 않는다.
                                        <StatusChip tone="success">{/* StatusChip. 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                            완료{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        </StatusChip> // StatusChip 닫기.
                                    )}{/* 구문 끝. */}
                                    <Link // 이동. layout 가드를 대신하지 않는다.
                                        href="/teacher/attendance" // href 필드.
                                        className={ // 객체/블록 시작.
                                            item.uncheckedCount > 0 // 교사 라우트 전용. 직원이 쓰지 않는다.
                                                ? styles.primaryLink // 교사 라우트 전용. 직원이 쓰지 않는다.
                                                : styles.secondaryLink // 교사 라우트 전용. 직원이 쓰지 않는다.
                                        } // 블록 끝.
                                    >{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        출석 체크{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                    </Link>{/* Link 닫기. */}
                                    <Link // 이동. layout 가드를 대신하지 않는다.
                                        href="/teacher/students" // href 필드.
                                        className={styles.secondaryLink} // className 필드.
                                    >{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                        학생 보기{/* 교사 라우트 전용. 직원이 쓰지 않는다. */}
                                    </Link>{/* Link 닫기. */}
                                </div>{/* div 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </article>{/* article 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
