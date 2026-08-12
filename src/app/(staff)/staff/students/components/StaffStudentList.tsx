import StatusChip from "@/components/ui/StatusChip";
import type { StaffStudentRow } from "@/features/students/types";
import styles from "../StaffStudentsScreen.module.css";

export default function StaffStudentList({
    students,
    selectedStudentId,
    onSelect,
}: {
    students: StaffStudentRow[];
    selectedStudentId: string | null;
    onSelect: (studentId: string) => void;
}) {
    return (
        <aside className={styles.listPanel}>
            {students.length === 0 ? (
                <p className={styles.muted}>검색 결과가 없습니다.</p>
            ) : (
                <ul className={styles.list}>
                    {students.map((student) => (
                        <li key={student.id}>
                            <button
                                type="button"
                                className={
                                    student.id === selectedStudentId
                                        ? styles.itemActive
                                        : styles.item
                                }
                                onClick={() => onSelect(student.id)}
                            >
                                <strong>{student.name}</strong>
                                <div className={styles.classChips}>
                                    {student.classes.length > 0 ? (
                                        student.classes.map((academyClass) => (
                                            <span key={academyClass.id}>
                                                {academyClass.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span>반 없음</span>
                                    )}
                                </div>
                                {student.grade && (
                                    <span className={styles.studentGrade}>
                                        {student.grade}
                                    </span>
                                )}
                                <div className={styles.itemMeta}>
                                    <StatusChip
                                        tone={
                                            student.googleLinked
                                                ? "success"
                                                : "neutral"
                                        }
                                    >
                                        {student.googleLinked ? "연동" : "미연동"}
                                    </StatusChip>
                                    <StatusChip>
                                        학부모 {student.parents.length}명
                                    </StatusChip>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
}
