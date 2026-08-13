import Link from "next/link";
import styles from "./DirectorBillingScreen.module.css";

export default function DirectorBillingPage() {
    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>BILLING</span>
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
                    className={styles.dashboardLink}
                >
                    대시보드로 돌아가기
                </Link>
            </div>
        </section>
    );
}
