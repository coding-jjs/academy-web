/**
 * `/parent/payments/success` 결제 성공 콜백 자리.
 *
 * 연 사람: PARENT. layout `requireRole("PARENT")`.
 * Toss 승인·정산을 하지 않는다. fail page와 같은 "준비 중" 안내만 보여 준다.
 * `ParentPaymentsScreen`도 연결하지 않는다.
 */

import Link from "next/link";
import styles from "../ParentPaymentsScreen.module.css";

/** 성공 콜백이어도 정산 없이 같은 준비 중 안내를 그린다. */
export default function ParentPaymentSuccessPage() {
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
                    온라인 결제는 처리하지 않습니다.
                    <br />
                    결제 관련 문의는 학원으로 연락해 주세요.
                </p>
                <Link href="/parent/payments" className={styles.dashboardLink}>
                    결제 목록으로
                </Link>
            </div>
        </section>
    );
}
