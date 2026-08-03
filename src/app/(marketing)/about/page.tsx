import Link from "next/link";
import styles from "./AboutPage.module.css";

const programs = [
    {
        title: "중등 수학",
        subtitle: "개념·심화",
        detail: "소수 정예 반으로 개념 정리와 심화 문제를 함께 다룹니다.",
    },
    {
        title: "중등 영어",
        subtitle: "독해·문법",
        detail: "주간 성취 기록으로 독해와 문법을 균형 있게 관리합니다.",
    },
    {
        title: "학습 관리",
        subtitle: "AI 보고서",
        detail: "출결·성적·학습 기록을 바탕으로 학부모와 정기 소통합니다.",
    },
];

const flows = [
    {
        title: "수업",
        detail: "담당 반 기준으로 일정과 출결을 관리합니다.",
    },
    {
        title: "기록",
        detail: "성적·오답·생활 기록을 한곳에 남깁니다.",
    },
    {
        title: "상담",
        detail: "AI 리포트와 쪽지로 학부모와 성장 과정을 나눕니다.",
    },
];

export default function AboutPage() {
    return (
        <main className={styles.page}>
            <header className={styles.topBar}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </Link>
                <nav className={styles.nav}>
                    <Link href="/guest/waiting">학원 소개</Link>
                    <Link href="/guest/inquiry">상담 문의</Link>
                    <Link href="/login">로그인</Link>
                </nav>
            </header>

            <div className={styles.content}>
                <header className={styles.heading}>
                    <div>
                        <span>ABOUT A ACADEMY</span>
                        <h1>배움의 흐름을 함께 만듭니다</h1>
                        <p>
                            수업, 기록, 상담을 연결해 학생의 성장을 세심하게
                            관리합니다.
                        </p>
                    </div>
                    <Link href="/guest/inquiry" className={styles.primaryBtn}>
                        상담 문의
                    </Link>
                </header>

                <section className={styles.hero}>
                    <h2>
                        프로그램은 수업에서 끝나고,
                        <br />
                        성장은 기록으로 이어집니다
                    </h2>
                    <p>
                        A학원은 중등 수학·영어 수업과 학습 관리를 하나의
                        흐름으로 운영합니다.
                    </p>
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHead}>
                        <h2>학원 프로그램</h2>
                        <p>게스트 메뉴의 프로그램 안내 페이지입니다.</p>
                    </div>
                    <div className={styles.programs}>
                        {programs.map((item) => (
                            <article key={item.title} className={styles.card}>
                                <strong>{item.title}</strong>
                                <span>{item.subtitle}</span>
                                <p>{item.detail}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.block}>
                    <div className={styles.blockHead}>
                        <h2>운영 흐름</h2>
                        <p>수업 → 기록 → 상담으로 연결됩니다.</p>
                    </div>
                    <div className={styles.flows}>
                        {flows.map((item, index) => (
                            <article key={item.title} className={styles.flowCard}>
                                <em>{String(index + 1).padStart(2, "0")}</em>
                                <strong>{item.title}</strong>
                                <p>{item.detail}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.cta}>
                    <div>
                        <h2>상담이 필요하신가요?</h2>
                        <p>희망 과목과 시간을 남겨주시면 학원에서 연락드립니다.</p>
                    </div>
                    <div className={styles.ctaActions}>
                        <Link href="/guest/inquiry" className={styles.primaryBtn}>
                            상담 문의
                        </Link>
                        <Link href="/guest/waiting" className={styles.secondaryBtn}>
                            학원 소개
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}