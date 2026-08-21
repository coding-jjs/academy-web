"use client";

/**
 * 선택한 학생의 성적/오답 탭 컨테이너.
 *
 * 호출: `GradesManagementScreen`이 학생 한 명을 넘긴다.
 * 탭을 바꿔도 학생 선택은 유지하고, 저장 결과 메시지만 패널 간에 공유한다.
 *
 * 의도적으로 하지 않는 일:
 * - 서버 저장 → 각 패널이 `actions.ts`를 직접 호출한다.
 * - 탭 전환 시 작성 중인 폼을 강제로 비우지 않음. hidden으로 유지한다.
 *
 * 관련: `GradeRecordsPanel.tsx`, `WrongNotesPanel.tsx`.
 */

import { useState } from "react";
import GradeRecordsPanel from "@/features/grades/components/GradeRecordsPanel";
import WrongNotesPanel from "@/features/grades/components/WrongNotesPanel";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
} from "@/features/grades/types";
import styles from "../GradesManagementScreen.module.css";

type StudentGradesWorkspaceProps = {
    student: GradesStudentOption;
    grades: GradesGradeRow[];
    wrongNotes: GradesWrongRow[];
    maxAssessedDate: string;
};

/**
 * 한 학생의 성적·오답 탭. 저장 메시지는 부모가 받아 탭 아래에 한 줄로 보여 준다.
 */
export default function StudentGradesWorkspace({
    student,
    grades,
    wrongNotes,
    maxAssessedDate,
}: StudentGradesWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<"grades" | "wrongNotes">(
        "grades",
    );
    const [feedback, setFeedback] = useState<string | null>(null);

    function selectTab(tab: "grades" | "wrongNotes") {
        setActiveTab(tab);
        setFeedback(null);
    }

    return (
        <article className={styles.panel}>
            <div
                className={styles.panelHead}
            >
                <h2>{student.name}</h2>
                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={
                            activeTab === "grades"
                                ? styles.tabActive
                                : styles.tab
                        }
                        onClick={() => selectTab("grades")}
                    >
                        성적
                    </button>
                    <button
                        type="button"
                        className={
                            activeTab === "wrongNotes"
                                ? styles.tabActive
                                : styles.tab
                        }
                        onClick={() => selectTab("wrongNotes")}
                    >
                        오답
                    </button>
                </div>
            </div>
            <div hidden={activeTab !== "grades"}>
                <GradeRecordsPanel
                    student={student}
                    grades={grades}
                    maxAssessedDate={maxAssessedDate}
                    onFeedback={setFeedback}
                />
            </div>
            <div hidden={activeTab !== "wrongNotes"}>
                <WrongNotesPanel
                    student={student}
                    grades={grades}
                    wrongNotes={wrongNotes}
                    onFeedback={setFeedback}
                />
            </div>
            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </article>
    );
}
