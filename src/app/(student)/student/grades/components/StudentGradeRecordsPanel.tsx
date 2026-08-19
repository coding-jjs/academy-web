/**
 * 본인 성적 기록 목록 (서버 컴포넌트).
 *
 * props: grades — 읽기 전용. 점수 수정 Action 없음.
 * 학생 `StudentGradesScreen` 성적 탭에서만 쓴다.
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { formatGradeDate } from "@/features/grades/formatters"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import type { StudentGradesData } from "@/features/grades/types"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import styles from "../StudentGradesScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 제목·과목·점수 행만 나열한다. */
export default function StudentGradeRecordsPanel({ grades }: { grades: StudentGradesData["grades"] }) { // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    return ( // JSX 반환. 학생 Screen. 본인 Student.userId만.
        <article className={styles.panel}>{/* 본인 성적. 점수 수정 Action 없음. */}
            <div className={styles.panelHead}><h2>성적 기록</h2><StatusChip>{grades.length}건</StatusChip></div>{/* 레이아웃 상자. */}
            {grades.length === 0 ? ( // 기록 없음. 입력은 교사/원장 몫.
                <p className={styles.muted}>등록된 성적이 없습니다.</p> // 문장.
            ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                <ul className={styles.list}>{grades.map((grade) => ( // 열람만. GradesManagementScreen이 아니다.
                    <li key={grade.id}>{/* 항목. */}
                        <div><strong>{grade.title}</strong><span>{grade.subject}{grade.className ? ` · ${grade.className}` : ""}{` · ${formatGradeDate(grade.assessedAt)}`}</span></div>{/* 레이아웃 상자. */}
                        <div className={styles.score}><strong>{grade.score}<small>/{grade.maxScore}</small></strong>{grade.percent != null && <span>{grade.percent}%</span>}</div>{/* 레이아웃 상자. */}
                    </li> // li 닫기.
                ))}</ul> // 학생 Screen. 본인 Student.userId만.
            )}{/* 구문 끝. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
