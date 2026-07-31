"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./AcademyWireframe.module.css";

type RoleKey = "director" | "teacher" | "parent" | "student" | "guest";
type Screen = { id: string; label: string; icon: string };
type Role = {
    label: string;
    client: string;
    notification: string;
    screens: Screen[];
};

const roles: Record<RoleKey, Role> = {
    director: {
        label: "원장",
        client: "운영 관리 웹",
        notification: "알림 7",
        screens: [
            { id: "dashboard", label: "대시보드", icon: "▦" },
            { id: "churn", label: "이탈 위험", icon: "△" },
            { id: "reports", label: "AI 리포트", icon: "▤" },
            { id: "students", label: "학생 DB", icon: "◉" },
            { id: "billing", label: "청구·수납", icon: "▰" },
            { id: "permissions", label: "권한 관리", icon: "◇" },
        ],
    },
    teacher: {
        label: "교사",
        client: "교직원 반응형 웹",
        notification: "알림 4",
        screens: [
            { id: "dashboard", label: "내 수업", icon: "▦" },
            { id: "attendance", label: "출석 체크", icon: "✓" },
            { id: "reports", label: "AI 리포트", icon: "▤" },
            { id: "students", label: "담당 학생", icon: "◉" },
            { id: "counseling", label: "상담 관리", icon: "◎" },
        ],
    },
    parent: {
        label: "학부모",
        client: "학부모 PWA",
        notification: "알림 3",
        screens: [
            { id: "dashboard", label: "자녀 홈", icon: "⌂" },
            { id: "reports", label: "AI 리포트", icon: "▤" },
            { id: "attendance", label: "출결·수업", icon: "▣" },
            { id: "payments", label: "결제", icon: "▰" },
            { id: "inbox", label: "쪽지함", icon: "□" },
            { id: "timetable", label: "시간표", icon: "▣" },
            { id: "grades", label: "성적·오답", icon: "▤" },
            { id: "news", label: "체험 소식", icon: "✦" },
            { id: "student-inbox", label: "학생 공지·쪽지", icon: "□" },
        ],
    },
    student: {
        label: "학생",
        client: "학생 PWA · 민감정보 차단",
        notification: "알림 2",
        screens: [
            { id: "dashboard", label: "내 홈", icon: "⌂" },
            { id: "timetable", label: "시간표", icon: "▣" },
            { id: "grades", label: "성적·오답", icon: "▤" },
            { id: "news", label: "체험 소식", icon: "✦" },
            { id: "inbox", label: "공지·쪽지", icon: "□" },
        ],
    },
    guest: {
        label: "게스트",
        client: "공개 반응형 웹",
        notification: "",
        screens: [
            { id: "landing", label: "학원 소개", icon: "⌂" },
            { id: "location", label: "위치·약도", icon: "⌖" },
            { id: "inquiry", label: "상담 문의", icon: "◎" },
        ],
    },
};

const parentChildren = [
    {
        id: "jin",
        name: "김O진",
        grade: "중2",
        arrival: "오늘 16:27 등원했어요",
        attendance: "중2 수학 A · 18:00 자동 하원 예정",
        schedule: [
            {
                subject: "수학 A",
                detail: "16:30~18:00 · 302호",
                status: "예정",
            },
            {
                subject: "영어 B",
                detail: "18:10~19:40 · 201호",
                status: "다음",
            },
        ],
        report: "7월 수학 보고서",
        teacher: "김교사 · 07.25",
    },
    {
        id: "seo",
        name: "김O서",
        grade: "초6",
        arrival: "오늘 15:54 등원했어요",
        attendance: "초6 영어 A · 17:20 자동 하원 예정",
        schedule: [
            {
                subject: "영어 A",
                detail: "16:00~17:20 · 201호",
                status: "수업 중",
            },
            {
                subject: "수학 기초",
                detail: "17:30~18:40 · 305호",
                status: "다음",
            },
        ],
        report: "7월 영어 보고서",
        teacher: "이교사 · 07.24",
    },
];

function Button({
    children,
    primary = false,
    className = "",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
    return (
        <button
            type="button"
            className={`${styles.button} ${primary ? styles.primaryButton : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return <span className={styles.badge}>{children}</span>;
}

function Stat({
    label,
    value,
    context,
}: {
    label: string;
    value: string;
    context: string;
}) {
    return (
        <article className={styles.statCard}>
            <span className={styles.muted}>{label}</span>
            <strong className={styles.statValue}>{value}</strong>
            <span className={styles.small}>{context}</span>
        </article>
    );
}

function Stats({ items }: { items: [string, string, string][] }) {
    return (
        <div className={styles.stats}>
            {items.map(([label, value, context]) => (
                <Stat
                    key={label}
                    label={label}
                    value={value}
                    context={context}
                />
            ))}
        </div>
    );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
    return (
        <li className={styles.listItem}>
            <div className={styles.grow}>
                <div className={styles.itemTitle}>{label}</div>
                <div className={styles.track}>
                    <span
                        className={styles.fill}
                        style={{ width: `${value}%` }}
                    />
                </div>
            </div>
            <span>{value}%</span>
        </li>
    );
}

function Section({
    title,
    children,
}: {
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <section className={styles.section}>
            {title && <h3>{title}</h3>}
            {children}
        </section>
    );
}

function DataTable({
    headers,
    rows,
}: {
    headers: string[];
    rows: React.ReactNode[][];
}) {
    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DirectorDashboard() {
    return (
        <>
            <Stats
                items={[
                    ["AI 승인 대기", "5건", "오늘 검수 필요"],
                    ["신규 이탈 위험", "2명", "담당 교사 지정 필요"],
                    ["미납 청구", "3건", "재알림 가능"],
                ]}
            />
            <Section title="오늘의 운영 현황">
                <ul className={styles.list}>
                    <ProgressRow label="출결 입력률" value={82} />
                    <ProgressRow label="AI 리포트 작성률" value={64} />
                    <ProgressRow label="이번 달 수납률" value={91} />
                </ul>
            </Section>
            <Section title="최근 주의 학생">
                <DataTable
                    headers={["학생", "반", "감지 사유", "상태"]}
                    rows={[
                        [
                            "김O진",
                            "중2 수학 A",
                            "연속 결석 2회",
                            <Badge key="a">위험 감지</Badge>,
                        ],
                        [
                            "박O연",
                            "중3 영어 B",
                            "성적 12점 하락",
                            <Badge key="b">상담 중</Badge>,
                        ],
                    ]}
                />
            </Section>
        </>
    );
}

function Churn() {
    return (
        <>
            <Stats
                items={[
                    ["위험 감지", "6명", "자동 규칙 충족"],
                    ["상담 중", "3명", "담당 교사 조치 중"],
                    ["개선", "4명", "최근 30일"],
                ]}
            />
            <Section>
                <div className={styles.status}>
                    <Badge>기본값</Badge>
                    <span>출석 15%p · 성적 10점 · 결석 2회 · 미납 3일</span>
                </div>
                <DataTable
                    headers={["학생", "담당", "감지 사유", "상태", "조치"]}
                    rows={[
                        [
                            "김O진",
                            "김교사",
                            "연속 결석 2회",
                            "위험 감지",
                            <Button key="a">상담 시작</Button>,
                        ],
                        [
                            "박O연",
                            "이교사",
                            "성적 12점 하락",
                            "상담 중",
                            <Button key="b">개선 처리</Button>,
                        ],
                        [
                            "최O우",
                            "김교사",
                            "미납 4일",
                            "위험 감지",
                            <Button key="c">쪽지</Button>,
                        ],
                    ]}
                />
            </Section>
        </>
    );
}

function Reports({ role }: { role: RoleKey }) {
    if (role === "teacher") {
        return (
            <div className={styles.split}>
                <Section title="중2 수학 A · 7월">
                    <ul className={styles.list}>
                        {[
                            "김O진 · 작성 중",
                            "박O연 · 승인 대기",
                            "최O우 · 미작성",
                        ].map((item) => (
                            <li className={styles.listItem} key={item}>
                                {item}
                            </li>
                        ))}
                    </ul>
                </Section>
                <Section title="김O진 보고서">
                    <label className={styles.field}>
                        평가 키워드
                        <select>
                            <option>수업 태도 · 과제 · 이해도</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        톤
                        <select>
                            <option>격려·칭찬</option>
                            <option>전문적</option>
                            <option>단호</option>
                        </select>
                    </label>
                    <label className={styles.field}>
                        초안
                        <textarea defaultValue="이번 달에는 개념 이해와 과제 수행이 안정적으로 향상되었습니다…" />
                    </label>
                    <div className={styles.actions}>
                        <Button>AI 재생성</Button>
                        <Button primary>승인 요청</Button>
                    </div>
                </Section>
            </div>
        );
    }
    if (role === "parent") {
        return (
            <div className={styles.mobileContent}>
                <div className={styles.hero}>
                    <Badge>7월 리포트</Badge>
                    <h3>수학 A반 학습 보고서</h3>
                    <p>
                        개념 이해와 과제 수행이 안정적으로 향상되었습니다. 다음
                        달에는 계산 실수를 줄이는 데 집중합니다.
                    </p>
                </div>
                <Section title="선생님 코멘트">
                    <p>
                        수업 참여도가 좋고 질문이 구체적입니다. 오답 복습을 주
                        2회 유지해 주세요.
                    </p>
                </Section>
                <Section title="지난 보고서">
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            6월 학습 보고서 <span>보기</span>
                        </li>
                        <li className={styles.listItem}>
                            5월 학습 보고서 <span>보기</span>
                        </li>
                    </ul>
                </Section>
            </div>
        );
    }
    return (
        <>
            <Stats
                items={[
                    ["승인 대기", "5건", "교사 작성 완료"],
                    ["반려", "1건", "재작성 중"],
                    ["이번 달 발송", "42건", "읽음 35건"],
                ]}
            />
            <Section>
                <DataTable
                    headers={["학생", "교사", "상태", "액션"]}
                    rows={[
                        [
                            "김O진",
                            "김교사",
                            "승인 대기",
                            <Button key="a">검수</Button>,
                        ],
                        [
                            "박O연",
                            "이교사",
                            "승인 대기",
                            <Button key="b">검수</Button>,
                        ],
                    ]}
                />
            </Section>
        </>
    );
}

function Attendance({ role }: { role: RoleKey }) {
    if (role === "teacher") {
        return (
            <Section>
                <div className={styles.status}>
                    <Badge>16:30~18:00</Badge>
                    <strong>중2 수학 A · 302호</strong>
                </div>
                <div className={styles.actions}>
                    <Button>전원 출석</Button>
                    <Button primary>변경 저장</Button>
                </div>
                <DataTable
                    headers={["학생", "사유 결석 신청", "출결", "등원 시각"]}
                    rows={[
                        [
                            "김O진",
                            "없음",
                            <select key="a" className={styles.compactSelect}>
                                <option>출석</option>
                                <option>지각</option>
                                <option>결석</option>
                            </select>,
                            "16:27",
                        ],
                        [
                            "박O연",
                            <Badge key="b">신청 있음</Badge>,
                            <select key="c" className={styles.compactSelect}>
                                <option>미체크</option>
                                <option>출석</option>
                                <option>결석</option>
                            </select>,
                            "—",
                        ],
                        [
                            "최O우",
                            "없음",
                            <select key="d" className={styles.compactSelect}>
                                <option>지각</option>
                                <option>출석</option>
                                <option>결석</option>
                            </select>,
                            "16:41",
                        ],
                    ]}
                />
            </Section>
        );
    }
    return (
        <div className={styles.mobileContent}>
            <div className={styles.hero}>
                <Badge>오늘</Badge>
                <h3>중2 수학 A</h3>
                <p>16:30~18:00 · 302호 · 출석</p>
            </div>
            <Section title="7월 출결">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        출석 <strong>7회</strong>
                    </li>
                    <li className={styles.listItem}>
                        지각 <strong>1회</strong>
                    </li>
                    <li className={styles.listItem}>
                        결석 <strong>0회</strong>
                    </li>
                </ul>
            </Section>
            {role === "parent" && (
                <Button primary className={styles.blockButton}>
                    사유 결석 신청
                </Button>
            )}
        </div>
    );
}

function Students() {
    return (
        <Section>
            <div className={styles.filters}>
                <label className={styles.field}>
                    학생 검색
                    <input type="search" placeholder="이름 또는 반" />
                </label>
                <label className={styles.field}>
                    반
                    <select>
                        <option>전체 반</option>
                        <option>중2 수학 A</option>
                    </select>
                </label>
            </div>
            <DataTable
                headers={["학생", "반", "Google 연동", "학부모", "상태"]}
                rows={[
                    ["김O진 · 2012.03", "중2 수학 A", "연동", "1명", "재원"],
                    ["박O연 · 2012.08", "중2 수학 A", "미연동", "—", "재원"],
                    ["최O우 · 2011.11", "중3 영어 B", "연동", "1명", "재원"],
                ]}
            />
        </Section>
    );
}

function Permissions() {
    const permissions = [
        "전체 학생 DB 조회",
        "학부모 연락처 열람",
        "AI 리포트 작성",
        "원장 승인 없이 발송",
        "쪽지 발송",
    ];
    return (
        <div className={styles.split}>
            <Section title="교직원">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        김교사 · TEACHER <Button>선택</Button>
                    </li>
                    <li className={styles.listItem}>
                        이사무원 · STAFF <Button>선택</Button>
                    </li>
                </ul>
            </Section>
            <Section title="김교사 권한">
                <div className={styles.checks}>
                    {permissions.map((item, index) => (
                        <label key={item}>
                            <input
                                type="checkbox"
                                defaultChecked={index === 2}
                            />{" "}
                            {item}
                        </label>
                    ))}
                </div>
                <p className={styles.muted}>
                    교사는 수납·결제 권한을 부여할 수 없습니다.
                </p>
                <Button primary>권한 저장</Button>
            </Section>
        </div>
    );
}

function TeacherDashboard() {
    return (
        <>
            <Stats
                items={[
                    ["오늘 수업", "3개", "첫 수업 16:30"],
                    ["출결 미입력", "1개 반", "중1 영어 C"],
                    ["보고서 승인 대기", "8건", "7월 회차"],
                ]}
            />
            <Section title="오늘 일정">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        <span>
                            <b>중2 수학 A</b>
                            <small>16:30~18:00 · 302호</small>
                        </span>
                        <Button primary>출석 체크</Button>
                    </li>
                    <li className={styles.listItem}>
                        <span>
                            <b>중3 수학 B</b>
                            <small>18:10~19:40 · 301호</small>
                        </span>
                        <Button>학생 보기</Button>
                    </li>
                </ul>
            </Section>
        </>
    );
}

function ParentDashboard({
    onNavigate,
    selectedChildId,
}: {
    onNavigate: (screen: string) => void;
    selectedChildId: string;
}) {
    const selectedChild =
        parentChildren.find((child) => child.id === selectedChildId) ??
        parentChildren[0];
    const quickLinks = [
        ["출결", "attendance"],
        ["리포트", "reports"],
        ["결제", "payments"],
        ["시간표", "timetable"],
        ["성적·오답", "grades"],
        ["학생 공지", "student-inbox"],
    ];

    return (
        <div className={styles.mobileContent}>
            <div className={styles.hero}>
                <h3>{selectedChild.arrival}</h3>
                <p className={styles.muted}>{selectedChild.attendance}</p>
            </div>
            <div className={styles.quick}>
                {quickLinks.map(([label, target]) => (
                    <Button key={target} onClick={() => onNavigate(target)}>
                        {label}
                    </Button>
                ))}
            </div>
            <Section title="오늘 시간표">
                <ul className={styles.list}>
                    {selectedChild.schedule.map((lesson, index) => (
                        <li className={styles.listItem} key={lesson.subject}>
                            <span>
                                <b>{lesson.subject}</b>
                                <small>{lesson.detail}</small>
                            </span>
                            {index === 0 ? (
                                <Badge>{lesson.status}</Badge>
                            ) : (
                                <span>{lesson.status}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </Section>
            <Section title="도착한 학습 보고서">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        <span>
                            <b>{selectedChild.report}</b>
                            <small>{selectedChild.teacher}</small>
                        </span>
                        <span>보기</span>
                    </li>
                </ul>
            </Section>
            <Section title="대구 교육 소식">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        2027학년도 고입 설명회 <span>08.03</span>
                    </li>
                    <li className={styles.listItem}>
                        여름방학 학습 상담 안내 <span>07.30</span>
                    </li>
                </ul>
            </Section>
        </div>
    );
}

function StudentDashboard() {
    return (
        <div className={styles.mobileContent}>
            <div className={styles.hero}>
                <Badge>오늘 출석</Badge>
                <h3>안녕, 김O진!</h3>
                <p>다음 수업은 16:30 중2 수학 A · 302호입니다.</p>
            </div>
            <div className={styles.quick}>
                {["시간표", "성적", "오답", "공지"].map((item) => (
                    <Button key={item}>{item}</Button>
                ))}
            </div>
            <Section title="오늘 시간표">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        <span>
                            <b>수학 A</b>
                            <small>16:30~18:00 · 302호</small>
                        </span>
                        <Badge>예정</Badge>
                    </li>
                    <li className={styles.listItem}>
                        <span>
                            <b>영어 B</b>
                            <small>18:10~19:40 · 201호</small>
                        </span>
                        <span>다음</span>
                    </li>
                </ul>
            </Section>
            <Section title="청소년 체험 소식">
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        대구 AI·SW 여름 캠프 <span>08.10</span>
                    </li>
                </ul>
            </Section>
        </div>
    );
}

function MobileList({ role, screen }: { role: RoleKey; screen: string }) {
    if (screen === "timetable")
        return (
            <div className={styles.mobileContent}>
                <Section title="이번 주">
                    <DataTable
                        headers={["요일", "시간", "수업", "강의실"]}
                        rows={[
                            ["월", "16:30", "수학 A", "302"],
                            ["수", "18:10", "영어 B", "201"],
                            ["금", "16:30", "수학 A", "302"],
                        ]}
                    />
                </Section>
            </div>
        );
    if (screen === "grades")
        return (
            <div className={styles.mobileContent}>
                <Stats
                    items={[
                        ["최근 수학", "88점", "이전 대비 +6"],
                        ["최근 영어", "92점", "이전 대비 +2"],
                        ["오답 노트", "5개", "복습 필요 2개"],
                    ]}
                />
                <Section title="최근 오답">
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            이차방정식 · 계산 실수 <span>사진 2</span>
                        </li>
                        <li className={styles.listItem}>
                            확률 · 조건 해석 <span>사진 1</span>
                        </li>
                    </ul>
                </Section>
            </div>
        );
    if (screen === "payments")
        return (
            <div className={styles.mobileContent}>
                <div className={styles.hero}>
                    <Badge>미납</Badge>
                    <h3>교재비 35,000원</h3>
                    <p className={styles.muted}>납기 2026.07.24</p>
                    <Button primary className={styles.blockButton}>
                        토스로 결제하기
                    </Button>
                </div>
                <Section title="납부 내역">
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            7월 학원비 <span>320,000원 · 완료</span>
                        </li>
                        <li className={styles.listItem}>
                            6월 학원비 <span>320,000원 · 완료</span>
                        </li>
                    </ul>
                </Section>
            </div>
        );
    if (screen === "news")
        return (
            <div className={styles.mobileContent}>
                <Section title="대구 청소년 교육·체험">
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            AI·SW 여름 캠프 <Button>보기</Button>
                        </li>
                        <li className={styles.listItem}>
                            과학관 진로 체험 <Button>보기</Button>
                        </li>
                    </ul>
                </Section>
            </div>
        );
    return (
        <div className={styles.mobileContent}>
            <Section title={role === "student" ? "공지·쪽지" : "받은 쪽지"}>
                <ul className={styles.list}>
                    <li className={styles.listItem}>
                        7월 학습 보고서가 도착했습니다 <Badge>새 쪽지</Badge>
                    </li>
                    <li className={styles.listItem}>
                        {role === "student"
                            ? "여름방학 수업 시간 안내"
                            : "교재비 납부 안내"}{" "}
                        <span>읽음</span>
                    </li>
                </ul>
            </Section>
        </div>
    );
}

const guestAnnouncements = [
    {
        eyebrow: "여름방학 특별 프로그램",
        title: "집중 학습반 모집",
        detail: "중등 수학·영어, 이번 방학에 실력을 완성하세요.",
        image: "/banners/summer-intensive-1080x1440.png",
        imageAlt: "파란 배경 위에 놓인 수학·영어 교재와 학습 도구",
    },
    {
        eyebrow: "학부모 1:1 상담",
        title: "2학기 학습 설계",
        detail: "현재 성취도부터 진학 계획까지 함께 점검합니다.",
        image: "/banners/parent-consultation-1080x1440.png",
        imageAlt: "주황색 상담 공간에 놓인 플래너와 태블릿",
    },
    {
        eyebrow: "신학기 개강",
        title: "수학·영어 신규 모집",
        detail: "개념부터 심화까지, 학생에게 맞는 반을 안내해 드립니다.",
        image: "/banners/new-semester-1080x1440.png",
        imageAlt: "민트색 배경 위에 놓인 달력과 교재, 학습 도구",
    },
];

function AnnouncementRoller() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const timer = window.setInterval(() => {
            setActiveIndex((index) => (index + 1) % guestAnnouncements.length);
        }, 5000);

        return () => window.clearInterval(timer);
    }, [isPaused]);

    const announcement = guestAnnouncements[activeIndex];

    return (
        <section className={styles.promoBanner} aria-label="학원 프로모션">
            <div className={styles.promoFrame} key={announcement.image}>
                <Image
                    src={announcement.image}
                    alt={announcement.imageAlt}
                    width={1080}
                    height={1440}
                    sizes="(max-width: 640px) calc(100vw - 32px), 720px"
                    priority
                />
                <div className={styles.promoCopy}>
                    <span>{announcement.eyebrow}</span>
                    <strong>{announcement.title}</strong>
                    <p>{announcement.detail}</p>
                </div>
                <div className={styles.promoControls}>
                    <div className={styles.promoDots} aria-label="배너 선택">
                        {guestAnnouncements.map((item, index) => (
                            <button
                                type="button"
                                key={item.title}
                                className={
                                    index === activeIndex
                                        ? styles.promoDotActive
                                        : styles.promoDot
                                }
                                aria-label={`${index + 1}번 배너: ${item.title}`}
                                aria-current={
                                    index === activeIndex ? "true" : undefined
                                }
                                onClick={() => setActiveIndex(index)}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        className={styles.promoPause}
                        aria-label={isPaused ? "배너 자동 재생" : "배너 일시정지"}
                        onClick={() => setIsPaused((paused) => !paused)}
                    >
                        {isPaused ? "▶" : "Ⅱ"}
                    </button>
                </div>
            </div>
            <span className={styles.srOnly} aria-live="polite">
                {announcement.title}
            </span>
        </section>
    );
}

function Guest({
    screen,
    onNavigate,
}: {
    screen: string;
    onNavigate: (screen: string) => void;
}) {
    if (screen === "location")
        return (
            <div className={styles.mobileContent}>
                <div className={styles.hero}>
                    <h2>오시는 길</h2>
                    <p>대구광역시 ○○구 ○○로 00 · A학원</p>
                </div>
                <div className={styles.map}>
                    ⌖<span>약도 이미지</span>
                </div>
                <Section>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>
                            대표 전화 <strong>053-000-0000</strong>
                        </li>
                        <li className={styles.listItem}>
                            상담 시간 <strong>평일 14:00~21:00</strong>
                        </li>
                    </ul>
                </Section>
            </div>
        );
    if (screen === "inquiry")
        return (
            <div className={styles.mobileContent}>
                <Section title="상담 문의">
                    <label className={styles.field}>
                        이름
                        <input placeholder="보호자 이름" />
                    </label>
                    <label className={styles.field}>
                        연락처
                        <input type="tel" placeholder="010-0000-0000" />
                    </label>
                    <label className={styles.field}>
                        문의 내용
                        <textarea placeholder="학년, 과목, 상담할 내용을 적어주세요" />
                    </label>
                    <Button primary className={styles.blockButton}>
                        문의 보내기
                    </Button>
                </Section>
            </div>
        );
    return (
        <div className={styles.mobileContent}>
            <AnnouncementRoller />
            <div className={styles.hero}>
                <h2>
                    성적은 기록하고,
                    <br />
                    성장은 함께 확인합니다
                </h2>
                <p>
                    출결부터 AI 학습 보고서까지 학부모와 밀착 소통하는
                    학원입니다.
                </p>
                <div className={styles.actions}>
                    <Button primary onClick={() => onNavigate("inquiry")}>
                        상담 문의
                    </Button>
                    <Button onClick={() => onNavigate("location")}>
                        학원 위치
                    </Button>
                </div>
            </div>
            <Section title="학원 프로그램">
                <Stats
                    items={[
                        ["중등 수학", "개념·심화", "소수 정예 반"],
                        ["중등 영어", "독해·문법", "주간 성취 기록"],
                        ["학습 관리", "AI 보고서", "학부모 정기 소통"],
                    ]}
                />
            </Section>
        </div>
    );
}

function Content({
    role,
    screen,
    onNavigate,
    selectedChildId,
}: {
    role: RoleKey;
    screen: string;
    onNavigate: (screen: string) => void;
    selectedChildId: string;
}) {
    if (role === "director") {
        if (screen === "dashboard") return <DirectorDashboard />;
        if (screen === "churn") return <Churn />;
        if (screen === "reports") return <Reports role={role} />;
        if (screen === "students") return <Students />;
        if (screen === "billing")
            return (
                <>
                    <Stats
                        items={[
                            ["발행", "48건", "7월 학원비·교재비"],
                            ["납부 완료", "43건", "수납률 89.6%"],
                            ["미납", "5건", "쪽지 재알림 가능"],
                        ]}
                    />
                    <Section>
                        <DataTable
                            headers={["학생", "유형", "금액", "납기", "상태"]}
                            rows={[
                                [
                                    "김O진",
                                    "학원비",
                                    "320,000원",
                                    "07.25",
                                    "납부",
                                ],
                                [
                                    "박O연",
                                    "교재비",
                                    "35,000원",
                                    "07.24",
                                    <Badge key="a">미납</Badge>,
                                ],
                            ]}
                        />
                    </Section>
                </>
            );
        return <Permissions />;
    }
    if (role === "teacher") {
        if (screen === "dashboard") return <TeacherDashboard />;
        if (screen === "attendance") return <Attendance role={role} />;
        if (screen === "reports") return <Reports role={role} />;
        if (screen === "students") return <Students />;
        return (
            <Section>
                <DataTable
                    headers={["학생", "최근 신호", "상태", "최근 상담"]}
                    rows={[
                        ["김O진", "연속 결석 2회", "상담 중", "07.26 전화"],
                        ["박O연", "성적 12점 하락", "위험 감지", "—"],
                    ]}
                />
            </Section>
        );
    }
    if (role === "parent") {
        if (screen === "dashboard") {
            return (
                <ParentDashboard
                    onNavigate={onNavigate}
                    selectedChildId={selectedChildId}
                />
            );
        }
        if (screen === "reports") return <Reports role={role} />;
        if (screen === "attendance") return <Attendance role={role} />;
        if (screen === "student-inbox") {
            return <MobileList role="student" screen="inbox" />;
        }
        return <MobileList role={role} screen={screen} />;
    }
    if (role === "student") {
        if (screen === "dashboard") return <StudentDashboard />;
        return <MobileList role={role} screen={screen} />;
    }
    return <Guest screen={screen} onNavigate={onNavigate} />;
}

export default function AcademyWireframe({
    initialRole = "director",
    initialScreenId,
    showPreviewControls = true,
}: {
    initialRole?: RoleKey;
    initialScreenId?: string;
    showPreviewControls?: boolean;
}) {
    const [roleKey, setRoleKey] = useState<RoleKey>(initialRole);
    const [screenId, setScreenId] = useState(
        initialScreenId ?? roles[initialRole].screens[0].id,
    );
    const [selectedChildId, setSelectedChildId] = useState(
        parentChildren[0].id,
    );
    const role = roles[roleKey];
    const screen = useMemo(
        () =>
            role.screens.find((item) => item.id === screenId) ??
            role.screens[0],
        [role, screenId],
    );

    function changeRole(nextRole: RoleKey) {
        setRoleKey(nextRole);
        setScreenId(roles[nextRole].screens[0].id);
    }

    return (
        <main className={styles.page}>
            {showPreviewControls && (
                <div className={styles.roleBar} aria-label="역할 선택">
                    <div className={styles.roleButtons}>
                        {(Object.keys(roles) as RoleKey[]).map((key) => (
                            <Button
                                key={key}
                                primary={key === roleKey}
                                aria-pressed={key === roleKey}
                                onClick={() => changeRole(key)}
                            >
                                {roles[key].label}
                            </Button>
                        ))}
                    </div>
                    <label className={styles.screenField}>
                        화면
                        <select
                            value={screen.id}
                            onChange={(event) =>
                                setScreenId(event.target.value)
                            }
                        >
                            {role.screens.map((item) => (
                                <option value={item.id} key={item.id}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            <section className={styles.shell} aria-live="polite">
                <header className={styles.topbar}>
                    <div className={styles.brandMark}>A</div>
                    <div className={styles.brandText}>
                        <strong>A학원</strong>
                        <span>{role.client}</span>
                    </div>
                    {roleKey === "parent" && (
                        <div
                            className={styles.headerChildToggle}
                            role="group"
                            aria-label="자녀 선택"
                        >
                            {parentChildren.map((child) => {
                                const selected = child.id === selectedChildId;
                                return (
                                    <button
                                        type="button"
                                        aria-pressed={selected}
                                        className={
                                            selected
                                                ? styles.headerChildToggleActive
                                                : styles.headerChildToggleButton
                                        }
                                        key={child.id}
                                        onClick={() =>
                                            setSelectedChildId(child.id)
                                        }
                                    >
                                        {child.name} · {child.grade}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {role.notification && (
                        <Button
                            className={styles.topButton}
                            aria-label={role.notification}
                        >
                            ◌ <span>{role.notification}</span>
                        </Button>
                    )}
                    <Link
                        href="/login"
                        className={`${styles.button} ${styles.topButton}`}
                        aria-label="로그인"
                    >
                        ○ <span>로그인</span>
                    </Link>
                    {roleKey === "guest" && (
                        <Link
                            href="/signup"
                            className={`${styles.button} ${styles.topButton} ${styles.signupButton}`}
                        >
                            회원가입
                        </Link>
                    )}
                </header>
                <div className={styles.body}>
                    <nav className={styles.sidebar} aria-label="주 메뉴">
                        {role.screens.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                className={
                                    item.id === screen.id
                                        ? styles.navActive
                                        : styles.navButton
                                }
                                aria-pressed={item.id === screen.id}
                                onClick={() => setScreenId(item.id)}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className={styles.content}>
                        <div
                            className={styles.contentStage}
                            key={`${roleKey}-${screen.id}-${selectedChildId}`}
                        >
                            <header className={styles.pageHead}>
                                <div>
                                    <span className={styles.eyebrow}>
                                        {role.label} 화면
                                    </span>
                                    <h1>{screen.label}</h1>
                                </div>
                                <div className={styles.actions}>
                                    {roleKey === "director" &&
                                        screen.id === "students" && (
                                            <Button primary>학생 등록</Button>
                                        )}
                                    {roleKey === "director" &&
                                        screen.id === "billing" && (
                                            <Button primary>청구 생성</Button>
                                        )}
                                    {roleKey === "director" &&
                                        screen.id === "reports" && (
                                            <Button primary>
                                                선택 승인·발송
                                            </Button>
                                        )}
                                    {roleKey === "director" &&
                                        screen.id === "churn" && (
                                            <Button>임계값 설정</Button>
                                        )}
                                </div>
                            </header>
                            <Content
                                role={roleKey}
                                screen={screen.id}
                                onNavigate={setScreenId}
                                selectedChildId={selectedChildId}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
