import Link from "next/link";
import styles from "./GuestWaitingScreen.module.css";

const programs = [
    {
        title: "중등 수학",
        subtitle: "개념·심화",
        detail: "소수 정예 반",
    },
    {
        title: "중등 영어",
        subtitle: "독해·문법",
        detail: "주간 성취 기록",
    },
    {
        title: "학습 관리",
        subtitle: "AI 보고서",
        detail: "학부모 정기 소통",
    },
];

export default function GuestWaitingPage() {
    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>WELCOME</span>
                    <h1>A학원을 소개합니다</h1>
                    <p>
                        학생의 오늘을 기록하고 학부모와 성장 과정을 나누는
                        학원입니다.
                    </p>
                </div>
                <div className={styles.actions}>
                    <Link href="/guest/inquiry" className={styles.primaryBtn}>
                        상담 문의
                    </Link>
                    <a href="#location" className={styles.secondaryBtn}>
                        학원 위치
                    </a>
                </div>
            </header>

            <div className={styles.hero}>
                <h2>
                    성적은 기록하고,
                    <br />
                    성장은 함께 확인합니다
                </h2>
                <p>
                    출결부터 AI 학습 보고서까지 학부모와 밀착 소통하는
                    학원입니다.
                </p>
            </div>

            <section className={styles.block}>
                <div className={styles.blockHead}>
                    <h2>학원 프로그램</h2>
                    <p>수업과 학습 기록을 한곳에서 관리합니다.</p>
                </div>
                <div className={styles.programs}>
                    {programs.map((item) => (
                        <article key={item.title} className={styles.programCard}>
                            <strong>{item.title}</strong>
                            <span>{item.subtitle}</span>
                            <p>{item.detail}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="location" className={styles.block}>
                <div className={styles.blockHead}>
                    <h2>오시는 길</h2>
                    <p>대구광역시 ○○구 ○○로 00 · A학원</p>
                </div>
                <div className={styles.map}>
                    <span aria-hidden="true">⌖</span>
                    <p>약도 이미지 자리</p>
                </div>
                <ul className={styles.contactList}>
                    <li>
                        <strong>대표 전화</strong>
                        <span>053-000-0000</span>
                    </li>
                    <li>
                        <strong>상담 시간</strong>
                        <span>평일 14:00~21:00</span>
                    </li>
                </ul>
            </section>

            <p className={styles.footnote}>
                계정 연결 후 학부모·학생 기능을 이용할 수 있습니다.
            </p>
        </section>
    );
}