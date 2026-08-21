/**
 * `/director/billing` 청구·수납 자리.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`.
 * Screen·data를 연결하지 않는다. "준비 중" 카피만 보여 준다.
 *
 * 학부모 `/parent/payments`와 같이 실제 목록/수납/Toss 정산이 없다.
 * 직원 `/employee/billing`도 같은 안내 패턴이다.
 */

import Link from "next/link";
import {
    buttonStyles,
    cx,
    pageHeadingStyles,
    screenStyles,
} from "@/components/ui/shared-styles";
import styles from "./DirectorBillingScreen.module.css";

/** 청구 기능이 오기 전 안내만 그린다. */
export default function DirectorBillingPage() {
    return (
        <section className={screenStyles.animatedPage}>
            <header className={pageHeadingStyles.root}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>BILLING</span>
                    <h1>청구·수납</h1>
                    <p>학생들의 수강료와 교재비를 관리할 수 있습니다.</p>
                </div>
            </header>
            <div className={styles.preparing}>
                <div className={styles.preparingIcon} aria-hidden="true">
                    ◷
                </div>
                <span className={styles.preparingBadge}>COMING SOON</span>
                <h2>현재 준비 중인 서비스입니다</h2>
                <p>
                    더욱 편리하고 안전한 청구·수납 관리 서비스를 제공하기 위해
                    준비하고 있습니다.
                    <br />
                    청구·수납 관련 문의는 관리자에게 문의해 주세요.
                </p>
                <Link
                    href="/director/dashboard"
                    className={cx(buttonStyles.primary, styles.dashboardLink)}
                >
                    대시보드로 돌아가기
                </Link>
            </div>
        </section>
    );
}
