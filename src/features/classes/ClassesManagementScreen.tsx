"use client"; // UI만. 권한은 페이지 layout. 쓰기는 ClassEditor가 서버 액션으로.

/**
 * 원장 반·수업 관리 UI. 왼쪽 목록과 오른쪽 편집기를 묶는다.
 *
 * 호출: `(director)/director/classes/page.tsx`가 `getClassesManagementData` 결과를 넘긴다.
 * 반이 없으면 바로 생성 모드로 들어가고, 서버 액션 결과는 feedback으로만 보여 준다.
 * ClassEditor의 key는 선택 id라 반을 바꾸면 폼 state가 리셋된다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한을 검사하지 않는다. 페이지 레이아웃이 DIRECTOR만 통과.
 * - 출석 명단을 편집하지 않는다 → teacher attendance.
 *
 * 관련: `ClassList.tsx`, `ClassEditor.tsx`, `features/classes/data.ts`.
 */

import { useState } from "react"; // 선택·생성·피드백. Prisma는 치지 않는다.
import ClassEditor from "@/features/classes/components/ClassEditor"; // 쓰기. key로 반 전환 시 폼 리셋.
import ClassList from "@/features/classes/components/ClassList"; // 선택만. 새 반은 헤더 버튼.
import type { // data가 채운 행. 클라이언트에서 추가 필터하지 않는다.
    ClassRow, // 활성 반이 앞. CANCELLED 회차 포함.
    TeacherOption, // 담당 select. DIRECTOR 없음.
} from "@/features/classes/types"; // 서버 페이지가 props로 넘긴다.
import styles from "./ClassesManagementScreen.module.css"; // 페이지 셸 레이아웃.

/**
 * 반 목록 + 편집기 셸.
 *
 * @param classes 서버에서 읽은 전체 반. 클라이언트에서 추가 필터하지 않는다.
 * @param teachers 담당 select 옵션.
 * @sideEffects 로컬 선택/생성/피드백 state만. 쓰기는 자식이 서버 액션으로.
 */
export default function ClassesManagementScreen({ // 권한 검사 없음. layout이 DIRECTOR만 통과.
    classes, // getClassesManagementData. 클라이언트에서 안 걸러.
    teachers, // ClassEditor 담당 select.
}: { // 페이지 서버 컴포넌트가 넘긴다.
    classes: ClassRow[]; // 빈 배열이면 바로 생성 모드.
    teachers: TeacherOption[]; // ACTIVE TEACHER/STAFF.
}) { // 출석 명단은 이 Screen이 아니다.
    const [selectedClassId, setSelectedClassId] = useState<string | null>( // 생성 모드면 목록 하이라이트 없음.
        classes[0]?.id ?? null, // 반이 없으면 null. 아래에서 생성 모드.
    );
    const [isCreating, setIsCreating] = useState(classes.length === 0); // 빈 학원은 바로 새 반 폼.
    const [feedback, setFeedback] = useState<string | null>(null); // 서버 액션 메시지. 하단에만.
    const selectedClass = isCreating // 생성 모드면 편집기에 기존 반을 넘기지 않는다.
        ? null // 생성 모드면 편집기에 기존 반을 넘기지 않는다.
        : (classes.find( // refresh 후에도 같은 id를 찾는다.
              (academyClass) => academyClass.id === selectedClassId, // 목록에서 고른 행.
          ) ?? null); // 삭제됐으면 null.

    function selectClass(academyClass: ClassRow) { // 목록 클릭. 쓰기는 없다.
        setSelectedClassId(academyClass.id); // 편집기 key가 바뀌어 폼이 리셋된다.
        setIsCreating(false); // 생성 폼을 닫고 기존 반을 연다.
        setFeedback(null); // 이전 저장 메시지를 지운다.
    }

    function startCreatingClass() { // 헤더 "새 반". 목록 선택은 유지.
        setIsCreating(true); // 목록 선택은 유지하되 편집기는 빈 폼.
        setFeedback(null); // 이전 메시지 지움.
    }

    function selectCreatedClass(classId: string) { // createClass 성공 id.
        setSelectedClassId(classId); // 생성 직후 그 반을 열어 회차를 넣을 수 있게.
        setIsCreating(false); // 생성 폼을 닫는다.
    }

    return ( // 권한·출석 편집 없음. 셸만.
        <section className={styles.page}> // 원장 반 관리 셸. layout이 DIRECTOR만 통과.
            <header className={styles.heading}> // 제목과 새 반 버튼. 목록은 아래 ClassList.
                <div> // 카피. 출석·시간표가 ClassSession을 읽는다는 안내.
                    <span>CLASSES</span> // 섹션 라벨.
                    <h1>반·수업</h1> // 페이지 제목.
                    <p> // 그리드는 ClassSession. schedule Json이 아니다.
                        반을 만들고 수업 일정을 등록하면 출석·시간표에 // 회차 저장 후 revalidate.
                        반영됩니다. // Class.schedule 반복 슬롯이 아니다.
                    </p> // 안내 문장 끝.
                </div> // 제목 블록 끝.
                <button // 빈 학원에서도 생성 모드로 들어간다.
                    type="button" // submit이 아니다. 서버 액션은 편집기.
                    className={styles.secondaryBtn} // 헤더 보조 버튼.
                    onClick={startCreatingClass} // 반이 없어도 새 반으로 바로 들어간다.
                > // 목록 패널에 "새 반"이 없다.
                    새 반 // 생성 모드. 기존 선택 id는 유지.
                </button> // 새 반 버튼 끝.
            </header> // heading 끝.

            <div className={styles.layout}> // 왼쪽 목록, 오른쪽 편집기.
                <ClassList // 선택만. 쓰기는 오른쪽 편집기.
                    classes={classes} // 선택만. 쓰기는 오른쪽 편집기.
                    selectedClassId={selectedClass?.id ?? null} // 생성 모드면 하이라이트 없음.
                    onSelect={selectClass} // isCreating을 끈다.
                /> // ClassList 끝.
                <ClassEditor // 반을 바꾸면 key로 폼 state가 리셋된다.
                    key={selectedClass?.id ?? "new-class"} // 반을 바꾸면 폼 state가 리셋된다.
                    academyClass={selectedClass} // null이면 생성 모드.
                    teachers={teachers} // 담당 select. DIRECTOR 없음.
                    onFeedback={setFeedback} // 하단 p로만 보여 준다.
                    onClassCreated={selectCreatedClass} // 생성 직후 그 반을 연다.
                /> // ClassEditor 끝.
            </div> // layout 끝.

            {feedback && <p className={styles.feedback}>{feedback}</p>} // 서버 액션 메시지. 권한 검사가 아니다.
        </section> // page 끝.
    );
}
