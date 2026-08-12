"use client";

import { useState } from "react";
import ClassEditor from "@/features/classes/components/ClassEditor";
import ClassList from "@/features/classes/components/ClassList";
import type {
    ClassRow,
    TeacherOption,
} from "@/features/classes/types";
import styles from "./ClassesManagementScreen.module.css";

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
