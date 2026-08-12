import StatusChip from "@/components/ui/StatusChip";
import type { ClassRow } from "@/features/classes/types";
import styles from "../ClassesManagementScreen.module.css";

export default function ClassList({
    classes,
    selectedClassId,
    onSelect,
}: {
    classes: ClassRow[];
    selectedClassId: string | null;
    onSelect: (academyClass: ClassRow) => void;
}) {
    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}>
                <h2>반 목록</h2>
                <StatusChip>{classes.length}개</StatusChip>
            </div>
            {classes.length === 0 ? (
                <p className={styles.hint}>아직 반이 없습니다.</p>
            ) : (
                <ul className={styles.list}>
                    {classes.map((academyClass) => (
                        <li key={academyClass.id}>
                            <button
                                type="button"
                                className={
                                    academyClass.id === selectedClassId
                                        ? styles.itemActive
                                        : styles.itemBtn
                                }
                                onClick={() => onSelect(academyClass)}
                            >
                                <strong>
                                    {academyClass.name}
                                    {!academyClass.active ? " (비활성)" : ""}
                                </strong>
                                <small>
                                    {academyClass.subject} ·{" "}
                                    {academyClass.teacherName ?? "담당 미지정"} ·
                                    수강 {academyClass.enrollmentCount}명
                                </small>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
