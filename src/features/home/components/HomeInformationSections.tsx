/**
 * 공개 홈 하단 빠른 메뉴·과정·학습 여정·오시는 길·푸터다.
 *
 * 호출: `HomeScreen`. 정적 안내만 그리며, 상담·로그인은 링크로만 연결한다.
 * 역할 대시보드 카드가 아니다. 학부모/학생 빠른 메뉴도 `/login`으로 보낸다.
 *
 * 의도적으로 하지 않는 일:
 * - 세션별 UI. 로그인 여부는 Header가 담당한다.
 * - 지도 좌표 계산. embed URL은 고정이다.
 *
 * 관련: `content.ts`의 `ACADEMY_PROGRAMS`, `LEARNING_STEPS`.
 */

import Link from "next/link";
import { ACADEMY_PROGRAMS, LEARNING_STEPS } from "@/features/home/content";
import {
    buttonStyles,
    cx,
    pageHeadingStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import styles from "../HomeScreen.module.css";

/** 과정 카드·여정 4단계·지도·푸터. 데이터는 content.ts 상수. */
export default function HomeInformationSections() {
    return (
        <>
            <section className={styles.quickLinks} aria-label="빠른 메뉴">
                <div className={cx(surfaceStyles.root, styles.quickLinksIntro)}>
                    <span className={pageHeadingStyles.eyebrowBlock}>FOR FAMILY</span>
                    <h2>오늘의 배움을 바로 확인하세요</h2>
                </div>
                <Link href="/login" className={cx(surfaceStyles.root, styles.quickLinkCard)}>
                    <small className={typographyStyles.muted}>학부모</small>자녀의 출결과 학습 기록
                    <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/login" className={cx(surfaceStyles.root, styles.quickLinkCard)}>
                    <small className={typographyStyles.muted}>학생</small>나의 시간표와 성적
                    <span aria-hidden="true">↗</span>
                </Link>
                <Link href="/guest/inquiry" className={cx(surfaceStyles.root, styles.quickLinkCard)}>
                    <small className={typographyStyles.muted}>게스트</small>입학 및 수업 상담
                    <span aria-hidden="true">↗</span>
                </Link>
            </section>
            <section className={styles.section} id="programs">
                <div className={styles.sectionHeading}>
                    <p className={pageHeadingStyles.eyebrowBlock}>PROGRAM</p>
                    <h2>
                        이해하고, 적용하고,
                        <br />
                        스스로 설명하는 수업
                    </h2>
                    <span className={cx(typographyStyles.hint, styles.sectionLead)}>
                        학생마다 다른 출발점과 속도를 존중합니다.
                    </span>
                </div>
                <div className={styles.programGrid}>
                    {ACADEMY_PROGRAMS.map((program) => (
                        <article
                            key={program.number}
                            className={cx(surfaceStyles.root, styles.programCard)}
                        >
                            <span className={pageHeadingStyles.eyebrow}>{program.number}</span>
                            <div>
                                <small className={typographyStyles.muted}>{program.subtitle}</small>
                                <h3>{program.title}</h3>
                                <p className={typographyStyles.hint}>{program.detail}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <section className={styles.process} id="process">
                <div className={styles.processIntro}>
                    <p className={pageHeadingStyles.eyebrowBlock}>LEARNING JOURNEY</p>
                    <h2>성장은 보이지 않는 순간에도 이어집니다</h2>
                    <span className={cx(typographyStyles.hint, styles.processLead)}>
                        감이 아닌 기록으로 학생을 이해하고, 필요한 순간에
                        함께합니다.
                    </span>
                </div>
                <ol className={styles.stepList}>
                    {LEARNING_STEPS.map(([title, detail], index) => (
                        <li key={title}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{title}</strong>
                            <p className={typographyStyles.hint}>{detail}</p>
                        </li>
                    ))}
                </ol>
            </section>
            <section id="location" className={cx(surfaceStyles.root, styles.location)} aria-labelledby="location-heading">
                <div className={styles.locationGrid}>
                    <div className={styles.locationInfo}>
                        <p className={pageHeadingStyles.eyebrowBlock}>VISIT</p>
                        <h2 id="location-heading">오시는 길</h2>
                        <p className={cx(typographyStyles.hint, styles.locationLead)}>
                            기록과 상담이 이어지는 배움의 공간으로 초대합니다.
                        </p>
                        <dl className={styles.locationMeta}>
                            <div>
                                <dt className={typographyStyles.muted}>주소</dt>
                                <dd>대구광역시 수성구 알파시티1로 170 · A학원</dd>
                            </div>
                            <div>
                                <dt className={typographyStyles.muted}>연락</dt>
                                <dd>053-000-0000</dd>
                            </div>
                            <div>
                                <dt className={typographyStyles.muted}>안내</dt>
                                <dd>수성알파시티 인근 · 방문 전 상담 예약 권장</dd>
                            </div>
                        </dl>
                        <div className={styles.locationActions}>
                            <a
                                className={cx(
                                    buttonStyles.ctaDark,
                                    styles.locationActionBtn,
                                )}
                                href="https://www.google.com/maps/search/?api=1&query=대구광역시+수성구+알파시티1로+170"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                길찾기 열기 <span aria-hidden="true">↗</span>
                            </a>
                            <Link
                                href="/guest/inquiry"
                                className={cx(
                                    buttonStyles.ctaMuted,
                                    styles.locationActionBtn,
                                )}
                            >
                                상담 문의
                            </Link>
                        </div>
                    </div>
                    <div className={styles.map}>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m5!3m3!1m2!1s0x356609911e108f93%3A0xd41b28115963e05a!2z64yA6rWs65SU7KeA7YS47ZiB7Iug7KeE7Z2l7JuQ!5e0!3m2!1sko!2skr!4v1786500523158!5m2!1sko!2skr"
                            title="A학원 오시는 길"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                        />
                    </div>
                </div>
            </section>
            <section className={styles.finalCta}>
                <p className={cx(pageHeadingStyles.eyebrowBlock, styles.finalCtaEyebrow)}>
                    START TOGETHER
                </p>
                <h2>
                    우리 아이에게 맞는 배움,
                    <br />
                    상담에서 시작해 보세요
                </h2>
                <Link
                    href="/guest/inquiry"
                    className={cx(buttonStyles.cta, styles.finalCtaButton)}
                >
                    상담 문의 남기기 <span aria-hidden="true">→</span>
                </Link>
            </section>
            <footer className={styles.footer}>
                <div className={styles.footerBrand}>
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </div>
                <div>
                    <p className={typographyStyles.muted}>학생의 배움과 성장을 함께 기록합니다.</p>
                    <p className={typographyStyles.muted}>© 2026 A Academy. All rights reserved.</p>
                </div>
                <nav aria-label="하단 메뉴">
                    <Link href="/guest/inquiry">상담 문의</Link>
                    <Link href="/login">로그인</Link>
                    <Link href="/signup">회원가입</Link>
                </nav>
            </footer>
        </>
    );
}
