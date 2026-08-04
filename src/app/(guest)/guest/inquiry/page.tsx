import GuestInquiryForm from "@/app/(guest)/guest/inquiry/GuestInquiryForm";
import styles from "./GuestInquiryScreen.module.css";

export default function GuestInquiryPage() {
    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>CONTACT</span>
                    <h1>상담 문의</h1>
                    <p>
                        희망 과목과 상담 시간을 남겨주시면 학원에서
                        연락드리겠습니다.
                    </p>
                </div>
            </header>

            <div className={styles.layout}>
                <GuestInquiryForm />

                <aside className={styles.info}>
                    <h2>상담 안내</h2>
                    <ul>
                        <li>
                            <strong>대표 전화</strong>
                            <span>053-000-0000</span>
                        </li>
                        <li>
                            <strong>상담 시간</strong>
                            <span>평일 14:00~21:00</span>
                        </li>
                        <li>
                            <strong>처리</strong>
                            <span>접수 후 상태만 관리 (원생 자동 등록 없음)</span>
                        </li>
                    </ul>
                </aside>
            </div>
        </section>
    );
}