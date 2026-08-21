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

import GuestInquiryForm from "@/app/(guest)/guest/inquiry/GuestInquiryForm";
import {
    cx,
    pageHeadingStyles,
    screenStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import styles from "./GuestInquiryScreen.module.css";

/** 문의 폼과 학원 연락 안내를 나란히 둔다. */
export default function GuestInquiryPage() {
    return (
        <section className={screenStyles.animatedPage}>
            <header className={cx(pageHeadingStyles.root, styles.heading)}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>CONTACT</span>
                    <h1>상담 문의</h1>
                    <p className={typographyStyles.hint}>
                        희망 과목과 상담 시간을 남겨주시면 학원에서
                        연락드리겠습니다.
                    </p>
                </div>
            </header>
            <div className={styles.layout}>
                <GuestInquiryForm />
                <aside className={cx(surfaceStyles.root, styles.info)}>
                    <h2>상담 안내</h2>
                    <ul>
                        <li>
                            <strong>대표 전화</strong>
                            <span className={typographyStyles.hint}>053-000-0000</span>
                        </li>
                        <li>
                            <strong>상담 시간</strong>
                            <span className={typographyStyles.hint}>평일 14:00~21:00</span>
                        </li>
                        <li>
                            <strong>처리</strong>
                            <span className={typographyStyles.hint}>
                                접수 후 상태만 관리 (원생 자동 등록 없음)
                            </span>
                        </li>
                    </ul>
                </aside>
            </div>
        </section>
    );
}
