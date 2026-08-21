/**
 * `/employee/billing` 직원 청구·수납 자리.
 *
 * 연 사람: STAFF. layout `requireRole("STAFF")`.
 * 교사 Screen을 재사용하지 않고 "준비 중" 카피만 둔다.
 * 수납은 교사 권한에서 제외된 직원/원장 업무라는 의도지만, 실제 목록/Toss는 아직 없다.
 */

import Link from "next/link"; // 업무 홈으로 돌아가기만. 청구서 발행이 아니다.
import styles from "./EmployeeBillingScreen.module.css"; // 준비 중 카피 스타일. 정산 UI가 아니다.

/** 청구 기능이 오기 전 안내만 그린다. */
export default function EmployeeBillingPage() { // layout 가드만. 교사 Screen·Toss를 쓰지 않는다.
    return ( // 교사 Screen을 쓰지 않는다. 준비 중 카피만. Toss 정산 없음.
        <section className={styles.page}>{/* 직원 청구 자리. 수납 목록이 아니다. */}
            <header className={styles.heading}>{/* 청구·수납 자리 제목. */}
                <div>{/* 제목 블록. */}
                    <span>BILLING</span>{/* 영문 eyebrow. 실제 청구 상태가 아니다. */}
                    <h1>청구·수납</h1>{/* 자리 제목. 수납 정산이 아직 없다. */}
                    <p>학생들의 수강료와 교재비를 관리할 수 있습니다.</p>{/* 안내 카피. 목록을 읽지 않는다. */}
                </div>{/* 제목 블록 끝. */}
            </header>{/* header 끝. */}
            <div className={styles.preparing}>{/* 원장 billing과 같은 안내. 실제 목록은 아직 없다. */}
                <div className={styles.preparingIcon} aria-hidden="true">{/* 장식 아이콘. */}
                    ◷{/* 준비 중 표시. */}
                </div>{/* 아이콘 끝. */}

                <span className={styles.preparingBadge}>COMING SOON</span>{/* 준비 중 뱃지. */}

                <h2>현재 준비 중인 서비스입니다</h2>{/* 안내 제목. Toss 위젯이 아니다. */}

                <p>{/* 준비 중 본문. 원장 billing과 같은 패턴. */}
                    더욱 편리하고 안전한 청구·수납 관리 서비스를 제공하기 위해{/* 정산 연결 전 카피. */}
                    준비하고 있습니다.{/* 실제 목록/Toss는 아직 없다. */}
                    <br />{/* 줄바꿈. */}
                    청구·수납 관련 문의는 직원에게 문의해 주세요.{/* 이 page에서 문의를 받지 않는다. */}
                </p>{/* 본문 끝. */}

                <Link // 직원 업무 홈으로. 청구서 발행이 아니다.
                    href="/employee/dashboard" // 직원 홈. 수납 목록이 아니다.
                    className={styles.dashboardLink} // 돌아가기 링크.
                >{/* Link 열기. */}
                    대시보드로 돌아가기{/* 청구 기능이 오기 전 탈출. */}
                </Link>{/* Link 끝. */}
            </div>{/* preparing 끝. */}
        </section> // section 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
