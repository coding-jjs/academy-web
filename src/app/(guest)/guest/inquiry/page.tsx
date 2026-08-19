/**
 * `/guest/inquiry` 입학·상담 문의 라우트.
 *
 * 연 사람: 온보딩을 끝낸 GUEST. layout `requireRole("GUEST")`.
 * 흐름: 데이터 로더 없이 `GuestInquiryForm`(클라이언트)만 붙인다.
 * 제출은 `createInquiry`. 연락처·안내 aside는 이 page가 정적 카피로 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 원생 카드를 자동 만들지 않는다. 문의는 상태 관리만.
 * - `/guest`가 여기로 보내지 않는다. `/guest`는 `/`로 redirect.
 */

import GuestInquiryForm from "@/app/(guest)/guest/inquiry/GuestInquiryForm"; // 의존성. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
import { // 의존성. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
    cx, // 구문. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
    pageHeadingStyles, // 구문. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
    screenStyles, // 구문. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
    surfaceStyles, // 구문. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
    typographyStyles, // 구문. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
} from "@/components/ui/shared-styles"; // GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
import styles from "./GuestInquiryScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 문의 폼과 학원 연락 안내를 나란히 둔다. */
export default function GuestInquiryPage() { // 이 파일의 화면. GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
    return ( // 데이터 로더 없이 폼+안내만. layout 가드(GUEST).
        <section className={screenStyles.animatedPage}>{/* 게스트 문의. 원생 자동 등록 없음. */}
            <header className={cx(pageHeadingStyles.root, styles.heading)}>{/* 상담 문의. */}
                <div>{/* 레이아웃 상자. */}
                    <span className={pageHeadingStyles.eyebrow}>CONTACT</span>{/* 인라인 표시. */}
                    <h1>상담 문의</h1>{/* 제목. */}
                    <p className={typographyStyles.hint}>{/* 문장. */}
                        희망 과목과 상담 시간을 남겨주시면 학원에서{/* GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry. */}
                        연락드리겠습니다.{/* GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry. */}
                    </p>{/* p 닫기. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.layout}>{/* 폼 + 정적 연락 안내. */}
                <GuestInquiryForm />{/* createInquiry. 원생 카드는 안 만든다. */}

                <aside className={cx(surfaceStyles.root, styles.info)}>{/* 정적 연락처. 직원 상담(includeInquiries: true)이 처리. */}
                    <h2>상담 안내</h2>{/* 소제목. */}
                    <ul>{/* 목록. */}
                        <li>{/* 항목. */}
                            <strong>대표 전화</strong>{/* 강조. */}
                            <span className={typographyStyles.hint}>053-000-0000</span>{/* 인라인 표시. */}
                        </li>{/* li 닫기. */}
                        <li>{/* 항목. */}
                            <strong>상담 시간</strong>{/* 강조. */}
                            <span className={typographyStyles.hint}>평일 14:00~21:00</span>{/* 인라인 표시. */}
                        </li>{/* li 닫기. */}
                        <li>{/* 항목. */}
                            <strong>처리</strong>{/* 강조. */}
                            <span className={typographyStyles.hint}>{/* 인라인 표시. */}
                                접수 후 상태만 관리 (원생 자동 등록 없음) // GUEST. /guest는 / 로 redirect. 문의는 /guest/inquiry.
                            </span>{/* span 닫기. */}
                        </li>{/* li 닫기. */}
                    </ul>{/* ul 닫기. */}
                </aside>{/* aside 닫기. */}
            </div>{/* div 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
