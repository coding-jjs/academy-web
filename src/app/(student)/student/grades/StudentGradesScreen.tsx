"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학생 성적·오답 화면 (클라이언트).
 *
 * props: data — viewer-data. 탭으로 `StudentGradeRecordsPanel` /
 * `StudentWrongNotesPanel`을 묶는다. 미연결이면 점수를 추측하지 못하게 빈 안내만.
 * 수정 Action 없음.
 */

import { useState } from "react"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { formatGradeDelta } from "@/features/grades/formatters"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import type { StudentGradesData } from "@/features/grades/types"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import StudentGradeRecordsPanel from "./components/StudentGradeRecordsPanel"; // 같은 라우트 모듈. 학생 Screen. 본인 Student.userId만.
import StudentWrongNotesPanel from "./components/StudentWrongNotesPanel"; // 같은 라우트 모듈. 학생 Screen. 본인 Student.userId만.
import styles from "./StudentGradesScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 성적/오답 탭과 하이라이트 카드를 그린다. */
export default function StudentGradesScreen({ data }: { data: StudentGradesData }) { // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    const [activeTab, setActiveTab] = useState<"grades" | "wrongNotes">("grades"); // 성적/오답 탭. 쓰기는 없다.
    if (!data.linked) return <UnlinkedStudentGrades />; // 원장이 학생 계정을 연결하기 전. 점수를 추측하지 않는다.

    return ( // JSX 반환. 학생 Screen. 본인 Student.userId만.
        <section className={styles.page}>{/* 본인 성적 열람. GradesManagementScreen이 아니다. */}
            <GradesHeading />{/* GradesHeading. 학생 Screen. 본인 Student.userId만. */}
            <div className={styles.metrics}>{/* 최근 성적·오답 수. 수정 Action 없음. */}
                {data.highlights.length > 0 ? data.highlights.map((highlight) => <article key={highlight.subject}><span>최근 {highlight.subject}</span><strong>{highlight.score}점</strong><p>{formatGradeDelta(highlight.delta)}</p></article>) : <article><span>최근 성적</span><strong>—</strong><p>기록 없음</p></article>}{/* 학생 Screen. 본인 Student.userId만. */}
                <article><span>오답 노트</span><strong>{data.wrongNotes.length}</strong><p>복습 필요 {data.openWrongCount}개</p></article>{/* article. 학생 Screen. 본인 Student.userId만. */}
            </div>{/* div 닫기. */}
            <div className={styles.filters}>{/* 성적/오답 탭. 입력 UI가 아니다. */}
                <button type="button" className={activeTab === "grades" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("grades")}>성적</button>{/* 클릭. 권한을 클라이언트에서 올리지 않는다. */}
                <button type="button" className={activeTab === "wrongNotes" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("wrongNotes")}>오답</button>{/* 클릭. 권한을 클라이언트에서 올리지 않는다. */}
            </div>{/* div 닫기. */}
            {activeTab === "grades" ? ( // 성적 기록. 교사/원장 입력 화면이 아니다.
                <StudentGradeRecordsPanel grades={data.grades} /> // StudentGradeRecordsPanel. 학생 Screen. 본인 Student.userId만.
            ) : ( // 오답 노트. 복습 체크만 패널이 담당.
                <StudentWrongNotesPanel wrongNotes={data.wrongNotes} /> // StudentWrongNotesPanel. 학생 Screen. 본인 Student.userId만.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 성적·오답 페이지 공통 제목. */
function GradesHeading() { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
    return <header className={styles.heading}><div><span>LEARNING</span><h1>성적·오답</h1><p>최근 성적 변화와 복습할 오답을 확인합니다.</p></div></header>; // 읽기 전용 제목.
} // 블록 끝.

/** 학생 프로필이 아직 없을 때 쓰는 빈 상태. */
function UnlinkedStudentGrades() { // 로컬 헬퍼. 학생 Screen. 본인 Student.userId만.
    return <section className={styles.page}><GradesHeading /><div className={styles.empty}><h2>연결된 학생 정보가 없습니다</h2><p>학원에서 학생 계정 연결 후 성적·오답을 볼 수 있습니다.</p></div></section>; // 원장이 학생 계정을 연결하기 전.
} // 블록 끝.
