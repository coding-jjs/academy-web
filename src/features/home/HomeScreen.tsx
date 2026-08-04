"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./HomeScreen.module.css";

const notices = [
    { audience: "전체", title: "8월 학사 일정 및 휴원일 안내", date: "08.01" },
    { audience: "학부모", title: "2학기 학부모 정기 상담 신청 안내", date: "07.28" },
    { audience: "학생", title: "여름 집중 학습 프로그램 시간표 안내", date: "07.25" },
];

const banners = [
    {
        src: "/banners/new-semester-1080x1440.png",
        eyebrow: "NEW SEMESTER",
        title: "새 학기의 리듬을\n차근차근 만듭니다",
        description: "개념부터 심화까지, 학생의 속도에 맞춘 학습 설계",
        tone: "mint",
    },
    {
        src: "/banners/parent-consultation-1080x1440.png",
        eyebrow: "PARENT CONSULTING",
        title: "기록을 바탕으로\n함께 나누는 성장",
        description: "출결과 성취 기록을 연결한 정기 학습 상담",
        tone: "orange",
    },
    {
        src: "/banners/summer-intensive-1080x1440.png",
        eyebrow: "FOCUSED LEARNING",
        title: "몰입이 필요한 순간,\n빈틈 없이 깊게",
        description: "취약 단원을 발견하고 보완하는 집중 학습 프로그램",
        tone: "blue",
    },
] as const;

const programs = [
    {
        number: "01",
        title: "중등 수학",
        subtitle: "개념 · 유형 · 심화",
        detail: "진단 결과를 바탕으로 개념의 빈틈을 채우고 사고력을 확장합니다.",
    },
    {
        number: "02",
        title: "중등 영어",
        subtitle: "어휘 · 문법 · 독해",
        detail: "영역별 성취도를 기록하며 읽고 이해하는 힘을 균형 있게 기릅니다.",
    },
    {
        number: "03",
        title: "학습 관리",
        subtitle: "출결 · 성적 · 상담",
        detail: "수업 이후의 변화까지 기록하고 학생과 학부모에게 투명하게 공유합니다.",
    },
];

const steps = [
    ["진단", "현재 수준과 학습 습관을 살펴봅니다."],
    ["수업", "학생에게 필요한 목표와 수업을 설계합니다."],
    ["기록", "출결과 성취, 학습 과정을 꾸준히 기록합니다."],
    ["상담", "기록을 바탕으로 다음 성장을 함께 계획합니다."],
];

type HomeViewer = {
    name: string;
    roleLabel: string;
    dashboardHref: string;
};

export default function HomeScreen({ viewer }: { viewer: HomeViewer | null }) {
    const [noticeIndex, setNoticeIndex] = useState(0);
    const [bannerIndex, setBannerIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const timer = window.setInterval(() => {
            setNoticeIndex((current) => (current + 1) % notices.length);
        }, 4000);

        return () => window.clearInterval(timer);
    }, [isPaused]);

    useEffect(() => {
        if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const timer = window.setInterval(() => {
            setBannerIndex((current) => (current + 1) % banners.length);
        }, 6000);

        return () => window.clearInterval(timer);
    }, [isPaused]);

    const activeBanner = banners[bannerIndex];
    const moveNotice = (direction: 1 | -1) => {
        setNoticeIndex(
            (current) => (current + direction + notices.length) % notices.length,
        );
    };

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link href="/" className={styles.brand} aria-label="A학원 홈">
                    <span className={styles.brandMark}>A</span>
                    <span>
                        <strong>A학원</strong>
                        <small>ACADEMY</small>
                    </span>
                </Link>

                <nav className={styles.nav} aria-label="메인 메뉴">
                    <a href="#about">학원 소개</a>
                    <a href="#programs">교육 과정</a>
                    <a href="#process">학습 관리</a>
                    <Link href="/guest/inquiry">상담 문의</Link>
                </nav>

                <div className={styles.authActions}>
                    {viewer ? (
                        <>
                            <div className={styles.profileSummary} title={`${viewer.name} · ${viewer.roleLabel}`}>
                                <span className={styles.profileAvatar} aria-hidden="true">
                                    {viewer.name.slice(0, 1)}
                                </span>
                                <span className={styles.profileText}>
                                    <strong>{viewer.name}</strong>
                                    <small>{viewer.roleLabel}</small>
                                </span>
                            </div>
                            <Link href={viewer.dashboardHref} className={styles.dashboardButton}>
                                대시보드 <span aria-hidden="true">→</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={styles.loginButton}>
                                로그인
                            </Link>
                            <Link href="/signup" className={styles.signupButton}>
                                회원가입
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <section
                className={styles.noticeBar}
                aria-label="주요 공지사항"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocusCapture={() => setIsPaused(true)}
                onBlurCapture={() => setIsPaused(false)}
            >
                <div className={styles.noticeInner}>
                    <strong className={styles.noticeLabel}>NOTICE</strong>
                    <div className={styles.noticeContent} aria-live="polite">
                        <span>{notices[noticeIndex].audience}</span>
                        <p>{notices[noticeIndex].title}</p>
                        <time>{notices[noticeIndex].date}</time>
                    </div>
                    <div className={styles.noticeControls}>
                        <button type="button" onClick={() => moveNotice(-1)} aria-label="이전 공지">
                            ↑
                        </button>
                        <span>{String(noticeIndex + 1).padStart(2, "0")} / 03</span>
                        <button type="button" onClick={() => moveNotice(1)} aria-label="다음 공지">
                            ↓
                        </button>
                    </div>
                </div>
            </section>

            <section
                className={styles.hero}
                id="about"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onFocusCapture={() => setIsPaused(true)}
                onBlurCapture={() => setIsPaused(false)}
            >
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}>LEARN · RECORD · GROW</p>
                    <h1>
                        <span className={styles.heroLine}>
                            배움의 오늘을 <span className={styles.mobileLine}>기록하고,</span>
                        </span>
                        <span className={styles.heroLine}>
                            내일의 성장을 <span className={styles.mobileLine}>만듭니다</span>
                        </span>
                    </h1>
                    <p className={styles.heroDescription}>
                        A학원은 수업만 제공하지 않습니다. 학생의 과정과 변화를
                        세심하게 기록하고, 가정과 함께 다음 걸음을 설계합니다.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/guest/inquiry" className={styles.primaryButton}>
                            상담 신청하기 <span aria-hidden="true">→</span>
                        </Link>
                        <Link href="/login" className={styles.textButton}>
                            학부모 · 학생 로그인
                        </Link>
                    </div>
                    <div className={styles.heroSummary}>
                        <span>수업</span><i aria-hidden="true" />
                        <span>기록</span><i aria-hidden="true" />
                        <span>소통</span><i aria-hidden="true" />
                        <span>성장</span>
                    </div>
                </div>

                <div className={`${styles.visual} ${styles[activeBanner.tone]}`}>
                    {banners.map((banner, index) => (
                        <Image
                            key={banner.src}
                            src={banner.src}
                            alt={banner.description}
                            width={1080}
                            height={1440}
                            priority={index === 0}
                            className={index === bannerIndex ? styles.imageActive : styles.image}
                            aria-hidden={index !== bannerIndex}
                        />
                    ))}
                    <div className={styles.visualCopy}>
                        <span>{activeBanner.eyebrow}</span>
                        <h2>{activeBanner.title}</h2>
                        <p>{activeBanner.description}</p>
                    </div>
                    <div className={styles.bannerControls} aria-label="메인 배너 선택">
                        {banners.map((banner, index) => (
                            <button
                                key={banner.src}
                                type="button"
                                className={index === bannerIndex ? styles.dotActive : styles.dot}
                                onClick={() => setBannerIndex(index)}
                                aria-label={`${index + 1}번 배너 보기`}
                                aria-current={index === bannerIndex}
                            />
                        ))}
                        <button
                            type="button"
                            className={styles.pauseButton}
                            onClick={() => setIsPaused((current) => !current)}
                            aria-label={isPaused ? "자동 전환 시작" : "자동 전환 멈춤"}
                        >
                            {isPaused ? "▶" : "Ⅱ"}
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.quickLinks} aria-label="빠른 메뉴">
                <div>
                    <span>FOR FAMILY</span>
                    <h2>오늘의 배움을 바로 확인하세요</h2>
                </div>
                <Link href="/login">
                    <small>학부모</small>
                    자녀의 출결과 학습 기록
                    <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/login">
                    <small>학생</small>
                    나의 시간표와 성적
                    <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/guest/inquiry">
                    <small>게스트</small>
                    입학 및 수업 상담
                    <span aria-hidden="true">↗</span>
                </Link>
            </section>

            <section className={styles.section} id="programs">
                <div className={styles.sectionHeading}>
                    <p>PROGRAM</p>
                    <h2>이해하고, 적용하고,<br />스스로 설명하는 수업</h2>
                    <span>학생마다 다른 출발점과 속도를 존중합니다.</span>
                </div>
                <div className={styles.programGrid}>
                    {programs.map((program) => (
                        <article key={program.number} className={styles.programCard}>
                            <span>{program.number}</span>
                            <div>
                                <small>{program.subtitle}</small>
                                <h3>{program.title}</h3>
                                <p>{program.detail}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.process} id="process">
                <div className={styles.processIntro}>
                    <p>LEARNING JOURNEY</p>
                    <h2>성장은 보이지 않는 순간에도 이어집니다</h2>
                    <span>
                        감이 아닌 기록으로 학생을 이해하고, 필요한 순간에 함께합니다.
                    </span>
                </div>
                <ol className={styles.stepList}>
                    {steps.map(([title, detail], index) => (
                        <li key={title}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{title}</strong>
                            <p>{detail}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.finalCta}>
                <p>START TOGETHER</p>
                <h2>우리 아이에게 맞는 배움,<br />상담에서 시작해 보세요</h2>
                <Link href="/guest/inquiry" className={styles.lightButton}>
                    상담 문의 남기기 <span aria-hidden="true">→</span>
                </Link>
            </section>

            <footer className={styles.footer}>
                <div className={styles.footerBrand}>
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </div>
                <div>
                    <p>학생의 배움과 성장을 함께 기록합니다.</p>
                    <p>© 2026 A Academy. All rights reserved.</p>
                </div>
                <nav aria-label="하단 메뉴">
                    <Link href="/guest/inquiry">상담 문의</Link>
                    <Link href="/login">로그인</Link>
                    <Link href="/signup">회원가입</Link>
                </nav>
            </footer>
        </main>
    );
}
