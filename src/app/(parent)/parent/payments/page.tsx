/**
 * `/parent/payments` 학부모 결제 자리.
 *
 * 연 사람: PARENT. layout `requireRole("PARENT")`.
 * `ParentPaymentsScreen`을 연결하지 않는다. "준비 중" 카피만 보여 준다.
 *
 * success/fail 콜백 page도 같은 안내이며 Toss 결제 승인/정산이 아니다.
 */

import Link from "next/link";
import styles from "./ParentPaymentsScreen.module.css";

/** 결제 UI 대신 준비 중 안내만 그린다. ParentPaymentsScreen은 쓰지 않는다. */
export default function ParentPaymentsPage() {
    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>PAYMENTS</span>
                    <h1>결제</h1>
                    <p>수강료와 교재비를 온라인으로 결제할 수 있습니다.</p>
                </div>
            </header>
            <div className={styles.preparing}>
                <div className={styles.preparingIcon} aria-hidden="true">
                    ◷
                </div>
                <span className={styles.preparingBadge}>COMING SOON</span>
                <h2>현재 준비 중인 서비스입니다</h2>
                <p>
                    더욱 편리하고 안전한 결제 서비스를 제공하기 위해 준비하고
                    있습니다.
                    <br />
                    결제 관련 문의는 학원으로 연락해 주세요.
                </p>
                <Link href="/parent/dashboard" className={styles.dashboardLink}>
                    자녀 홈으로 돌아가기
                </Link>
            </div>
        </section>
    );
}
