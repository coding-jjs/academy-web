/**
 * 공개 홈 상단 브랜드·앵커 내비·인증 액션이다.
 *
 * 호출: `HomeScreen`. 뷰어가 있으면 대시보드·로그아웃, 없으면 로그인·회원가입.
 * 이 페이지 자체가 역할 홈이 아니므로, 로그인 후에도 마케팅 카피는 그대로 두고
 * `viewer.dashboardHref`로만 역할 대시보드에 보낸다.
 *
 * 의도적으로 하지 않는 일:
 * - 역할별 지표 카드. `/`는 공개 마케팅 페이지다.
 * - 로그아웃 구현. `LogoutButton`에 맡긴다.
 *
 * 관련: `types.ts`의 `HomeViewer`, `app/page.tsx`.
 */

import Link from "next/link"; // 앵커·로그인·대시보드 링크.
import LogoutButton from "@/components/auth/LogoutButton"; // 로그아웃 구현은 여기 없음.
import { // 버튼·보조 텍스트.
    buttonStyles, // 대시보드·가입 primary.
    cx, // 클래스 결합.
    typographyStyles, // 역할 라벨 muted.
} from "@/components/ui/shared-styles"; // 역할 홈 카드 스타일이 아니다.
import type { HomeViewer } from "@/features/home/types"; // 비로그인이면 null.
import styles from "../HomeScreen.module.css"; // 공개 홈 헤더.

/**
 * `/#about` 등 해시 앵커 + 상담 문의.
 * 로그인 시 이름 이니셜·역할 라벨·역할 홈 링크.
 */
export default function HomeHeader({ viewer }: { viewer: HomeViewer | null }) { // 지표 카드 없음.
    return ( // 공개 마케팅 헤더.
        <header className={styles.header}> // 브랜드·내비·인증.
            <Link href="/" className={styles.brand} aria-label="A학원 홈"> {/* 이 `/`는 공개 마케팅 홈이지 역할 대시보드가 아니다. */}
                <span className={styles.brandMark}>A</span> // 마크. 역할 홈 아이콘이 아니다.
                <span> // 워드마크.
                    <strong>A학원</strong> // 브랜드명.
                    <small>ACADEMY</small> // 영문 보조.
                </span> // 워드마크 끝.
            </Link> // 홈 링크. `/`는 마케팅.
            <nav className={styles.nav} aria-label="메인 메뉴"> {/* 해시 앵커 + 상담 문의. 역할 지표 카드는 그리지 않는다. */}
                <a href="#about">학원 소개</a> // 페이지 내 앵커.
                <a href="#programs">교육 과정</a> // 정적 섹션.
                <a href="#process">학습 관리</a> // 마케팅 카피. 출결 화면이 아니다.
                <Link href="/guest/inquiry">상담 문의</Link> // GUEST 문의. 로그인 업무 URL 아님.
            </nav> // 앵커 내비 끝.
            <div className={styles.authActions}> {/* 로그인 시 대시보드·로그아웃, 아니면 로그인·가입. */}
                {viewer ? ( // 세션 있음. 이 페이지는 여전히 마케팅 홈.
                    <> {/* 이름·대시보드·로그아웃. 지표 카드 없음. */}
                        <div // 이름·역할 요약. 지표 숫자 없음.
                            className={styles.profileSummary} // 이니셜+이름.
                            title={`${viewer.name} · ${viewer.roleLabel}`} // 툴팁.
                        > // 프로필 요약.
                            <span // 이니셜 아바타.
                                className={styles.profileAvatar} // 첫 글자.
                                aria-hidden="true" // 장식.
                            > // 아바타.
                                {viewer.name.slice(0, 1)} // 이니셜.
                            </span> // 아바타 끝.
                            <span className={styles.profileText}> // 이름·역할.
                                <strong>{viewer.name}</strong> // 표시 이름.
                                <small className={typographyStyles.muted}> // 역할 라벨.
                                    {viewer.roleLabel} // JWT 코드가 아니라 한글 라벨.
                                </small> // 역할 끝.
                            </span> // 텍스트 끝.
                        </div> // 프로필 끝.
                        <Link // 역할 홈으로만 이동.
                            href={viewer.dashboardHref} // 이 `/`는 마케팅 홈. 역할 대시보드는 dashboardHref로만 이동.
                            className={cx( // primary 버튼.
                                buttonStyles.primary, // 강조.
                                styles.authButton, // 헤더 버튼 크기.
                                styles.dashboardButton, // 대시보드 전용.
                            )}
                        > // 역할 홈 링크.
                            대시보드 <span aria-hidden="true">→</span> // 이 페이지가 역할 홈이 아니다.
                        </Link> // 대시보드 링크 끝.
                        <LogoutButton // 구현은 컴포넌트에 맡긴다.
                            className={cx( // cancel 톤.
                                buttonStyles.cancel, // 보조.
                                styles.authButton, // 헤더 버튼.
                                styles.logoutButton, // 로그아웃 전용.
                            )}
                        /> // 로그아웃.
                    </> // 로그인 액션 끝.
                ) : ( // 비로그인.
                    <> {/* 로그인·가입만. 업무 URL을 헤더에 안 보여 준다. */}
                        <Link // 업무 URL을 헤더에 안 보여 준다.
                            href="/login" // 비로그인. 업무 URL을 보여주지 않고 로그인·가입만.
                            className={cx( // 로그인 버튼.
                                styles.authButton, // 헤더 버튼.
                                styles.loginButton, // 로그인 전용.
                            )}
                        > // 로그인.
                            로그인 // 카피.
                        </Link> // 로그인 링크 끝.
                        <Link // Google 가입 진입.
                            href="/signup" // 온보딩. 역할 부여가 아니다.
                            className={cx( // primary.
                                buttonStyles.primary, // 강조.
                                styles.authButton, // 헤더 버튼.
                            )}
                        > // 가입.
                            회원가입 // 카피.
                        </Link> // 가입 링크 끝.
                    </> // 비로그인 액션 끝.
                )}
            </div> // 인증 액션 끝.
        </header> // 헤더 끝.
    );
}
