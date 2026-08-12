"use client";

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
            <div className={styles.panelHead}>
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
