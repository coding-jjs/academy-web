import StatusChip from "@/components/ui/StatusChip";
import { cx, panelStyles, surfaceStyles } from "@/components/ui/shared-styles";
import type { StaffReportStudent } from "@/features/reports/types";
import {
    getStudentReportStatus,
    REPORT_STATUS_METADATA,
} from "@/features/reports/presentation";
import { formatStudentSchool } from "@/features/students/presentation";
import styles from "../StaffReportsScreen.module.css";

export default function ReportStudentList({
    students,
    selectedStudentId,
    onSelect,
}: {
    students: StaffReportStudent[];
    selectedStudentId: string;
    onSelect: (studentId: string) => void;
}) {
    return (
        <article className={cx(surfaceStyles.root, styles.listPanel)}>
            <div className={panelStyles.head}>
                <h2>학생 목록</h2>
                <StatusChip>{students.length}명</StatusChip>
            </div>
            <ul className={styles.studentList}>
                {students.map((student) => {
                    const status = getStudentReportStatus(student);
                    const statusMetadata = REPORT_STATUS_METADATA[status];

                    return (
                        <li key={student.id}>
                            <button
                                type="button"
                                className={
                                    student.id === selectedStudentId
                                        ? styles.activeStudent
                                        : undefined
                                }
                                onClick={() => onSelect(student.id)}
                            >
                                <span>
                                    <strong>{student.name}</strong>
                                    <small>
                                        {student.className ??
                                            formatStudentSchool(
                                                student.schoolName,
                                                student.grade,
                                            )}
                                    </small>
                                </span>
                                <StatusChip tone={statusMetadata.tone}>
                                    {statusMetadata.label}
                                </StatusChip>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}
