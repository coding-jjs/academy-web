"use client"; // 클라이언트 상태. 서버 사실 조회는 API.

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

import Image from "next/image"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import Link from "next/link"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import { useEffect, useState } from "react"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import { HOME_BANNERS } from "@/features/home/content"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import type { Notice } from "@/features/notices/types"; // 타입만. 공개 마케팅 홈. 역할 대시보드 아님.
import { buttonStyles, cx, pageHeadingStyles, surfaceStyles, typographyStyles } from "@/components/ui/shared-styles"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import styles from "../HomeScreen.module.css"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.

/**
 * 공지 4초·배너 6초 순환. 호버/포커스면 멈춘다.
 */
export default function HomeShowcase({ // HomeShowcase. 공개 마케팅 홈. 역할 대시보드 아님.
    notices, // 공개 마케팅 홈. 역할 대시보드 아님.
}: { // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
    notices: Notice[]; // notices. 공개 마케팅 홈. 역할 대시보드 아님.
}) { // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
    const [noticeIndex, setNoticeIndex] = useState(0); // 공지 4초·배너 6초 순환. 역할 대시보드가 아니라 공개 마케팅 히어로.
    const [bannerIndex, setBannerIndex] = useState(0); // [bannerIndex, setBannerIndex]. 공개 마케팅 홈. 역할 대시보드 아님.
    const [isPaused, setIsPaused] = useState(false); // [isPaused, setIsPaused]. 공개 마케팅 홈. 역할 대시보드 아님.

    useAutoAdvance({ // 공지 4초. 한 장이거나 일시정지면 타이머를 안 건다.
        isPaused, // 공개 마케팅 홈. 역할 대시보드 아님.
        interval: 4000, // interval. 공개 마케팅 홈. 역할 대시보드 아님.
        itemCount: notices.length, // itemCount. 공개 마케팅 홈. 역할 대시보드 아님.
        setIndex: setNoticeIndex, // setIndex. 공개 마케팅 홈. 역할 대시보드 아님.
    });
    useAutoAdvance({ // 배너 6초. content.ts HOME_BANNERS.
        isPaused, // 공개 마케팅 홈. 역할 대시보드 아님.
        interval: 6000, // interval. 공개 마케팅 홈. 역할 대시보드 아님.
        itemCount: HOME_BANNERS.length, // itemCount. 공개 마케팅 홈. 역할 대시보드 아님.
        setIndex: setBannerIndex, // setIndex. 공개 마케팅 홈. 역할 대시보드 아님.
    });

    const activeBanner = HOME_BANNERS[bannerIndex]; // activeBanner. 공개 마케팅 홈. 역할 대시보드 아님.
    const activeNotice = notices[noticeIndex] ?? null; // activeNotice. 공개 마케팅 홈. 역할 대시보드 아님.
    const pauseEvents = { // 마우스·키보드 포커스가 영역 안에 있으면 자동 넘김을 멈춘다.
        onMouseEnter: () => setIsPaused(true), // onMouseEnter. 공개 마케팅 홈. 역할 대시보드 아님.
        onMouseLeave: () => setIsPaused(false), // onMouseLeave. 공개 마케팅 홈. 역할 대시보드 아님.
        onFocusCapture: () => setIsPaused(true), // onFocusCapture. 공개 마케팅 홈. 역할 대시보드 아님.
        onBlurCapture: () => setIsPaused(false), // onBlurCapture. 공개 마케팅 홈. 역할 대시보드 아님.
    };

    function moveNotice(direction: 1 | -1) { // moveNotice. 공개 마케팅 홈. 역할 대시보드 아님.
        if (notices.length === 0) return; // 가드. 공개 마케팅 홈. 역할 대시보드 아님.
        setNoticeIndex( // 양끝에서 반대편으로. 빈 목록이면 위에서 return.
            (current) => // 공개 마케팅 홈. 역할 대시보드 아님.
                (current + direction + notices.length) % notices.length, // 공개 마케팅 홈. 역할 대시보드 아님.
        );
    }

    return ( // 반환. 공개 마케팅 홈. 역할 대시보드 아님.
        <> // 요소. 공개 마케팅 홈. 역할 대시보드 아님.
            <section // section. 공개 마케팅 홈. 역할 대시보드 아님.
                className={styles.noticeBar} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                aria-label="주요 공지사항" // 공개 마케팅 홈. 역할 대시보드 아님.
                {...pauseEvents} // 표현식. 공개 마케팅 홈. 역할 대시보드 아님.
            > {/* CRUD가 아니라 props 목록만 순환. 클릭은 /notices. */}
                <div className={styles.noticeInner}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <strong className={cx(pageHeadingStyles.sectionLabel, styles.noticeLabel)}> // strong. 공개 마케팅 홈. 역할 대시보드 아님.
                        NOTICE // 공개 마케팅 홈. 역할 대시보드 아님.
                    </strong> // strong 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <Link // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                        href="/notices" // 공개 마케팅 홈. 역할 대시보드 아님.
                        className={styles.noticeContent} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        aria-live="polite" // 공개 마케팅 홈. 역할 대시보드 아님.
                    > // 블록 끝.
                        {activeNotice ? ( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                            <> // 요소. 공개 마케팅 홈. 역할 대시보드 아님.
                                <span>{activeNotice.audience}</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                                <p>{activeNotice.title}</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                                <time className={typographyStyles.muted}>{activeNotice.date}</time> // time. 공개 마케팅 홈. 역할 대시보드 아님.
                            </> // 요소 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        ) : ( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                            <> // 요소. 공개 마케팅 홈. 역할 대시보드 아님.
                                <span>전체</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                                <p>등록된 공지가 없습니다</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                                <time className={typographyStyles.muted}>—</time> // time. 공개 마케팅 홈. 역할 대시보드 아님.
                            </> // 요소 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        )}
                    </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <div className={styles.noticeControls}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        <button // button. 공개 마케팅 홈. 역할 대시보드 아님.
                            type="button" // 공개 마케팅 홈. 역할 대시보드 아님.
                            onClick={() => moveNotice(-1)} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            aria-label="이전 공지" // 공개 마케팅 홈. 역할 대시보드 아님.
                            disabled={notices.length === 0} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        > // 블록 끝.
                            ↑ // 공개 마케팅 홈. 역할 대시보드 아님.
                        </button> // button 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span className={typographyStyles.muted}> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                            {String( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                                notices.length === 0 ? 0 : noticeIndex + 1, // 공개 마케팅 홈. 역할 대시보드 아님.
                            ).padStart(2, "0")}{" "} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            / {String(notices.length).padStart(2, "0")} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        </span> // span 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        <button // button. 공개 마케팅 홈. 역할 대시보드 아님.
                            type="button" // 공개 마케팅 홈. 역할 대시보드 아님.
                            onClick={() => moveNotice(1)} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            aria-label="다음 공지" // 공개 마케팅 홈. 역할 대시보드 아님.
                            disabled={notices.length === 0} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        > // 블록 끝.
                            ↓ // 공개 마케팅 홈. 역할 대시보드 아님.
                        </button> // button 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            <section className={styles.hero} id="about" {...pauseEvents}> {/* CTA는 상담·로그인. 역할 홈 집계는 그리지 않는다. */}
                <div className={cx(surfaceStyles.root, styles.heroCopy)}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <p className={pageHeadingStyles.eyebrowBlock}>LEARN · RECORD · GROW</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                    <h1> // h1. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span className={styles.heroLine}> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                            배움의 오늘을{" "} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            <span className={styles.mobileLine}>기록하고,</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        </span> // span 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span className={styles.heroLine}> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                            내일의 성장을{" "} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            <span className={styles.mobileLine}>만듭니다</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        </span> // span 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    </h1> // h1 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <p className={cx(typographyStyles.hint, styles.heroDescription)}> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                        A학원은 수업만 제공하지 않습니다. 학생의 과정과 변화를 // 공개 마케팅 홈. 역할 대시보드 아님.
                        세심하게 기록하고, 가정과 함께 다음 걸음을 설계합니다. // 공개 마케팅 홈. 역할 대시보드 아님.
                    </p> // p 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <div className={styles.heroActions}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        <Link // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                            href="/guest/inquiry" // 공개 마케팅 홈. 역할 대시보드 아님.
                            className={cx(buttonStyles.cta, styles.heroCta)} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        > // 블록 끝.
                            상담 신청하기 <span aria-hidden="true">→</span> // 공개 마케팅 홈. 역할 대시보드 아님.
                        </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        <Link href="/login" className={styles.textButton}> // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                            학부모 · 학생 로그인 // 공개 마케팅 홈. 역할 대시보드 아님.
                        </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <div className={cx(typographyStyles.muted, styles.heroSummary)}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span>수업</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        <i aria-hidden="true" /> // i. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span>기록</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        <i aria-hidden="true" /> // i. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span>소통</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        <i aria-hidden="true" /> // i. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span>성장</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <div className={cx(surfaceStyles.root, styles.visual, styles[activeBanner.tone])}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    {HOME_BANNERS.map((banner, index) => ( // 세 장을 모두 마운트하고 CSS로만 활성 장을 보여 전환 깜빡임을 줄인다.
                        <Image // Image. 공개 마케팅 홈. 역할 대시보드 아님.
                            key={banner.src} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            src={banner.src} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            alt={banner.description} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            width={1080} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            height={1440} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            priority={index === 0} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            className={ // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                                index === bannerIndex // 공개 마케팅 홈. 역할 대시보드 아님.
                                    ? styles.imageActive // 삼항. 공개 마케팅 홈. 역할 대시보드 아님.
                                    : styles.image // 삼항 나머지. 공개 마케팅 홈. 역할 대시보드 아님.
                            }
                            aria-hidden={index !== bannerIndex} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        /> // 블록 끝.
                    ))}
                    <div className={styles.visualCopy}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        <span>{activeBanner.eyebrow}</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        <h2>{activeBanner.title}</h2> // h2. 공개 마케팅 홈. 역할 대시보드 아님.
                        <p>{activeBanner.description}</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <div // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        className={styles.bannerControls} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        aria-label="메인 배너 선택" // 공개 마케팅 홈. 역할 대시보드 아님.
                    > // 블록 끝.
                        {HOME_BANNERS.map((banner, index) => ( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                            <button // button. 공개 마케팅 홈. 역할 대시보드 아님.
                                key={banner.src} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                                type="button" // 공개 마케팅 홈. 역할 대시보드 아님.
                                className={ // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                                    index === bannerIndex // 공개 마케팅 홈. 역할 대시보드 아님.
                                        ? styles.dotActive // 삼항. 공개 마케팅 홈. 역할 대시보드 아님.
                                        : styles.dot // 삼항 나머지. 공개 마케팅 홈. 역할 대시보드 아님.
                                }
                                onClick={() => setBannerIndex(index)} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                                aria-label={`${index + 1}번 배너 보기`} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                                aria-current={index === bannerIndex} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            /> // 블록 끝.
                        ))}
                        <button // button. 공개 마케팅 홈. 역할 대시보드 아님.
                            type="button" // 공개 마케팅 홈. 역할 대시보드 아님.
                            className={styles.pauseButton} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            onClick={() => // 공개 마케팅 홈. 역할 대시보드 아님.
                                setIsPaused((current) => !current) // 공개 마케팅 홈. 역할 대시보드 아님.
                            }
                            aria-label={ // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                                isPaused ? "자동 전환 시작" : "자동 전환 멈춤" // 공개 마케팅 홈. 역할 대시보드 아님.
                            }
                        > // 호출 끝.
                            {isPaused ? "▶" : "Ⅱ"} // 표현식. 공개 마케팅 홈. 역할 대시보드 아님.
                        </button> // button 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
        </> // 요소 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
    );
}

/** itemCount<=1·일시정지·reduced-motion이면 타이머를 안 건다. */
function useAutoAdvance({ // useAutoAdvance. 공개 마케팅 홈. 역할 대시보드 아님.
    isPaused, // 공개 마케팅 홈. 역할 대시보드 아님.
    interval, // 공개 마케팅 홈. 역할 대시보드 아님.
    itemCount, // 공개 마케팅 홈. 역할 대시보드 아님.
    setIndex, // 공개 마케팅 홈. 역할 대시보드 아님.
}: { // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
    isPaused: boolean; // isPaused. 공개 마케팅 홈. 역할 대시보드 아님.
    interval: number; // interval. 공개 마케팅 홈. 역할 대시보드 아님.
    itemCount: number; // itemCount. 공개 마케팅 홈. 역할 대시보드 아님.
    setIndex: React.Dispatch<React.SetStateAction<number>>; // setIndex. 공개 마케팅 홈. 역할 대시보드 아님.
}) { // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
    useEffect(() => { // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
        if ( // 가드. 공개 마케팅 홈. 역할 대시보드 아님.
            itemCount <= 1 || // 공개 마케팅 홈. 역할 대시보드 아님.
            isPaused || // 공개 마케팅 홈. 역할 대시보드 아님.
            window.matchMedia("(prefers-reduced-motion: reduce)").matches // 공개 마케팅 홈. 역할 대시보드 아님.
        ) { // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
            return; // 한 장이거나 일시정지·reduced-motion이면 interval을 만들지 않는다.
        }
        const timer = window.setInterval( // 다음 인덱스로 순환. unmount 시 clear.
            () => setIndex((current) => (current + 1) % itemCount), // 공개 마케팅 홈. 역할 대시보드 아님.
            interval, // 공개 마케팅 홈. 역할 대시보드 아님.
        );
        return () => window.clearInterval(timer); // 반환. 공개 마케팅 홈. 역할 대시보드 아님.
    }, [interval, isPaused, itemCount, setIndex]); // 블록 끝.
}
