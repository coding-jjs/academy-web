/**
 * `/director/parents` 로딩 UI.
 *
 * `getDirectorFamilyLinksData`가 올 때까지 스켈레톤으로 빈 화면을 가린다.
 * 권한·데이터 조회는 하지 않는다. layout 가드는 이미 통과한 상태다.
 */

import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    a11yStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    screenStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    skeletonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 헤더·요약·폼·리스트 자리의 스켈레톤. */
export default function DirectorParentsLoading() { // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 권한·조회는 하지 않는다. layout 가드는 이미 통과.
        <section // 화면 구간.
            className={screenStyles.animatedPage} // className 필드.
            aria-busy="true" // 원장 Screen. layout requireRole DIRECTOR.
            aria-label="학부모 관리 정보를 불러오는 중" // 원장 Screen. layout requireRole DIRECTOR.
        >{/* 원장 Screen. layout requireRole DIRECTOR. */}
            <div className={cx(pageHeadingStyles.root, styles.loadingHeading)}>{/* 제목 자리. 실제 링크 데이터가 아니다. */}
                <div>{/* 레이아웃 상자. */}
                    <Skeleton className={styles.loadingEyebrow} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                    <Skeleton className={styles.loadingTitle} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                    <Skeleton className={styles.loadingDescription} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
                <Skeleton className={styles.loadingBadge} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}

            <div className={styles.loadingSummary}>{/* 카드 자리. 연결 건수를 아직 안 읽는다. */}
                <LoadingSummaryCard />{/* LoadingSummaryCard. 원장 Screen. layout requireRole DIRECTOR. */}
                <LoadingSummaryCard />{/* LoadingSummaryCard. 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}

            <div className={cx(surfaceStyles.soft, styles.loadingFormCard)}>{/* 연결 폼 자리. linkParentStudent가 아니다. */}
                <div className={styles.loadingFormHeader}>{/* 레이아웃 상자. */}
                    <Skeleton className={styles.loadingFormIcon} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                    <div>{/* 레이아웃 상자. */}
                        <Skeleton className={styles.loadingSmallText} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                        <Skeleton className={styles.loadingSectionTitle} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                        <Skeleton // Skeleton. 원장 Screen. layout requireRole DIRECTOR.
                            className={styles.loadingSectionDescription} // className 필드.
                        />{/* 구문 끝. */}
                    </div>{/* div 닫기. */}
                </div>{/* div 닫기. */}
                <div className={styles.loadingFields}>{/* 레이아웃 상자. */}
                    <LoadingField />{/* LoadingField. 원장 Screen. layout requireRole DIRECTOR. */}
                    <LoadingField />{/* LoadingField. 원장 Screen. layout requireRole DIRECTOR. */}
                    <LoadingField />{/* LoadingField. 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
                <div className={styles.loadingFormFooter}>{/* 레이아웃 상자. */}
                    <Skeleton className={styles.loadingHint} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                    <Skeleton className={styles.loadingButton} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
            </div>{/* div 닫기. */}

            <div className={cx(surfaceStyles.soft, styles.loadingListPanel)}>{/* 링크 행 자리. unlink 버튼이 아니다. */}
                <div className={styles.loadingListHeader}>{/* 레이아웃 상자. */}
                    <div>{/* 레이아웃 상자. */}
                        <Skeleton className={styles.loadingSmallText} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                        <Skeleton className={styles.loadingSectionTitle} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                    </div>{/* div 닫기. */}
                    <Skeleton className={styles.loadingCount} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
                {[0, 1, 2].map((item) => ( // 3행 뼈대. 실제 ParentStudent 링크가 아니다.
                    <div className={styles.loadingRow} key={item}>{/* 레이아웃 상자. */}
                        <div className={styles.loadingPeople}>{/* 레이아웃 상자. */}
                            <Skeleton className={styles.loadingAvatar} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                            <Skeleton className={styles.loadingPersonText} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                            <Skeleton className={styles.loadingConnector} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                            <Skeleton className={styles.loadingAvatar} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                            <Skeleton className={styles.loadingPersonText} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                        </div>{/* div 닫기. */}
                        <Skeleton className={styles.loadingMeta} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                        <Skeleton className={styles.loadingAction} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                    </div> // div 닫기.
                ))}{/* 구문 끝. */}
            </div>{/* div 닫기. */}
            <span className={a11yStyles.srOnly}>{/* 인라인 표시. */}
                학부모와 학생 연결 정보를 불러오고 있습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </span>{/* span 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 요약 카드 자리 뼈대. */
function LoadingSummaryCard() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 요약 카드 뼈대. 실제 연결 건수가 아니다.
        <div className={cx(surfaceStyles.soft, styles.loadingSummaryCard)}>{/* 레이아웃 상자. */}
            <Skeleton className={styles.loadingSummaryIcon} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
            <div>{/* 레이아웃 상자. */}
                <Skeleton className={styles.loadingSmallText} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                <Skeleton className={styles.loadingMetric} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
                <Skeleton className={styles.loadingSummaryDescription} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 폼 필드 자리 뼈대. */
function LoadingField() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 폼 필드 뼈대. select 옵션을 아직 안 읽는다.
        <div className={styles.loadingField}>{/* 레이아웃 상자. */}
            <Skeleton className={styles.loadingFieldLabel} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
            <Skeleton className={styles.loadingSelect} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
            <Skeleton className={styles.loadingFieldHint} />{/* Skeleton. 원장 Screen. layout requireRole DIRECTOR. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 회색 블록. CSS 모듈 클래스만 받아 크기를 맞춘다. */
function Skeleton({ className }: { className: string }) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    return <div className={cx(skeletonStyles.root, className)} />; // CSS 모듈 클래스로 크기만. 데이터를 읽지 않는다.
} // 블록 끝.
