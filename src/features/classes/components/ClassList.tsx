/**
 * 반 관리 화면의 왼쪽 반 목록.
 *
 * 호출: `ClassesManagementScreen`이 전체 `classes`와 현재 선택 id를 넘긴다.
 * 선택만 알리고 쓰기는 하지 않으며, 비활성 반은 이름 옆에 표시한다.
 * 수강 인원은 data 레이어의 ACTIVE 수강 count다.
 *
 * 의도적으로 하지 않는 일:
 * - 반을 만들거나 지우지 않는다. "새 반"은 부모 헤더 버튼.
 * - 회차 목록을 그리지 않는다 → `ClassEditor`.
 *
 * 관련: `ClassesManagementScreen.tsx`, `features/classes/types.ts`.
 */

import StatusChip from "@/components/ui/StatusChip";
import type { ClassRow } from "@/features/classes/types";
import styles from "../ClassesManagementScreen.module.css";

/**
 * 반 선택 리스트. 쓰기는 없고 onSelect만 올린다.
 *
 * @param classes 활성 반이 앞에 온 배열(data 정렬).
 * @param selectedClassId 생성 모드면 null이라 어떤 행도 itemActive가 아니다.
 * @param onSelect 클릭한 ClassRow. 부모가 isCreating을 끈다.
 */
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
                                    {academyClass.subject} ·
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
