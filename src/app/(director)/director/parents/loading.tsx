import styles from "./page.module.css";

export default function DirectorParentsLoading() {
    return (
        <section
            className={styles.page}
            aria-busy="true"
            aria-label="학부모 관리 정보를 불러오는 중"
        >
            <div className={styles.loadingHeading}>
                <div>
                    <Skeleton className={styles.loadingEyebrow} />
                    <Skeleton className={styles.loadingTitle} />
                    <Skeleton className={styles.loadingDescription} />
                </div>
                <Skeleton className={styles.loadingBadge} />
            </div>

            <div className={styles.loadingSummary}>
                <LoadingSummaryCard />
                <LoadingSummaryCard />
            </div>

            <div className={styles.loadingFormCard}>
                <div className={styles.loadingFormHeader}>
                    <Skeleton className={styles.loadingFormIcon} />
                    <div>
                        <Skeleton className={styles.loadingSmallText} />
                        <Skeleton className={styles.loadingSectionTitle} />
                        <Skeleton
                            className={styles.loadingSectionDescription}
                        />
                    </div>
                </div>
                <div className={styles.loadingFields}>
                    <LoadingField />
                    <LoadingField />
                    <LoadingField />
                </div>
                <div className={styles.loadingFormFooter}>
                    <Skeleton className={styles.loadingHint} />
                    <Skeleton className={styles.loadingButton} />
                </div>
            </div>

            <div className={styles.loadingListPanel}>
                <div className={styles.loadingListHeader}>
                    <div>
                        <Skeleton className={styles.loadingSmallText} />
                        <Skeleton className={styles.loadingSectionTitle} />
                    </div>
                    <Skeleton className={styles.loadingCount} />
                </div>
                {[0, 1, 2].map((item) => (
                    <div className={styles.loadingRow} key={item}>
                        <div className={styles.loadingPeople}>
                            <Skeleton className={styles.loadingAvatar} />
                            <Skeleton className={styles.loadingPersonText} />
                            <Skeleton className={styles.loadingConnector} />
                            <Skeleton className={styles.loadingAvatar} />
                            <Skeleton className={styles.loadingPersonText} />
                        </div>
                        <Skeleton className={styles.loadingMeta} />
                        <Skeleton className={styles.loadingAction} />
                    </div>
                ))}
            </div>
            <span className={styles.srOnly}>
                학부모와 학생 연결 정보를 불러오고 있습니다.
            </span>
        </section>
    );
}

function LoadingSummaryCard() {
    return (
        <div className={styles.loadingSummaryCard}>
            <Skeleton className={styles.loadingSummaryIcon} />
            <div>
                <Skeleton className={styles.loadingSmallText} />
                <Skeleton className={styles.loadingMetric} />
                <Skeleton className={styles.loadingSummaryDescription} />
            </div>
        </div>
    );
}

function LoadingField() {
    return (
        <div className={styles.loadingField}>
            <Skeleton className={styles.loadingFieldLabel} />
            <Skeleton className={styles.loadingSelect} />
            <Skeleton className={styles.loadingFieldHint} />
        </div>
    );
}

function Skeleton({ className }: { className: string }) {
    return <div className={`${styles.skeleton} ${className}`} />;
}
