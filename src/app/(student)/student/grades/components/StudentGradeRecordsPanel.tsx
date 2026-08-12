import StatusChip from "@/components/ui/StatusChip";
import { formatGradeDate } from "@/features/grades/formatters";
import type { StudentGradesData } from "@/features/grades/types";
import styles from "../StudentGradesScreen.module.css";

export default function StudentGradeRecordsPanel({ grades }: { grades: StudentGradesData["grades"] }) {
    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}><h2>성적 기록</h2><StatusChip>{grades.length}건</StatusChip></div>
            {grades.length === 0 ? <p className={styles.muted}>등록된 성적이 없습니다.</p> : (
                <ul className={styles.list}>{grades.map((grade) => (
                    <li key={grade.id}>
                        <div><strong>{grade.title}</strong><span>{grade.subject}{grade.className ? ` · ${grade.className}` : ""}{` · ${formatGradeDate(grade.assessedAt)}`}</span></div>
                        <div className={styles.score}><strong>{grade.score}<small>/{grade.maxScore}</small></strong>{grade.percent != null && <span>{grade.percent}%</span>}</div>
                    </li>
                ))}</ul>
            )}
        </article>
    );
}
