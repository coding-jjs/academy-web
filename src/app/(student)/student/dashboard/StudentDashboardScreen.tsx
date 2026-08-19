/**
 * 학생 홈 카드 UI (서버 컴포넌트).
 *
 * props: data — `getStudentDashboardData`. 프로필이 없으면 연결 대기 안내만.
 * 숫자는 student-data가 계산하고, 여기서는 카드와 바로가기만 그린다.
 * Server Action 없음. 쪽지 배지만 `/student/inbox`로 보낸다.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import { formatKstMonthDay } from "@/lib/date-kst"; // 의존성. 학생 Screen. 본인 Student.userId만.
import type { StudentDashboardData } from "@/features/dashboard/types"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import styles from "./StudentDashboardScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const statusMeta = ATTENDANCE_STATUS_METADATA; // 학생 Screen. 본인 Student.userId만.

const quickLinks = [ // 학생 Screen. 본인 Student.userId만.
    { href: "/student/timetable", label: "시간표" }, // 구문. 학생 Screen. 본인 Student.userId만.
    { href: "/student/grades", label: "성적" }, // 구문. 학생 Screen. 본인 Student.userId만.
    { href: "/student/grades", label: "오답" }, // 구문. 학생 Screen. 본인 Student.userId만.
    { href: "/student/inbox", label: "쪽지" }, // 구문. 학생 Screen. 본인 Student.userId만.
]; // 학생 Screen. 본인 Student.userId만.

/** 미연결이면 대기 안내, 연결이면 오늘 수업·공지 요약을 그린다. */
export default function StudentDashboardScreen({ // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    data, // 구문. 학생 Screen. 본인 Student.userId만.
}: { // 구문. 학생 Screen. 본인 Student.userId만.
    data: StudentDashboardData; // data 필드.
}) { // 구문. 학생 Screen. 본인 Student.userId만.
    if (!data.linked) { // 원장이 학생 계정을 연결하기 전. 점수를 추측하지 않는다.
        return ( // 원장이 학생 계정을 연결하기 전.
            <section className={styles.page}>{/* 학생 홈. 미연결이면 대기 안내만. */}
                <header className={styles.heading}>{/* 연결 대기 */}
                    <div>{/* 레이아웃 상자. */}
                        <span>MY ACADEMY</span>{/* 인라인 표시. */}
                        <h1>내 홈</h1>{/* 제목. */}
                        <p>학생 프로필 연결을 기다리고 있습니다.</p>{/* 문장. */}
                    </div>{/* div 닫기. */}
                </header>{/* header 닫기. */}
                <div className={styles.empty}>{/* 레이아웃 상자. */}
                    <h2>연결된 학생 정보가 없습니다</h2>{/* 소제목. */}
                    <p>{/* 문장. */}
                        학원에서 학생 계정 연결을 완료하면 수업·출결·성적이{/* 학생 Screen. 본인 Student.userId만. */}
                        표시됩니다.{/* 학생 Screen. 본인 Student.userId만. */}
                    </p>{/* p 닫기. */}
                </div>{/* div 닫기. */}
            </section> // section 닫기.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    return ( // 학생 홈. 미연결이면 대기 안내만.
        <section className={styles.page}>{/* 학생 홈. 미연결이면 대기 안내만. */}
            <header className={styles.heading}>{/* 미읽음 쪽지만 inbox로. */}
                <div>{/* 레이아웃 상자. */}
                    <span>MY ACADEMY</span>{/* 인라인 표시. */}
                    <h1>내 홈</h1>{/* 제목. */}
                    <p>오늘 수업, 숙제와 새로운 공지를 한눈에 확인하세요.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                {data.unreadCount > 0 && ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <Link href="/student/inbox" className={styles.alertLink}>{/* 이동. layout 가드를 대신하지 않는다. */}
                        새 쪽지 {data.unreadCount}{/* 학생 Screen. 본인 Student.userId만. */}
                    </Link> // Link 닫기.
                )}{/* 구문 끝. */}
            </header>{/* header 닫기. */}

            <div className={styles.hero}>{/* 오늘 출석 라벨·다음 수업. 쓰기는 없다. */}
                {data.todayAttendanceLabel ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <StatusChip // StatusChip. 학생 Screen. 본인 Student.userId만.
                        tone={statusMeta[data.todayAttendanceLabel].tone} // tone 필드.
                    >{/* 학생 Screen. 본인 Student.userId만. */}
                        오늘 {statusMeta[data.todayAttendanceLabel].label}{/* 학생 Screen. 본인 Student.userId만. */}
                    </StatusChip> // StatusChip 닫기.
                ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <StatusChip tone="neutral">오늘 출석</StatusChip> // StatusChip. 학생 Screen. 본인 Student.userId만.
                )}{/* 구문 끝. */}
                <h2>어서오세요, {data.studentName}님</h2>{/* 소제목. */}
                <p>{/* 문장. */}
                    {data.nextSession // 학생 Screen. 본인 Student.userId만.
                        ? `다음 수업은 ${data.nextSession.timeLabel.split("~")[0]} ${data.nextSession.className}${ // 구문. 학생 Screen. 본인 Student.userId만.
                              data.nextSession.classroom // 학생 Screen. 본인 Student.userId만.
                                  ? ` · ${data.nextSession.classroom}` // 학생 Screen. 본인 Student.userId만.
                                  : "" // 학생 Screen. 본인 Student.userId만.
                          }입니다.` // 학생 Screen. 본인 Student.userId만.
                        : "오늘 예정된 수업이 없습니다."}{/* 학생 Screen. 본인 Student.userId만. */}
                </p>{/* p 닫기. */}
            </div>{/* div 닫기. */}

            <div className={styles.quick}>{/* 시간표·성적·오답·쪽지 */}
                {quickLinks.map((link) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <Link key={`${link.href}-${link.label}`} href={link.href}>{/* 이동. layout 가드를 대신하지 않는다. */}
                        {link.label}{/* 학생 Screen. 본인 Student.userId만. */}
                    </Link> // Link 닫기.
                ))}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            <div className={styles.metrics}>{/* 오늘 수업 수·최근 성적·오답 개수 */}
                <article>{/* 학생 홈. 미연결이면 대기 안내만. */}
                    <span>오늘 수업</span>{/* 인라인 표시. */}
                    <strong>{data.todaySessions.length}</strong>{/* 강조. */}
                    <p>건</p>{/* 문장. */}
                </article>{/* article 닫기. */}
                <article>{/* 학생 홈. 미연결이면 대기 안내만. */}
                    <span>최근 성적</span>{/* 인라인 표시. */}
                    <strong>{/* 강조. */}
                        {data.latestGrade // 학생 Screen. 본인 Student.userId만.
                            ? `${data.latestGrade.score}` // 학생 Screen. 본인 Student.userId만.
                            : "—"}{/* 학생 Screen. 본인 Student.userId만. */}
                    </strong>{/* strong 닫기. */}
                    <p>{/* 문장. */}
                        {data.latestGrade // 학생 Screen. 본인 Student.userId만.
                            ? data.latestGrade.subject // 학생 Screen. 본인 Student.userId만.
                            : "기록 없음"}{/* 학생 Screen. 본인 Student.userId만. */}
                    </p>{/* p 닫기. */}
                </article>{/* article 닫기. */}
                <article>{/* 학생 홈. 미연결이면 대기 안내만. */}
                    <span>복습 오답</span>{/* 인라인 표시. */}
                    <strong>{data.openWrongCount}</strong>{/* 강조. */}
                    <p>개</p>{/* 문장. */}
                </article>{/* article 닫기. */}
            </div>{/* div 닫기. */}

            <div className={styles.grid}>{/* 레이아웃 상자. */}
                <article className={styles.panel}>{/* 오늘 시간표. 비면 안내. */}
                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                        <h2>오늘 시간표</h2>{/* 소제목. */}
                        <Link href="/student/timetable">전체</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                    </div>{/* div 닫기. */}
                    {data.todaySessions.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                        <p className={styles.muted}>오늘 수업이 없습니다.</p> // 오늘 수업 없음
                    ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                        <ul className={styles.list}>{/* 목록. */}
                            {data.todaySessions.map((s, index) => ( // 구문. 학생 Screen. 본인 Student.userId만.
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
                                                statusMeta[s.attendanceStatus] // 학생 Screen. 본인 Student.userId만.
                                                    .tone // 학생 Screen. 본인 Student.userId만.
                                            } // 블록 끝.
                                        >{/* 학생 Screen. 본인 Student.userId만. */}
                                            { // 객체/블록 시작.
                                                statusMeta[s.attendanceStatus] // 학생 Screen. 본인 Student.userId만.
                                                    .label // 학생 Screen. 본인 Student.userId만.
                                            }{/* 블록 끝. */}
                                        </StatusChip> // StatusChip 닫기.
                                    ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                                        <StatusChip>{/* StatusChip. 학생 Screen. 본인 Student.userId만. */}
                                            {index === 0 ? "예정" : "다음"}{/* 학생 Screen. 본인 Student.userId만. */}
                                        </StatusChip> // StatusChip 닫기.
                                    )}{/* 구문 끝. */}
                                </li> // li 닫기.
                            ))}{/* 구문 끝. */}
                        </ul> // ul 닫기.
                    )}{/* 구문 끝. */}
                </article>{/* article 닫기. */}

                <article className={styles.panel}>{/* 숙제 미리보기 */}
                    <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                        <h2>숙제</h2>{/* 소제목. */}
                        <Link href="/student/grades">학습</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                    </div>{/* div 닫기. */}
                    {data.homework.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                        <p className={styles.muted}>등록된 숙제가 없습니다.</p> // 문장.
                    ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                        <ul className={styles.list}>{/* 목록. */}
                            {data.homework.map((item) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                                <li key={item.id}>{/* 항목. */}
                                    <div>{/* 레이아웃 상자. */}
                                        <strong>{item.title}</strong>{/* 강조. */}
                                        <span>{/* 인라인 표시. */}
                                            {formatKstMonthDay(item.recordDate)}{/* 학생 Screen. 본인 Student.userId만. */}
                                        </span>{/* span 닫기. */}
                                    </div>{/* div 닫기. */}
                                </li> // li 닫기.
                            ))}{/* 구문 끝. */}
                        </ul> // ul 닫기.
                    )}{/* 구문 끝. */}
                </article>{/* article 닫기. */}
            </div>{/* div 닫기. */}

            <article className={styles.panel}>{/* 학생 대상 뉴스. 공개 /notices와 별개. */}
                <div className={styles.panelHead}>{/* 레이아웃 상자. */}
                    <h2>청소년 체험 소식</h2>{/* 소제목. */}
                    <Link href="/student/news">전체</Link>{/* 이동. layout 가드를 대신하지 않는다. */}
                </div>{/* div 닫기. */}
                {data.news.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <p className={styles.muted}>등록된 소식이 없습니다.</p> // 문장.
                ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                    <ul className={styles.list}>{/* 목록. */}
                        {data.news.map((item) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                            <li key={item.id}>{/* 항목. */}
                                <div>{/* 레이아웃 상자. */}
                                    <strong>{item.title}</strong>{/* 강조. */}
                                </div>{/* div 닫기. */}
                                <span className={styles.date}>{/* 인라인 표시. */}
                                    {formatKstMonthDay(item.createdAt)}{/* 학생 Screen. 본인 Student.userId만. */}
                                </span>{/* span 닫기. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </article>{/* article 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
