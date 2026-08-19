/**
 * `/parent/payments` 학부모 결제 자리.
 *
 * 연 사람: PARENT. layout `requireRole("PARENT")`.
 * `ParentPaymentsScreen`을 연결하지 않는다. "준비 중" 카피만 보여 준다.
 *
 * success/fail 콜백 page도 같은 안내이며 Toss 결제 승인/정산이 아니다.
 */

import Link from "next/link"; // 자녀 홈으로 돌아가기만. 결제 승인이 아니다.
import styles from "./ParentPaymentsScreen.module.css"; // 준비 중 카피 스타일. ParentPaymentsScreen.tsx는 연결하지 않는다.

/** 결제 UI 대신 준비 중 안내만 그린다. ParentPaymentsScreen은 쓰지 않는다. */
export default function ParentPaymentsPage() { // layout 가드만. ParentPaymentsScreen·Toss를 연결하지 않는다.
    return ( // ParentPaymentsScreen을 연결하지 않는다. 준비 중 카피만.
        <section className={styles.page}>{/* 학부모 결제 자리. Toss 위젯이 아니다. */}
            <header className={styles.heading}>{/* 결제 자리 제목. 목록 UI를 열지 않는다. */}
                <div>{/* 제목 블록. */}
                    <span>PAYMENTS</span>{/* 영문 eyebrow. 실제 결제 상태가 아니다. */}
                    <h1>결제</h1>{/* 자리 제목. 수납 목록이 아직 없다. */}
                    <p>수강료와 교재비를 온라인으로 결제할 수 있습니다.</p>{/* 안내 카피. 목록을 읽지 않는다. */}
                </div>{/* 제목 블록 끝. */}
            </header>{/* header 끝. */}

            <div className={styles.preparing}>{/* success/fail도 같은 안내. Toss가 아니다. */}
                <div className={styles.preparingIcon} aria-hidden="true">{/* 장식 아이콘. */}
                    ◷{/* 준비 중 표시. */}
                </div>{/* 아이콘 끝. */}

                <span className={styles.preparingBadge}>COMING SOON</span>{/* 준비 중 뱃지. */}

                <h2>현재 준비 중인 서비스입니다</h2>{/* 안내 제목. Toss 위젯이 아니다. */}

                <p>{/* 준비 중 본문. 원장/직원 billing과 같은 패턴. */}
                    더욱 편리하고 안전한 결제 서비스를 제공하기 위해 준비하고{/* 정산 연결 전 카피. */}
                    있습니다.{/* 실제 목록/Toss는 아직 없다. */}
                    <br />{/* 줄바꿈. */}
                    결제 관련 문의는 학원으로 연락해 주세요.{/* 이 page에서 결제를 받지 않는다. */}
                </p>{/* 본문 끝. */}

                <Link href="/parent/dashboard" className={styles.dashboardLink}>{/* 자녀 홈으로. 결제 승인이 아니다. */}
                    자녀 홈으로 돌아가기{/* 결제 기능이 오기 전 탈출. */}
                </Link>{/* Link 끝. */}
            </div>{/* preparing 끝. */}
        </section> // section 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
