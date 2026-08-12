import Link from "next/link";
import StatusChip from "@/components/ui/StatusChip";
import type { DirectorStudent } from "@/features/students/types";
import { STUDENT_STATUS_METADATA } from "@/features/students/presentation";
import styles from "../DirectorStudentsScreen.module.css";

export default function DirectorStudentTable({
    students,
    totalStudentCount,
    selectedStudentId,
    onSelect,
}: {
    students: DirectorStudent[];
    totalStudentCount: number;
    selectedStudentId: string | null;
    onSelect: (studentId: string) => void;
}) {
    if (students.length === 0) {
        return (
            <div className={styles.emptyPanel}>
                <h2>
                    {totalStudentCount === 0
                        ? "등록된 학생이 없습니다"
                        : "조건에 맞는 학생이 없습니다"}
                </h2>
                <p>
                    {totalStudentCount === 0
                        ? "가입 사용자에서 학생 역할을 부여하면 여기에 표시됩니다."
                        : "검색어나 필터를 바꿔보세요."}
                </p>
                {totalStudentCount === 0 && (
                    <Link href="/director/users" className={styles.headerLink}>
                        가입 사용자 보기
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className={styles.tableWrap}>
            <table>
                <thead>
                    <tr>
                        <th>학생</th>
                        <th>반</th>
                        <th>연동</th>
                        <th>학부모</th>
                        <th>상태</th>
                        <th>조치</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => {
                        const statusMetadata =
                            STUDENT_STATUS_METADATA[student.status];

                        return (
                            <tr
                                key={student.id}
                                className={
                                    selectedStudentId === student.id
                                        ? styles.activeRow
                                        : undefined
                                }
                            >
                                <td>
                                    <strong>{student.name}</strong>
                                    <small>
                                        {[student.schoolName, student.grade]
                                            .filter(Boolean)
                                            .join(" · ") || "학교·학년 미입력"}
                                    </small>
                                </td>
                                <td>
                                    {student.classes.length === 0 ? (
                                        <span className={styles.muted}>
                                            반 미배정
                                        </span>
                                    ) : (
                                        <div className={styles.chips}>
                                            {student.classes.map(
                                                (enrollment) => (
                                                    <span
                                                        key={
                                                            enrollment.enrollmentId
                                                        }
                                                        className={
                                                            styles.classChip
                                                        }
                                                    >
                                                        {enrollment.className}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <StatusChip
                                        tone={
                                            student.googleLinked
                                                ? "success"
                                                : "neutral"
                                        }
                                    >
                                        {student.googleLinked ? "연동" : "미연동"}
                                    </StatusChip>
                                </td>
                                <td>
                                    {student.parentCount > 0
                                        ? `${student.parentCount}명`
                                        : "—"}
                                </td>
                                <td>
                                    <StatusChip tone={statusMetadata.tone}>
                                        {statusMetadata.label}
                                    </StatusChip>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className={styles.actionBtn}
                                        onClick={() => onSelect(student.id)}
                                    >
                                        반 관리
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
