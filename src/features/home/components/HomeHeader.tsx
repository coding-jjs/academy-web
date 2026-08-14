import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { buttonStyles, cx, typographyStyles } from "@/components/ui/shared-styles";
import type { HomeViewer } from "@/features/home/types";
import styles from "../HomeScreen.module.css";

export default function HomeHeader({ viewer }: { viewer: HomeViewer | null }) {
    return (
        <header className={styles.header}>
            <Link href="/" className={styles.brand} aria-label="A학원 홈"><span className={styles.brandMark}>A</span><span><strong>A학원</strong><small>ACADEMY</small></span></Link>
            <nav className={styles.nav} aria-label="메인 메뉴"><a href="#about">학원 소개</a><a href="#programs">교육 과정</a><a href="#process">학습 관리</a><Link href="/guest/inquiry">상담 문의</Link></nav>
            <div className={styles.authActions}>{viewer ? <>
                <div className={styles.profileSummary} title={`${viewer.name} · ${viewer.roleLabel}`}><span className={styles.profileAvatar} aria-hidden="true">{viewer.name.slice(0, 1)}</span><span className={styles.profileText}><strong>{viewer.name}</strong><small className={typographyStyles.muted}>{viewer.roleLabel}</small></span></div>
                <Link href={viewer.dashboardHref} className={cx(buttonStyles.primary, styles.authButton, styles.dashboardButton)}>대시보드 <span aria-hidden="true">→</span></Link><LogoutButton className={cx(buttonStyles.cancel, styles.authButton, styles.logoutButton)} />
            </> : <><Link href="/login" className={cx(styles.authButton, styles.loginButton)}>로그인</Link><Link href="/signup" className={cx(buttonStyles.primary, styles.authButton)}>회원가입</Link></>}</div>
        </header>
    );
}
