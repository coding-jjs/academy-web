/**
 * `/director/parents` 로딩 UI.
 *
 * `getDirectorFamilyLinksData`가 올 때까지 스켈레톤으로 빈 화면을 가린다.
 * 권한·데이터 조회는 하지 않는다. layout 가드는 이미 통과한 상태다.
 */

import {
    a11yStyles,
    cx,
    pageHeadingStyles,
    screenStyles,
    skeletonStyles,
    surfaceStyles,
} from "@/components/ui/shared-styles";
import styles from "./page.module.css";

/** 헤더·요약·폼·리스트 자리의 스켈레톤. */
export default function DirectorParentsLoading() {
    return (
        <section
            className={screenStyles.animatedPage}
            aria-busy="true"
            aria-label="학부모 관리 정보를 불러오는 중"
        >
            <div className={cx(pageHeadingStyles.root, styles.loadingHeading)}>
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
            <div className={cx(surfaceStyles.soft, styles.loadingFormCard)}>
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
            <div className={cx(surfaceStyles.soft, styles.loadingListPanel)}>
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
            <span className={a11yStyles.srOnly}>
                학부모와 학생 연결 정보를 불러오고 있습니다.
            </span>
        </section>
    );
}

/** 요약 카드 자리 뼈대. */
function LoadingSummaryCard() {
    return (
        <div className={cx(surfaceStyles.soft, styles.loadingSummaryCard)}>
            <Skeleton className={styles.loadingSummaryIcon} />
            <div>
                <Skeleton className={styles.loadingSmallText} />
                <Skeleton className={styles.loadingMetric} />
                <Skeleton className={styles.loadingSummaryDescription} />
            </div>
        </div>
    );
}

/** 폼 필드 자리 뼈대. */
function LoadingField() {
    return (
        <div className={styles.loadingField}>
            <Skeleton className={styles.loadingFieldLabel} />
            <Skeleton className={styles.loadingSelect} />
            <Skeleton className={styles.loadingFieldHint} />
        </div>
    );
}

/** 회색 블록. CSS 모듈 클래스만 받아 크기를 맞춘다. */
function Skeleton({ className }: { className: string }) {
    return <div className={cx(skeletonStyles.root, className)} />;
}
