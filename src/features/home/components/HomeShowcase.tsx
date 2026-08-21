"use client";

/**
 * 공개 홈의 공지 바·히어로·순환 배너 영역이다.
 *
 * 호출: `HomeScreen`. 자동 전환은 클라이언트에서만 돌리고, 카피는 `content.ts`를 쓴다.
 * 역할 대시보드가 아니다. 공지 클릭은 `/notices`, CTA는 상담·로그인.
 *
 * 의도적으로 하지 않는 일:
 * - 공지 CRUD. props로 받은 목록만 순환한다.
 * - reduced-motion이면 interval을 걸지 않는다.
 *
 * 관련: `HOME_BANNERS`, `features/notices/types`.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HOME_BANNERS } from "@/features/home/content";
import type { Notice } from "@/features/notices/types";
import { buttonStyles, cx, pageHeadingStyles, surfaceStyles, typographyStyles } from "@/components/ui/shared-styles";
import styles from "../HomeScreen.module.css";

/**
 * 공지 4초·배너 6초 순환. 호버/포커스면 멈춘다.
 */
export default function HomeShowcase({
    notices,
}: {
    notices: Notice[];
}) {
    const [noticeIndex, setNoticeIndex] = useState(0);
    const [bannerIndex, setBannerIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useAutoAdvance({
        isPaused,
        interval: 4000,
        itemCount: notices.length,
        setIndex: setNoticeIndex,
    });
    useAutoAdvance({
        isPaused,
        interval: 6000,
        itemCount: HOME_BANNERS.length,
        setIndex: setBannerIndex,
    });

    const activeBanner = HOME_BANNERS[bannerIndex];
    const activeNotice = notices[noticeIndex] ?? null;
    const pauseEvents = {
        onMouseEnter: () => setIsPaused(true),
        onMouseLeave: () => setIsPaused(false),
        onFocusCapture: () => setIsPaused(true),
        onBlurCapture: () => setIsPaused(false),
    };

    function moveNotice(direction: 1 | -1) {
        if (notices.length === 0) return;
        setNoticeIndex(
            (current) =>
                (current + direction + notices.length) % notices.length,
        );
    }

    return (
        <>
            <section
                className={styles.noticeBar}
                aria-label="주요 공지사항"
                {...pauseEvents}
            >
                <div className={styles.noticeInner}>
                    <strong className={cx(pageHeadingStyles.sectionLabel, styles.noticeLabel)}>
                        NOTICE
                    </strong>
                    <Link
                        href="/notices"
                        className={styles.noticeContent}
                        aria-live="polite"
                    >
                        {activeNotice ? (
                            <>
                                <span>{activeNotice.audience}</span>
                                <p>{activeNotice.title}</p>
                                <time className={typographyStyles.muted}>{activeNotice.date}</time>
                            </>
                        ) : (
                            <>
                                <span>전체</span>
                                <p>등록된 공지가 없습니다</p>
                                <time className={typographyStyles.muted}>—</time>
                            </>
                        )}
                    </Link>
                    <div className={styles.noticeControls}>
                        <button
                            type="button"
                            onClick={() => moveNotice(-1)}
                            aria-label="이전 공지"
                            disabled={notices.length === 0}
                        >
                            ↑
                        </button>
                        <span className={typographyStyles.muted}>
                            {String(
                                notices.length === 0 ? 0 : noticeIndex + 1,
                            ).padStart(2, "0")}
                            / {String(notices.length).padStart(2, "0")}
                        </span>
                        <button
                            type="button"
                            onClick={() => moveNotice(1)}
                            aria-label="다음 공지"
                            disabled={notices.length === 0}
                        >
                            ↓
                        </button>
                    </div>
                </div>
            </section>
            <section className={styles.hero} id="about" {...pauseEvents}>
                <div className={cx(surfaceStyles.root, styles.heroCopy)}>
                    <p className={pageHeadingStyles.eyebrowBlock}>LEARN · RECORD · GROW</p>
                    <h1>
                        <span className={styles.heroLine}>
                            배움의 오늘을
                            <span className={styles.mobileLine}>기록하고,</span>
                        </span>
                        <span className={styles.heroLine}>
                            내일의 성장을
                            <span className={styles.mobileLine}>만듭니다</span>
                        </span>
                    </h1>
                    <p className={cx(typographyStyles.hint, styles.heroDescription)}>
                        A학원은 수업만 제공하지 않습니다. 학생의 과정과 변화를
                        세심하게 기록하고, 가정과 함께 다음 걸음을 설계합니다.
                    </p>
                    <div className={styles.heroActions}>
                        <Link
                            href="/guest/inquiry"
                            className={cx(buttonStyles.cta, styles.heroCta)}
                        >
                            상담 신청하기 <span aria-hidden="true">→</span>
                        </Link>
                        <Link href="/login" className={styles.textButton}>
                            학부모 · 학생 로그인
                        </Link>
                    </div>
                    <div className={cx(typographyStyles.muted, styles.heroSummary)}>
                        <span>수업</span>
                        <i aria-hidden="true" />
                        <span>기록</span>
                        <i aria-hidden="true" />
                        <span>소통</span>
                        <i aria-hidden="true" />
                        <span>성장</span>
                    </div>
                </div>
                <div className={cx(surfaceStyles.root, styles.visual, styles[activeBanner.tone])}>
                    {HOME_BANNERS.map((banner, index) => (
                        <Image
                            key={banner.src}
                            src={banner.src}
                            alt={banner.description}
                            width={1080}
                            height={1440}
                            priority={index === 0}
                            className={
                                index === bannerIndex
                                    ? styles.imageActive
                                    : styles.image
                            }
                            aria-hidden={index !== bannerIndex}
                        />
                    ))}
                    <div className={styles.visualCopy}>
                        <span>{activeBanner.eyebrow}</span>
                        <h2>{activeBanner.title}</h2>
                        <p>{activeBanner.description}</p>
                    </div>
                    <div
                        className={styles.bannerControls}
                        aria-label="메인 배너 선택"
                    >
                        {HOME_BANNERS.map((banner, index) => (
                            <button
                                key={banner.src}
                                type="button"
                                className={
                                    index === bannerIndex
                                        ? styles.dotActive
                                        : styles.dot
                                }
                                onClick={() => setBannerIndex(index)}
                                aria-label={`${index + 1}번 배너 보기`}
                                aria-current={index === bannerIndex}
                            />
                        ))}
                        <button
                            type="button"
                            className={styles.pauseButton}
                            onClick={() =>
                                setIsPaused((current) => !current)
                            }
                            aria-label={
                                isPaused ? "자동 전환 시작" : "자동 전환 멈춤"
                            }
                        >
                            {isPaused ? "▶" : "Ⅱ"}
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}

/** itemCount<=1·일시정지·reduced-motion이면 타이머를 안 건다. */
function useAutoAdvance({
    isPaused,
    interval,
    itemCount,
    setIndex,
}: {
    isPaused: boolean;
    interval: number;
    itemCount: number;
    setIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
    useEffect(() => {
        if (
            itemCount <= 1 ||
            isPaused ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }
        const timer = window.setInterval(
            () => setIndex((current) => (current + 1) % itemCount),
            interval,
        );
        return () => window.clearInterval(timer);
    }, [interval, isPaused, itemCount, setIndex]);
}
