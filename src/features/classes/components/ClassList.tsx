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

import StatusChip from "@/components/ui/StatusChip"; // 반 개수. 권한 칩이 아니다.
import type { ClassRow } from "@/features/classes/types"; // enrollmentCount는 ACTIVE+endedAt null.
import styles from "../ClassesManagementScreen.module.css"; // 패널·리스트. 편집기와 공유.

/**
 * 반 선택 리스트. 쓰기는 없고 onSelect만 올린다.
 *
 * @param classes 활성 반이 앞에 온 배열(data 정렬).
 * @param selectedClassId 생성 모드면 null이라 어떤 행도 itemActive가 아니다.
 * @param onSelect 클릭한 ClassRow. 부모가 isCreating을 끈다.
 */
export default function ClassList({ // UI만. create/update는 ClassEditor.
    classes, // data 정렬 그대로. 클라이언트에서 안 걸러.
    selectedClassId, // 생성 모드면 null.
    onSelect, // 부모가 선택·생성 플래그를 바꾼다.
}: { // 서버 액션 없음.
    classes: ClassRow[]; // 빈 배열이면 힌트만. 생성은 헤더.
    selectedClassId: string | null; // 생성 모드면 하이라이트 없음.
    onSelect: (academyClass: ClassRow) => void; // 클릭한 행.
}) { // 회차 목록은 그리지 않는다.
    return ( // 선택만. Prisma를 치지 않는다.
        <article className={styles.panel}> // 왼쪽 패널. 쓰기는 오른쪽 편집기.
            <div className={styles.panelHead}> // 제목과 개수.
                <h2>반 목록</h2> // 선택 리스트. 새 반은 부모 헤더.
                <StatusChip>{classes.length}개</StatusChip> // 활성+비활성 합.
            </div> // panelHead 끝.
            {classes.length === 0 ? ( // 생성은 부모 "새 반". 이 패널은 선택만.
                <p className={styles.hint}>아직 반이 없습니다.</p> // 생성은 부모 "새 반". 이 패널은 선택만.
            ) : ( // 행 클릭이 onSelect. 삭제 버튼 없음.
                <ul className={styles.list}> // 활성 반이 앞. data 정렬.
                    {classes.map((academyClass) => ( // CANCELLED 수강은 enrollmentCount에 없음.
                        <li key={academyClass.id}> // 반 한 줄. 회차는 안 그린다.
                            <button // type=button. 폼 submit이 아니다.
                                type="button" // 서버 액션 없음.
                                className={ // 생성 모드면 아무 행도 itemActive가 아니다.
                                    academyClass.id === selectedClassId // 현재 편집 중인 반.
                                        ? styles.itemActive // 선택 하이라이트.
                                        : styles.itemBtn // 기본 행.
                                }
                                onClick={() => onSelect(academyClass)} // 부모가 isCreating을 끈다.
                            > // 이름·과목·담당·수강 인원.
                                <strong> // 비활성은 이름 옆에만. 행을 숨기지 않는다.
                                    {academyClass.name} // 반 이름.
                                    {!academyClass.active ? " (비활성)" : ""} // 이후 회차 생성은 서버가 거절.
                                </strong> // 이름 끝.
                                <small> // 수강 인원은 ACTIVE+endedAt null.
                                    {academyClass.subject} ·{" "} // 과목.
                                    {academyClass.teacherName ?? "담당 미지정"} · // 출결 own/other 판정.
                                    수강 {academyClass.enrollmentCount}명 // CANCELLED 수강 제외.
                                </small> // 메타 끝.
                            </button> // 행 버튼 끝.
                        </li> // 반 행 끝.
                    ))}
                </ul> // list 끝.
            )}
        </article> // panel 끝.
    );
}
