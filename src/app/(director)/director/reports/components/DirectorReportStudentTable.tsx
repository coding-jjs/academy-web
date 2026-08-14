import StatusChip from "@/components/ui/StatusChip";
import { cx, panelStyles, surfaceStyles } from "@/components/ui/shared-styles";
import { REPORT_STATUS_METADATA } from "@/features/reports/presentation";
import type { DirectorReportStudent } from "@/features/reports/types";
import { getStudentReportStatus } from "@/features/reports/presentation";
import { formatStudentSchool } from "@/features/students/presentation";
import styles from "../DirectorReportsScreen.module.css";

export default function DirectorReportStudentTable({
    students,
    activeStudentId,
    onSelect,
}: {
    students: DirectorReportStudent[];
    activeStudentId: string | null;
    onSelect: (studentId: string) => void;
}) {
    return (
        <article className={cx(surfaceStyles.root, styles.tablePanel)}>
            <div className={panelStyles.head}>
                <h2>학생 목록</h2>
                <StatusChip>{students.length}명</StatusChip>
            </div>
            <div className={styles.tableWrap}>
                <table>
                    <thead><tr><th>학생</th><th>학교·학년</th><th>반</th><th>상태</th></tr></thead>
                    <tbody>
                        {students.map((student) => {
                            const metadata = REPORT_STATUS_METADATA[getStudentReportStatus(student)];
                            return (
                                <tr key={student.id} className={student.id === activeStudentId ? styles.activeRow : undefined} onClick={() => onSelect(student.id)}>
                                    <td><strong>{student.name}</strong><small>{student.email}</small></td>
                                    <td>{formatStudentSchool(student.schoolName, student.grade)}</td>
                                    <td>{student.className ?? "—"}</td>
                                    <td><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </article>
    );
}
