/**
 * `/director/billing` 청구·수납 자리.
 *
 * 연 사람: DIRECTOR. layout `requireRole("DIRECTOR")`.
 * Screen·data를 연결하지 않는다. "준비 중" 카피만 보여 준다.
 *
 * 학부모 `/parent/payments`와 같이 실제 목록/수납/Toss 정산이 없다.
 * 직원 `/employee/billing`도 같은 안내 패턴이다.
 */

import Link from "next/link"; // 대시보드로 돌아가기만. 청구서 발행이 아니다.
import { // 공유 버튼·제목 스타일. 청구 Screen 전용 모듈과 함께 쓴다.
    buttonStyles, // 대시보드 링크 버튼.
    cx, // 클래스 결합.
    pageHeadingStyles, // 페이지 제목.
    screenStyles, // 페이지 래퍼.
} from "@/components/ui/shared-styles"; // 청구 data 로더가 아니다.
import styles from "./DirectorBillingScreen.module.css"; // 준비 중 카피 스타일. 정산 UI가 아니다.

/** 청구 기능이 오기 전 안내만 그린다. */
export default function DirectorBillingPage() { // layout 가드만. Screen·data·Toss를 연결하지 않는다.
    return ( // 청구 Screen·Toss를 연결하지 않는다. 준비 중 카피만.
        <section className={screenStyles.animatedPage}>{/* 원장 청구 자리. 정산 UI가 아니다. */}
            <header className={pageHeadingStyles.root}>{/* 청구·수납 자리 제목. */}
                <div>{/* 제목 블록. 미납 목록이 아니다. */}
                    <span className={pageHeadingStyles.eyebrow}>BILLING</span>{/* 영문 eyebrow. 실제 청구 상태가 아니다. */}
                    <h1>청구·수납</h1>{/* 자리 제목. 수납 정산이 아직 없다. */}
                    <p>학생들의 수강료와 교재비를 관리할 수 있습니다.</p>{/* 안내 카피. 목록을 읽지 않는다. */}
                </div>{/* 제목 블록 끝. */}
            </header>{/* header 끝. */}
            <div className={styles.preparing}>{/* 학부모 payments·직원 billing과 같은 안내. 정산 없음. */}
                <div className={styles.preparingIcon} aria-hidden="true">{/* 장식 아이콘. 상태 배지가 아니다. */}
                    ◷{/* 준비 중 표시. 청구서 아이콘이 아니다. */}
                </div>{/* 아이콘 끝. */}

                <span className={styles.preparingBadge}>COMING SOON</span>{/* 준비 중 뱃지. 납부 상태가 아니다. */}

                <h2>현재 준비 중인 서비스입니다</h2>{/* 안내 제목. Toss 위젯이 아니다. */}

                <p>{/* 준비 중 본문. 학부모 payments와 같은 패턴. */}
                    더욱 편리하고 안전한 청구·수납 관리 서비스를 제공하기 위해{/* 정산 연결 전 카피. */}
                    준비하고 있습니다.{/* 실제 목록/Toss는 아직 없다. */}
                    <br />{/* 줄바꿈. 문의는 관리자. */}
                    청구·수납 관련 문의는 관리자에게 문의해 주세요.{/* 이 page에서 문의를 받지 않는다. */}
                </p>{/* 본문 끝. */}

                <Link // 원장 대시보드로. 청구서 발행이 아니다.
                    href="/director/dashboard" // 원장 홈. 수납 목록이 아니다.
                    className={cx(buttonStyles.primary, styles.dashboardLink)} // 공유 primary + 청구 자리 링크.
                >{/* Link 열기. */}
                    대시보드로 돌아가기{/* 청구 기능이 오기 전 탈출. */}
                </Link>{/* Link 끝. */}
            </div>{/* preparing 끝. */}
        </section> // section 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
