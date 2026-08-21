"use client";

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

import { useState } from "react";
import ClassEditor from "@/features/classes/components/ClassEditor";
import ClassList from "@/features/classes/components/ClassList";
import type {
    ClassRow,
    TeacherOption,
} from "@/features/classes/types";
import styles from "./ClassesManagementScreen.module.css";

/**
 * 반 목록 + 편집기 셸.
 *
 * @param classes 서버에서 읽은 전체 반. 클라이언트에서 추가 필터하지 않는다.
 * @param teachers 담당 select 옵션.
 * @sideEffects 로컬 선택/생성/피드백 state만. 쓰기는 자식이 서버 액션으로.
 */
export default function ClassesManagementScreen({
    classes,
    teachers,
}: {
    classes: ClassRow[];
    teachers: TeacherOption[];
}) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(
        classes[0]?.id ?? null,
    );
    const [isCreating, setIsCreating] = useState(classes.length === 0);
    const [feedback, setFeedback] = useState<string | null>(null);
    const selectedClass = isCreating
        ? null
        : (classes.find(
              (academyClass) => academyClass.id === selectedClassId,
          ) ?? null);

    function selectClass(academyClass: ClassRow) {
        setSelectedClassId(academyClass.id);
        setIsCreating(false);
        setFeedback(null);
    }

    function startCreatingClass() {
        setIsCreating(true);
        setFeedback(null);
    }

    function selectCreatedClass(classId: string) {
        setSelectedClassId(classId);
        setIsCreating(false);
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>CLASSES</span>
                    <h1>반·수업</h1>
                    <p>
                        반을 만들고 수업 일정을 등록하면 출석·시간표에
                        반영됩니다.
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={startCreatingClass}
                >
                    새 반
                </button>
            </header>
            <div className={styles.layout}>
                <ClassList
                    classes={classes}
                    selectedClassId={selectedClass?.id ?? null}
                    onSelect={selectClass}
                />
                <ClassEditor
                    key={selectedClass?.id ?? "new-class"}
                    academyClass={selectedClass}
                    teachers={teachers}
                    onFeedback={setFeedback}
                    onClassCreated={selectCreatedClass}
                />
            </div>
            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}
