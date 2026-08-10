"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { assignUserRole } from "./actions";
import styles from "./page.module.css";

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
            <label htmlFor={selectId}>부여할 역할</label>
            <div className={styles.roleControls}>
                <select
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
                    <option value="TEACHER">선생님</option>
                    <option value="STAFF">직원</option>
                    <option value="PARENT">학부모</option>
                    <option
                        value="STUDENT"
                        disabled={students.length === 0 || hasStudentProfile}
                    >
                        학생
                    </option>
                </select>
                <AssignButton />
            </div>
            {role === "STUDENT" && (
                <div className={styles.studentLinkField}>
                    <label htmlFor={studentSelectId}>연결할 기존 학생</label>
                    <select
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
                <p className={styles.roleHint}>
                    기존 학생 계정의 재등록은 학생 관리에서 처리하세요.
                </p>
            )}
        </form>
    );
}

function formatStudentOption(student: {
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: "ENROLLED" | "PAUSED" | "WITHDRAWN";
}) {
    const profile = [
        student.schoolName,
        student.grade && `${student.grade}학년`,
    ]
        .filter(Boolean)
        .join(" · ");
    const status = student.status === "PAUSED" ? "휴원" : "재원";
    return `${student.name}${profile ? ` · ${profile}` : ""} (${status})`;
}

function AssignButton() {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending}>
            {pending ? "부여 중…" : "역할 부여"}
        </button>
    );
}
