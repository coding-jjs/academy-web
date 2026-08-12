"use client";

import { useState } from "react";
import { formatGradeDelta } from "@/features/grades/formatters";
import type { StudentGradesData } from "@/features/grades/types";
import StudentGradeRecordsPanel from "./components/StudentGradeRecordsPanel";
import StudentWrongNotesPanel from "./components/StudentWrongNotesPanel";
import styles from "./StudentGradesScreen.module.css";

export default function StudentGradesScreen({ data }: { data: StudentGradesData }) {
    const [activeTab, setActiveTab] = useState<"grades" | "wrongNotes">("grades");
    if (!data.linked) return <UnlinkedStudentGrades />;

    return (
        <section className={styles.page}>
            <GradesHeading />
            <div className={styles.metrics}>
                {data.highlights.length > 0 ? data.highlights.map((highlight) => <article key={highlight.subject}><span>최근 {highlight.subject}</span><strong>{highlight.score}점</strong><p>{formatGradeDelta(highlight.delta)}</p></article>) : <article><span>최근 성적</span><strong>—</strong><p>기록 없음</p></article>}
                <article><span>오답 노트</span><strong>{data.wrongNotes.length}</strong><p>복습 필요 {data.openWrongCount}개</p></article>
            </div>
            <div className={styles.filters}>
                <button type="button" className={activeTab === "grades" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("grades")}>성적</button>
                <button type="button" className={activeTab === "wrongNotes" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("wrongNotes")}>오답</button>
            </div>
            {activeTab === "grades" ? <StudentGradeRecordsPanel grades={data.grades} /> : <StudentWrongNotesPanel wrongNotes={data.wrongNotes} />}
        </section>
    );
}

function GradesHeading() {
    return <header className={styles.heading}><div><span>LEARNING</span><h1>성적·오답</h1><p>최근 성적 변화와 복습할 오답을 확인합니다.</p></div></header>;
}

function UnlinkedStudentGrades() {
    return <section className={styles.page}><GradesHeading /><div className={styles.empty}><h2>연결된 학생 정보가 없습니다</h2><p>학원에서 학생 계정 연결 후 성적·오답을 볼 수 있습니다.</p></div></section>;
}
