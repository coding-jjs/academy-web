/**
 * 교사/직원 원생 리스트 (서버 컴포넌트).
 *
 * props: students, selectedStudentId, onSelect.
 * 직원 URL도 `StaffStudentsScreen` 경유로 재사용한다. 선택만 하고 저장하지 않는다.
 */

import StatusChip from "@/components/ui/StatusChip";
import { cx, surfaceStyles, typographyStyles } from "@/components/ui/shared-styles";
import type { StaffStudentRow } from "@/features/students/types";
import styles from "../StaffStudentsScreen.module.css";

/** 검색된 원생을 눌러 상세를 연다. */
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
        <aside className={cx(surfaceStyles.root, styles.listPanel)}>
            {students.length === 0 ? (
                <p className={typographyStyles.muted}>검색 결과가 없습니다.</p>
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
                                <div className={styles.itemMeta}>
                                    <StatusChip
                                        tone={
                                            student.googleLinked
                                                ? "success"
                                                : "neutral"
                                        }
                                    >
                                        {student.googleLinked
                                            ? "연동"
                                            : "미연동"}
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
