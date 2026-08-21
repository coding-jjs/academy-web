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

import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import {
    buttonStyles,
    cx,
    typographyStyles,
} from "@/components/ui/shared-styles";
import type { HomeViewer } from "@/features/home/types";
import styles from "../HomeScreen.module.css";

/**
 * `/#about` 등 해시 앵커 + 상담 문의.
 * 로그인 시 이름 이니셜·역할 라벨·역할 홈 링크.
 */
export default function HomeHeader({ viewer }: { viewer: HomeViewer | null }) {
    return (
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
                        <div
                            className={styles.profileSummary}
                            title={`${viewer.name} · ${viewer.roleLabel}`}
                        >
                            <span
                                className={styles.profileAvatar}
                                aria-hidden="true"
                            >
                                {viewer.name.slice(0, 1)}
                            </span>
                            <span className={styles.profileText}>
                                <strong>{viewer.name}</strong>
                                <small className={typographyStyles.muted}>
                                    {viewer.roleLabel}
                                </small>
                            </span>
                        </div>
                        <Link
                            href={viewer.dashboardHref}
                            className={cx(
                                buttonStyles.primary,
                                styles.authButton,
                                styles.dashboardButton,
                            )}
                        >
                            대시보드 <span aria-hidden="true">→</span>
                        </Link>
                        <LogoutButton
                            className={cx(
                                buttonStyles.cancel,
                                styles.authButton,
                                styles.logoutButton,
                            )}
                        />
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className={cx(
                                styles.authButton,
                                styles.loginButton,
                            )}
                        >
                            로그인
                        </Link>
                        <Link
                            href="/signup"
                            className={cx(
                                buttonStyles.primary,
                                styles.authButton,
                            )}
                        >
                            회원가입
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
