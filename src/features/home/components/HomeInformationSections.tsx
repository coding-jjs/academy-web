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

import Link from "next/link"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import { ACADEMY_PROGRAMS, LEARNING_STEPS } from "@/features/home/content"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
import { // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.
    buttonStyles, // 공개 마케팅 홈. 역할 대시보드 아님.
    cx, // 공개 마케팅 홈. 역할 대시보드 아님.
    pageHeadingStyles, // 공개 마케팅 홈. 역할 대시보드 아님.
    surfaceStyles, // 공개 마케팅 홈. 역할 대시보드 아님.
    typographyStyles, // 공개 마케팅 홈. 역할 대시보드 아님.
} from "@/components/ui/shared-styles"; // 공개 마케팅 홈. 역할 대시보드 아님.
import styles from "../HomeScreen.module.css"; // 의존성. 공개 마케팅 홈. 역할 대시보드 아님.

/** 과정 카드·여정 4단계·지도·푸터. 데이터는 content.ts 상수. */
export default function HomeInformationSections() { // HomeInformationSections. 공개 마케팅 홈. 역할 대시보드 아님.
    return ( // 반환. 공개 마케팅 홈. 역할 대시보드 아님.
        <> // 요소. 공개 마케팅 홈. 역할 대시보드 아님.
            <section className={styles.quickLinks} aria-label="빠른 메뉴"> {/* 역할 홈이 아니라 공개 페이지라 로그인/상담으로 보낸다. */}
                <div className={cx(surfaceStyles.root, styles.quickLinksIntro)}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span className={pageHeadingStyles.eyebrowBlock}>FOR FAMILY</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                    <h2>오늘의 배움을 바로 확인하세요</h2> // h2. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <Link href="/login" className={cx(surfaceStyles.root, styles.quickLinkCard)}> {/* 학부모·학생 카드도 `/login`. 게스트는 상담 문의. */}
                    <small className={typographyStyles.muted}>학부모</small>자녀의 출결과 학습 기록 // small. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span aria-hidden="true">↗</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <Link href="/login" className={cx(surfaceStyles.root, styles.quickLinkCard)}> // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                    <small className={typographyStyles.muted}>학생</small>나의 시간표와 성적 // small. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span aria-hidden="true">↗</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <Link href="/guest/inquiry" className={cx(surfaceStyles.root, styles.quickLinkCard)}> // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                    <small className={typographyStyles.muted}>게스트</small>입학 및 수업 상담 // small. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span aria-hidden="true">↗</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            <section className={styles.section} id="programs"> {/* 교육 과정. content.ts 상수. 반 id가 아니라 표시용 순번. */}
                <div className={styles.sectionHeading}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <p className={pageHeadingStyles.eyebrowBlock}>PROGRAM</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                    <h2> // h2. 공개 마케팅 홈. 역할 대시보드 아님.
                        이해하고, 적용하고, // 공개 마케팅 홈. 역할 대시보드 아님.
                        <br /> // br. 공개 마케팅 홈. 역할 대시보드 아님.
                        스스로 설명하는 수업 // 공개 마케팅 홈. 역할 대시보드 아님.
                    </h2> // h2 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span className={cx(typographyStyles.hint, styles.sectionLead)}> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        학생마다 다른 출발점과 속도를 존중합니다. // 공개 마케팅 홈. 역할 대시보드 아님.
                    </span> // span 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <div className={styles.programGrid}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    {ACADEMY_PROGRAMS.map((program) => ( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                        <article // article. 공개 마케팅 홈. 역할 대시보드 아님.
                            key={program.number} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                            className={cx(surfaceStyles.root, styles.programCard)} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                        > // 블록 끝.
                            <span className={pageHeadingStyles.eyebrow}>{program.number}</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                            <div> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                                <small className={typographyStyles.muted}>{program.subtitle}</small> // small. 공개 마케팅 홈. 역할 대시보드 아님.
                                <h3>{program.title}</h3> // h3. 공개 마케팅 홈. 역할 대시보드 아님.
                                <p className={typographyStyles.hint}>{program.detail}</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                            </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        </article> // article 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    ))}
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            <section className={styles.process} id="process"> {/* 학습 여정 4단계. 역할 대시보드 카드가 아니다. */}
                <div className={styles.processIntro}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <p className={pageHeadingStyles.eyebrowBlock}>LEARNING JOURNEY</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                    <h2>성장은 보이지 않는 순간에도 이어집니다</h2> // h2. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span className={cx(typographyStyles.hint, styles.processLead)}> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                        감이 아닌 기록으로 학생을 이해하고, 필요한 순간에 // 공개 마케팅 홈. 역할 대시보드 아님.
                        함께합니다. // 공개 마케팅 홈. 역할 대시보드 아님.
                    </span> // span 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <ol className={styles.stepList}> // ol. 공개 마케팅 홈. 역할 대시보드 아님.
                    {LEARNING_STEPS.map(([title, detail], index) => ( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                        <li key={title}> // li. 공개 마케팅 홈. 역할 대시보드 아님.
                            <span>{String(index + 1).padStart(2, "0")}</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                            <strong>{title}</strong> // strong. 공개 마케팅 홈. 역할 대시보드 아님.
                            <p className={typographyStyles.hint}>{detail}</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                        </li> // li 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    ))}
                </ol> // ol 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            <section id="location" className={cx(surfaceStyles.root, styles.location)} aria-labelledby="location-heading"> {/* 지도 좌표 계산 없이 고정 embed URL. */}
                <div className={styles.locationGrid}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <div className={styles.locationInfo}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        <p className={pageHeadingStyles.eyebrowBlock}>VISIT</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                        <h2 id="location-heading">오시는 길</h2> // h2. 공개 마케팅 홈. 역할 대시보드 아님.
                        <p className={cx(typographyStyles.hint, styles.locationLead)}> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                            기록과 상담이 이어지는 배움의 공간으로 초대합니다. // 공개 마케팅 홈. 역할 대시보드 아님.
                        </p> // p 닫기. 공개 마케팅 홈. 역할 대시보드 아님.

                        <dl className={styles.locationMeta}> // dl. 공개 마케팅 홈. 역할 대시보드 아님.
                            <div> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                                <dt className={typographyStyles.muted}>주소</dt> // dt. 공개 마케팅 홈. 역할 대시보드 아님.
                                <dd>대구광역시 수성구 알파시티1로 170 · A학원</dd> // dd. 공개 마케팅 홈. 역할 대시보드 아님.
                            </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                            <div> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                                <dt className={typographyStyles.muted}>연락</dt> // dt. 공개 마케팅 홈. 역할 대시보드 아님.
                                <dd>053-000-0000</dd> // dd. 공개 마케팅 홈. 역할 대시보드 아님.
                            </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                            <div> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                                <dt className={typographyStyles.muted}>안내</dt> // dt. 공개 마케팅 홈. 역할 대시보드 아님.
                                <dd>수성알파시티 인근 · 방문 전 상담 예약 권장</dd> // dd. 공개 마케팅 홈. 역할 대시보드 아님.
                            </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        </dl> // dl 닫기. 공개 마케팅 홈. 역할 대시보드 아님.

                        <div className={styles.locationActions}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                            <a // a. 공개 마케팅 홈. 역할 대시보드 아님.
                                className={cx( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                                    buttonStyles.ctaDark, // 공개 마케팅 홈. 역할 대시보드 아님.
                                    styles.locationActionBtn, // 공개 마케팅 홈. 역할 대시보드 아님.
                                )}
                                href="https://www.google.com/maps/search/?api=1&query=대구광역시+수성구+알파시티1로+170" // 공개 마케팅 홈. 역할 대시보드 아님.
                                target="_blank" // 공개 마케팅 홈. 역할 대시보드 아님.
                                rel="noopener noreferrer" // 공개 마케팅 홈. 역할 대시보드 아님.
                            > // 블록 끝.
                                길찾기 열기 <span aria-hidden="true">↗</span> // 공개 마케팅 홈. 역할 대시보드 아님.
                            </a> // a 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                            <Link // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                                href="/guest/inquiry" // 공개 마케팅 홈. 역할 대시보드 아님.
                                className={cx( // 블록 시작. 공개 마케팅 홈. 역할 대시보드 아님.
                                    buttonStyles.ctaMuted, // 공개 마케팅 홈. 역할 대시보드 아님.
                                    styles.locationActionBtn, // 공개 마케팅 홈. 역할 대시보드 아님.
                                )}
                            > // 블록 끝.
                                상담 문의 // 공개 마케팅 홈. 역할 대시보드 아님.
                            </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                        </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.

                    <div className={styles.map}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                        <iframe // iframe. 공개 마케팅 홈. 역할 대시보드 아님.
                            src="https://www.google.com/maps/embed?pb=!1m5!3m3!1m2!1s0x356609911e108f93%3A0xd41b28115963e05a!2z64yA6rWs65SU7KeA7YS47ZiB7Iug7KeE7Z2l7JuQ!5e0!3m2!1sko!2skr!4v1786500523158!5m2!1sko!2skr" // 공개 마케팅 홈. 역할 대시보드 아님.
                            title="A학원 오시는 길" // 공개 마케팅 홈. 역할 대시보드 아님.
                            allowFullScreen // 공개 마케팅 홈. 역할 대시보드 아님.
                            loading="lazy" // 공개 마케팅 홈. 역할 대시보드 아님.
                            referrerPolicy="strict-origin-when-cross-origin" // 공개 마케팅 홈. 역할 대시보드 아님.
                        /> // 블록 끝.
                    </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            <section className={styles.finalCta}> {/* 세션별 UI가 아니라 게스트 문의 링크. */}
                <p className={cx(pageHeadingStyles.eyebrowBlock, styles.finalCtaEyebrow)}> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                    START TOGETHER // 공개 마케팅 홈. 역할 대시보드 아님.
                </p> // p 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <h2> // h2. 공개 마케팅 홈. 역할 대시보드 아님.
                    우리 아이에게 맞는 배움, // 공개 마케팅 홈. 역할 대시보드 아님.
                    <br /> // br. 공개 마케팅 홈. 역할 대시보드 아님.
                    상담에서 시작해 보세요 // 공개 마케팅 홈. 역할 대시보드 아님.
                </h2> // h2 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <Link // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                    href="/guest/inquiry" // 공개 마케팅 홈. 역할 대시보드 아님.
                    className={cx(buttonStyles.cta, styles.finalCtaButton)} // 블록 끝. 공개 마케팅 홈. 역할 대시보드 아님.
                > // 블록 끝.
                    상담 문의 남기기 <span aria-hidden="true">→</span> // 공개 마케팅 홈. 역할 대시보드 아님.
                </Link> // Link 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </section> // section 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            <footer className={styles.footer}> {/* 상담·로그인·가입만. 역할 홈 링크는 헤더 dashboardHref. */}
                <div className={styles.footerBrand}> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <span className={styles.brandMark}>A</span> // span. 공개 마케팅 홈. 역할 대시보드 아님.
                    <strong>A학원</strong> // strong. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <div> // div. 공개 마케팅 홈. 역할 대시보드 아님.
                    <p className={typographyStyles.muted}>학생의 배움과 성장을 함께 기록합니다.</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                    <p className={typographyStyles.muted}>© 2026 A Academy. All rights reserved.</p> // p. 공개 마케팅 홈. 역할 대시보드 아님.
                </div> // div 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
                <nav aria-label="하단 메뉴"> // nav. 공개 마케팅 홈. 역할 대시보드 아님.
                    <Link href="/guest/inquiry">상담 문의</Link> // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                    <Link href="/login">로그인</Link> // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                    <Link href="/signup">회원가입</Link> // Link. 공개 마케팅 홈. 역할 대시보드 아님.
                </nav> // nav 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
            </footer> // footer 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
        </> // 요소 닫기. 공개 마케팅 홈. 역할 대시보드 아님.
    );
}
