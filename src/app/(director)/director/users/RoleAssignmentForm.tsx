"use client";

/**
 * GUEST 역할 부여 폼 (클라이언트).
 *
 * 제출: `assignUserRole`. GUEST만 대상 — 이미 역할 있는 유저를 덮어쓰지 않는다.
 * STUDENT를 고르면 미연결 원생 카드가 필요하다.
 *
 * props: userId, userName, students, hasStudentProfile.
 */

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { assignUserRole } from "@/features/users/actions";
import {
    formatStudentOptionLabel,
    STUDENT_STATUS_METADATA,
} from "@/features/students/presentation";
import {
    buttonStyles,
    cx,
    fieldStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import { roleLabels } from "@/lib/role-routes";
import styles from "./page.module.css";

/** 역할 select와 (학생이면) 원생 카드 선택을 제출한다. */
export default function RoleAssignmentForm({
    userId,
    userName,
    students,
    hasStudentProfile,
}: {
    userId: string;
    userName: string;
    hasStudentProfile: boolean;
    students: Array<{
        id: string;
        name: string;
        schoolName: string | null;
        grade: string | null;
        status: "ENROLLED" | "PAUSED" | "WITHDRAWN";
    }>;
}) {
    const selectId = `role-${userId}`;
    const studentSelectId = `student-${userId}`;
    const [role, setRole] = useState("");

    return (
        <form action={assignUserRole} className={styles.roleForm}>
            <input type="hidden" name="userId" value={userId} />
            <label className={typographyStyles.muted} htmlFor={selectId}>
                부여할 역할
            </label>
            <div className={styles.roleControls}>
                <select
                    className={cx(fieldStyles.select, styles.roleSelect)}
                    id={selectId}
                    name="role"
                    defaultValue=""
                    onChange={(event) => setRole(event.target.value)}
                    aria-label={`${userName} 역할 선택`}
                    required
                >
                    <option value="" disabled>
                        역할을 선택하세요
                    </option>
                    <option value="TEACHER">{roleLabels.TEACHER}</option>
                    <option value="STAFF">{roleLabels.STAFF}</option>
                    <option value="PARENT">{roleLabels.PARENT}</option>
                    <option
                        value="STUDENT"
                        disabled={students.length === 0 || hasStudentProfile}
                    >
                        {roleLabels.STUDENT}
                    </option>
                </select>
                <AssignButton />
            </div>
            {role === "STUDENT" && (
                <div className={cx(fieldStyles.root, styles.studentLinkField)}>
                    <label htmlFor={studentSelectId}>연결할 기존 학생</label>
                    <select
                        className={cx(fieldStyles.select, styles.studentSelect)}
                        id={studentSelectId}
                        name="studentId"
                        defaultValue=""
                        required
                    >
                        <option value="" disabled>
                            학생을 선택하세요
                        </option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {formatStudentOption(student)}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            {hasStudentProfile && (
                <p className={cx(typographyStyles.hint, styles.roleHint)}>
                    기존 학생 계정의 재등록은 학생 관리에서 처리하세요.
                </p>
            )}
        </form>
    );
}

/** select 옵션 라벨. 학교·학년·재원 상태를 붙인다. */
function formatStudentOption(student: {
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: "ENROLLED" | "PAUSED" | "WITHDRAWN";
}) {
    const status = STUDENT_STATUS_METADATA[student.status].label;
    return `${formatStudentOptionLabel(student)} (${status})`;
}

/** 제출 중이면 버튼을 잠근다. */
function AssignButton() {
    const { pending } = useFormStatus();

    return (
        <button type="submit" className={buttonStyles.assign} disabled={pending}>
            {pending ? "부여 중…" : "역할 부여"}
        </button>
    );
}
