/**
 * `/parent/payments/success` 결제 성공 콜백 자리.
 *
 * 연 사람: PARENT. layout `requireRole("PARENT")`.
 * Toss 승인·정산을 하지 않는다. fail page와 같은 "준비 중" 안내만 보여 준다.
 * `ParentPaymentsScreen`도 연결하지 않는다.
 */

import Link from "next/link"; // 준비 중 목록으로. 영수증이 아니다.
import styles from "../ParentPaymentsScreen.module.css"; // 같은 준비 중 스타일. ParentPaymentsScreen.tsx는 연결하지 않는다.

/** 성공 콜백이어도 정산 없이 같은 준비 중 안내를 그린다. */
export default function ParentPaymentSuccessPage() { // layout 가드만. Toss 승인·정산 없음.
    return ( // Toss 승인·정산 없음. fail page와 같은 준비 중 안내.
        <section className={styles.page}>{/* 결제 콜백 자리. 정산 웹훅이 아니다. */}
            <header className={styles.heading}>{/* 결제 자리. 성공 콜백이어도 목록 UI를 열지 않는다. */}
                <div>{/* 제목 블록. */}
                    <span>PAYMENTS</span>{/* 영문 eyebrow. */}
                    <h1>결제</h1>{/* 자리 제목. 영수증이 아니다. */}
                    <p>수강료와 교재비를 온라인으로 결제할 수 있습니다.</p>{/* 안내 카피. */}
                </div>{/* 제목 블록 끝. */}
            </header>{/* header 끝. */}

            <div className={styles.preparing}>{/* ParentPaymentsScreen·Toss 웹훅이 아니다. */}
                <div className={styles.preparingIcon} aria-hidden="true">{/* 장식 아이콘. */}
                    ◷{/* 준비 중 표시. */}
                </div>{/* 아이콘 끝. */}

                <span className={styles.preparingBadge}>COMING SOON</span>{/* 준비 중 뱃지. */}

                <h2>현재 준비 중인 서비스입니다</h2>{/* 안내 제목. */}

                <p>{/* 성공 콜백이어도 정산 없음. */}
                    온라인 결제는 처리하지 않습니다.{/* Toss 승인을 하지 않는다. */}
                    <br />{/* 줄바꿈. */}
                    결제 관련 문의는 학원으로 연락해 주세요.{/* 영수증 UI가 아니다. */}
                </p>{/* 본문 끝. */}

                <Link href="/parent/payments" className={styles.dashboardLink}>{/* 준비 중 목록으로. 영수증이 아니다. */}
                    결제 목록으로{/* 목록도 준비 중 카피. */}
                </Link>{/* Link 끝. */}
            </div>{/* preparing 끝. */}
        </section> // section 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
