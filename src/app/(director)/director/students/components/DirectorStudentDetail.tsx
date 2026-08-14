"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    buttonStyles,
    cx,
    fieldStyles,
    panelStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import type {
    DirectorClassOption,
    DirectorStudent,
    StudentStatus,
} from "@/features/students/types";
import {
    addStudentEnrollment,
    endStudentEnrollment,
    updateStudentStatus,
} from "@/features/students/director-actions";
import {
    formatEnrollmentChangeDate,
    formatStudentSchool,
    STUDENT_STATUS_METADATA,
} from "@/features/students/presentation";
import styles from "../DirectorStudentsScreen.module.css";

export default function DirectorStudentDetail({
    student,
    classOptions,
    onClose,
}: {
    student: DirectorStudent;
    classOptions: DirectorClassOption[];
    onClose: () => void;
}) {
    const router = useRouter();
    const [isSaving, startSaving] = useTransition();
    const [selectedClassId, setSelectedClassId] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);
    const addableClasses = useMemo(() => {
        const enrolledClassIds = new Set(
            student.classes.map((enrollment) => enrollment.classId),
        );
        return classOptions.filter(
            (academyClass) => !enrolledClassIds.has(academyClass.id),
        );
    }, [student.classes, classOptions]);

    function addClassEnrollment() {
        if (!selectedClassId) return;

        startSaving(async () => {
            const result = await addStudentEnrollment({
                studentId: student.id,
                classId: selectedClassId,
            });
            setFeedback(result.message);
            if (result.ok) {
                setSelectedClassId("");
                router.refresh();
            }
        });
    }

    function endClassEnrollment(enrollmentId: string, className: string) {
        const confirmed = window.confirm(
            `${className} 수강을 해제할까요?\n출결·성적 기록은 유지됩니다.`,
        );
        if (!confirmed) return;

        startSaving(async () => {
            const result = await endStudentEnrollment({ enrollmentId });
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    function changeStudentStatus(nextStatus: StudentStatus) {
        if (student.status === nextStatus) return;

        const statusLabel = STUDENT_STATUS_METADATA[nextStatus].label;
        const confirmed = window.confirm(
            nextStatus === "WITHDRAWN"
                ? `${student.name} 학생을 퇴원 처리할까요?\n활성 수강이 모두 해제됩니다.`
                : `${student.name} 학생 상태를 "${statusLabel}"(으)로 바꿀까요?`,
        );
        if (!confirmed) return;

        startSaving(async () => {
            const result = await updateStudentStatus({
                studentId: student.id,
                status: nextStatus,
            });
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    return (
        <aside className={cx(surfaceStyles.root, styles.detailPanel)}>
            <div className={panelStyles.head}>
                <div>
                    <h2>{student.name}</h2>
                    <p>
                        {formatStudentSchool(
                            student.schoolName,
                            student.grade,
                            "학교·학년 미입력",
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    className={buttonStyles.secondary}
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>

            <div className={styles.meta}>
                <div>
                    <span>Google 연동</span>
                    <strong>
                        {student.googleLinked
                            ? (student.email ?? "연동됨")
                            : "미연동"}
                    </strong>
                </div>
                <div>
                    <span>학부모</span>
                    <strong>
                        {student.parentNames.length > 0
                            ? student.parentNames.join(", ")
                            : "미연결"}
                    </strong>
                </div>
            </div>

            <StudentStatusEditor
                student={student}
                isSaving={isSaving}
                onChange={changeStudentStatus}
            />
            <CurrentEnrollments
                student={student}
                isSaving={isSaving}
                onEnd={endClassEnrollment}
            />
            <AddEnrollment
                hasClasses={classOptions.length > 0}
                classes={addableClasses}
                selectedClassId={selectedClassId}
                isSaving={isSaving}
                onClassChange={setSelectedClassId}
                onAdd={addClassEnrollment}
            />
            <RecentEnrollmentChanges student={student} />

            {feedback && <p className={typographyStyles.hint}>{feedback}</p>}
        </aside>
    );
}

function StudentStatusEditor({
    student,
    isSaving,
    onChange,
}: {
    student: DirectorStudent;
    isSaving: boolean;
    onChange: (status: StudentStatus) => void;
}) {
    const statusMetadata = STUDENT_STATUS_METADATA[student.status];

    return (
        <section className={styles.block}>
            <h3>재원 상태</h3>
            <div className={styles.statusRow}>
                <StatusChip tone={statusMetadata.tone}>
                    {statusMetadata.label}
                </StatusChip>
                <select
                    className={styles.statusSelect}
                    value={student.status}
                    disabled={isSaving}
                    onChange={(event) =>
                        onChange(event.target.value as StudentStatus)
                    }
                >
                    <option value="ENROLLED">재원</option>
                    <option value="PAUSED">휴원</option>
                    <option value="WITHDRAWN">퇴원</option>
                </select>
            </div>
            <p className={typographyStyles.muted}>
                휴원·퇴원 학생은 청구·성적 등 재원 목록에서 제외됩니다. 퇴원은
                수강도 해제합니다.
            </p>
        </section>
    );
}

function CurrentEnrollments({
    student,
    isSaving,
    onEnd,
}: {
    student: DirectorStudent;
    isSaving: boolean;
    onEnd: (enrollmentId: string, className: string) => void;
}) {
    return (
        <section className={styles.block}>
            <h3>현재 수강</h3>
            {student.classes.length === 0 ? (
                <p className={typographyStyles.muted}>배정된 반이 없습니다.</p>
            ) : (
                <ul className={styles.enrollmentList}>
                    {student.classes.map((enrollment) => (
                        <li key={enrollment.enrollmentId}>
                            <div>
                                <strong>{enrollment.className}</strong>
                                <small>
                                    {enrollment.teacherName ?? "담당 미지정"} ·
                                    활성
                                </small>
                            </div>
                            <button
                                type="button"
                                className={buttonStyles.danger}
                                disabled={isSaving}
                                onClick={() =>
                                    onEnd(
                                        enrollment.enrollmentId,
                                        enrollment.className,
                                    )
                                }
                            >
                                해제
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function AddEnrollment({
    hasClasses,
    classes,
    selectedClassId,
    isSaving,
    onClassChange,
    onAdd,
}: {
    hasClasses: boolean;
    classes: DirectorClassOption[];
    selectedClassId: string;
    isSaving: boolean;
    onClassChange: (classId: string) => void;
    onAdd: () => void;
}) {
    return (
        <section className={styles.block}>
            <h3>반 추가</h3>
            {!hasClasses ? (
                <p className={typographyStyles.muted}>등록된 활성 반이 없습니다.</p>
            ) : classes.length === 0 ? (
                <p className={typographyStyles.muted}>추가할 수 있는 반이 없습니다.</p>
            ) : (
                <div className={styles.addRow}>
                    <select
                        className={cx(fieldStyles.control, fieldStyles.select)}
                        value={selectedClassId}
                        onChange={(event) => onClassChange(event.target.value)}
                        disabled={isSaving}
                    >
                        <option value="">반 선택</option>
                        {classes.map((academyClass) => (
                            <option
                                key={academyClass.id}
                                value={academyClass.id}
                            >
                                {academyClass.name}
                                {academyClass.teacherName
                                    ? ` · ${academyClass.teacherName}`
                                    : ""}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className={buttonStyles.action}
                        disabled={isSaving || !selectedClassId}
                        onClick={onAdd}
                    >
                        추가
                    </button>
                </div>
            )}
        </section>
    );
}

function RecentEnrollmentChanges({ student }: { student: DirectorStudent }) {
    return (
        <section className={styles.block}>
            <h3>최근 변경</h3>
            {student.recentChanges.length === 0 ? (
                <p className={typographyStyles.muted}>최근 해제 이력이 없습니다.</p>
            ) : (
                <ul className={styles.historyList}>
                    {student.recentChanges.map((change) => (
                        <li key={change.id}>
                            {formatEnrollmentChangeDate(change.endedAt)}{" "}
                            {change.className} 해제
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
