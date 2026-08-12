import Link from "next/link";
import { ACADEMY_PROGRAMS, LEARNING_STEPS } from "@/features/home/content";
import styles from "../HomeScreen.module.css";

export default function HomeInformationSections() {
    return (
        <>
            <section className={styles.quickLinks} aria-label="빠른 메뉴"><div><span>FOR FAMILY</span><h2>오늘의 배움을 바로 확인하세요</h2></div><Link href="/login"><small>학부모</small>자녀의 출결과 학습 기록<span aria-hidden="true">↗</span></Link><Link href="/login"><small>학생</small>나의 시간표와 성적<span aria-hidden="true">↗</span></Link><Link href="/guest/inquiry"><small>게스트</small>입학 및 수업 상담<span aria-hidden="true">↗</span></Link></section>
            <section className={styles.section} id="programs"><div className={styles.sectionHeading}><p>PROGRAM</p><h2>이해하고, 적용하고,<br />스스로 설명하는 수업</h2><span>학생마다 다른 출발점과 속도를 존중합니다.</span></div><div className={styles.programGrid}>{ACADEMY_PROGRAMS.map((program) => <article key={program.number} className={styles.programCard}><span>{program.number}</span><div><small>{program.subtitle}</small><h3>{program.title}</h3><p>{program.detail}</p></div></article>)}</div></section>
            <section className={styles.process} id="process"><div className={styles.processIntro}><p>LEARNING JOURNEY</p><h2>성장은 보이지 않는 순간에도 이어집니다</h2><span>감이 아닌 기록으로 학생을 이해하고, 필요한 순간에 함께합니다.</span></div><ol className={styles.stepList}>{LEARNING_STEPS.map(([title, detail], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{detail}</p></li>)}</ol></section>
            <section className={styles.finalCta}><p>START TOGETHER</p><h2>우리 아이에게 맞는 배움,<br />상담에서 시작해 보세요</h2><Link href="/guest/inquiry" className={styles.lightButton}>상담 문의 남기기 <span aria-hidden="true">→</span></Link></section>
            <footer className={styles.footer}><div className={styles.footerBrand}><span className={styles.brandMark}>A</span><strong>A학원</strong></div><div><p>학생의 배움과 성장을 함께 기록합니다.</p><p>© 2026 A Academy. All rights reserved.</p></div><nav aria-label="하단 메뉴"><Link href="/guest/inquiry">상담 문의</Link><Link href="/login">로그인</Link><Link href="/signup">회원가입</Link></nav></footer>
        </>
    );
}
