/**
 * 원생 상세(최근 출석·성적·학습기록) (서버 컴포넌트).
 *
 * props: student, showLearningRecordForm, writableClassIds.
 * 상태 전이는 원장만. 기록 작성은 `LearningRecordForm`(클라이언트).
 */

import StatusChip from "@/components/ui/StatusChip";
import {
    cx,
    panelStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import type { StaffStudentRow } from "@/features/students/types";
import LearningRecordForm from "./LearningRecordForm";
import {
    formatStudentRecordDate,
    LEARNING_RECORD_TYPE_LABELS,
    STUDENT_STATUS_METADATA,
} from "@/features/students/presentation";
import { ATTENDANCE_STATUS_METADATA } from "@/features/attendance/presentation";
import styles from "../StaffStudentsScreen.module.css";

/** 프로필 메타와 최근 기록을 보여 주고, 허용되면 작성 폼을 연다. */
export default function StaffStudentDetail({
    student,
    showLearningRecordForm,
    writableClassIds,
}: {
    student: StaffStudentRow;
    showLearningRecordForm: boolean;
    writableClassIds: Set<string>;
}) {
    const statusMetadata = STUDENT_STATUS_METADATA[student.status];

    return (
        <div className={styles.detail}>
            <article className={cx(surfaceStyles.root, styles.panel)}>
                <div className={panelStyles.headCompact}>
                    <div>
                        <h2>{student.name}</h2>
                        <p>
                            {student.schoolName ?? "학교 미입력"}
                            {student.grade ? ` · ${student.grade}` : ""}학년
                        </p>
                    </div>
                    <StatusChip tone={statusMetadata.tone}>
                        {statusMetadata.label}
                    </StatusChip>
                </div>
                <ul className={styles.metaList}>
                    <li>
                        <strong>반</strong>
                        <span>
                            {student.classes.length > 0
                                ? student.classes
                                      .map((academyClass) => academyClass.name)
                                      .join(", ")
                                : "—"}
                        </span>
                    </li>
                    <li>
                        <strong>Google</strong>
                        <span>
                            {student.googleLinked
                                ? (student.email ?? "연동")
                                : "미연동"}
                        </span>
                    </li>
                    <li>
                        <strong>학부모</strong>
                        <span>
                            {student.parents.length > 0
                                ? student.parents
                                      .map(
                                          (parent) =>
                                              `${parent.name}${parent.relationship ? `(${parent.relationship})` : ""}`,
                                      )
                                      .join(", ")
                                : "—"}
                        </span>
                    </li>
                </ul>
            </article>
            {showLearningRecordForm && (
                <LearningRecordForm
                    key={student.id}
                    student={student}
                    writableClassIds={writableClassIds}
                />
            )}

            <div className={styles.grid}>
                <RecentAttendance student={student} />
                <RecentGrades student={student} />
            </div>
            <RecentLearningRecords student={student} />
        </div>
    );
}

/** 최근 출석 칩 목록. 수정 불가. */
function RecentAttendance({ student }: { student: StaffStudentRow }) {
    return (
        <article className={cx(surfaceStyles.root, styles.panel)}>
            <div className={panelStyles.headCompact}>
                <h2>최근 출결</h2>
            </div>
            {student.recentAttendance.length === 0 ? (
                <p className={typographyStyles.muted}>기록 없음</p>
            ) : (
                <ul className={styles.simpleList}>
                    {student.recentAttendance.map((attendance, index) => (
                        <li key={`${attendance.startsAt}-${index}`}>
                            <strong>
                                {
                                    ATTENDANCE_STATUS_METADATA[
                                        attendance.status
                                    ].label
                                }
                            </strong>
                            <span>
                                {attendance.className} ·
                                {formatStudentRecordDate(attendance.startsAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

/** 최근 성적 요약. 수정은 성적 화면. */
function RecentGrades({ student }: { student: StaffStudentRow }) {
    return (
        <article className={cx(surfaceStyles.root, styles.panel)}>
            <div className={panelStyles.headCompact}>
                <h2>최근 성적</h2>
            </div>
            {student.recentGrades.length === 0 ? (
                <p className={typographyStyles.muted}>기록 없음</p>
            ) : (
                <ul className={styles.simpleList}>
                    {student.recentGrades.map((grade) => (
                        <li key={grade.id}>
                            <strong>
                                {grade.score}/{grade.maxScore}
                            </strong>
                            <span>
                                {grade.subject} · {grade.title}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}

/** 최근 학습 기록 목록. 작성은 LearningRecordForm. */
function RecentLearningRecords({ student }: { student: StaffStudentRow }) {
    return (
        <article className={cx(surfaceStyles.root, styles.panel)}>
            <div className={panelStyles.headCompact}>
                <h2>학습 기록</h2>
            </div>
            {student.recentRecords.length === 0 ? (
                <p className={typographyStyles.muted}>
                    등록된 학습 기록이 없습니다.
                </p>
            ) : (
                <ul className={styles.simpleList}>
                    {student.recentRecords.map((record) => (
                        <li key={record.id}>
                            <strong>
                                {LEARNING_RECORD_TYPE_LABELS[record.type] ??
                                    record.type}
                                · {record.title}
                            </strong>
                            <span>
                                {formatStudentRecordDate(record.recordDate)} ·
                                {record.authorName}
                            </span>
                            <p>{record.content}</p>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
