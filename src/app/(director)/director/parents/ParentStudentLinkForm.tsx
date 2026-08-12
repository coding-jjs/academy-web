"use client";

import { useActionState, useEffect, useRef } from "react";
import {
    linkParentStudent,
    type ParentLinkState,
} from "@/features/families/actions";
import { formatStudentOptionLabel } from "@/features/students/presentation";
import styles from "./page.module.css";

const initialState: ParentLinkState = {
    status: "idle",
    message: "",
};

type ParentOption = {
    id: string;
    name: string;
    email: string;
};

type StudentOption = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
};

function getUnavailableMessage(parentCount: number, studentCount: number) {
    if (parentCount === 0 && studentCount === 0) {
        return "연결 가능한 학부모와 학생 계정이 없습니다.";
    }

    if (parentCount === 0) {
        return "연결 가능한 학부모 계정이 없습니다.";
    }

    if (studentCount === 0) {
        return "학부모가 연결되지 않은 학생이 없습니다.";
    }

    return null;
}

export default function ParentStudentLinkForm({
    parents,
    students,
}: {
    parents: ParentOption[];
    students: StudentOption[];
}) {
    const formRef = useRef<HTMLFormElement>(null);
    const unavailableMessage = getUnavailableMessage(
        parents.length,
        students.length,
    );
    const [state, formAction, pending] = useActionState(
        linkParentStudent,
        initialState,
    );

    useEffect(() => {
        if (state.status === "success") {
            formRef.current?.reset();
        }
    }, [state.status]);

    return (
        <form
            ref={formRef}
            action={formAction}
            className={styles.linkForm}
        >
            <header className={styles.formHeader}>
                <div className={styles.formIcon} aria-hidden="true">
                    +
                </div>
                <div className={styles.formHeading}>
                    <span className={styles.sectionLabel}>
                        FAMILY CONNECTION
                    </span>
                    <h2>새로운 가족 연결</h2>
                    <p>가입이 완료된 학부모와 학생 계정을 연결합니다.</p>
                </div>
            </header>

            <div className={styles.formGrid}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        학부모 <small>필수</small>
                    </span>
                    <select
                        name="parentUserId"
                        defaultValue=""
                        required
                        disabled={pending || parents.length === 0}
                    >
                        <option value="" disabled>
                            학부모를 선택해 주세요
                        </option>
                        {parents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                                {parent.name} · {parent.email}
                            </option>
                        ))}
                    </select>
                    <small className={styles.fieldHint}>
                        한 학부모에게 여러 자녀를 연결할 수 있습니다.
                    </small>
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        학생 <small>필수</small>
                    </span>
                    <select
                        name="studentId"
                        defaultValue=""
                        required
                        disabled={pending || students.length === 0}
                    >
                        <option value="" disabled>
                            학생을 선택해 주세요
                        </option>
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {formatStudentOptionLabel(student)}
                            </option>
                        ))}
                    </select>
                    <small className={styles.fieldHint}>
                        현재 학부모가 연결되지 않은 학생만 표시됩니다.
                    </small>
                </label>

                <label className={styles.field}>
                    <span className={styles.fieldLabel}>
                        학생과의 관계 <small>필수</small>
                    </span>
                    <select
                        name="relationship"
                        defaultValue=""
                        required
                        disabled={pending}
                    >
                        <option value="" disabled>
                            관계를 선택해 주세요
                        </option>
                        <option value="어머니">어머니</option>
                        <option value="아버지">아버지</option>
                        <option value="조부모">조부모</option>
                        <option value="기타 보호자">기타 보호자</option>
                    </select>
                    <small className={styles.fieldHint}>
                        학부모 계정과 학생의 관계입니다.
                    </small>
                </label>
            </div>

            <footer className={styles.formFooter}>
                <div className={styles.feedbackArea} aria-live="polite">
                    {unavailableMessage ? (
                        <p className={styles.notice}>{unavailableMessage}</p>
                    ) : state.message ? (
                        <p
                            role={
                                state.status === "error" ? "alert" : "status"
                            }
                            className={`${styles.feedback} ${
                                state.status === "success"
                                    ? styles.feedbackSuccess
                                    : styles.feedbackError
                            }`}
                        >
                            <span aria-hidden="true">
                                {state.status === "success" ? "✓" : "!"}
                            </span>
                            {state.message}
                        </p>
                    ) : (
                        <p className={styles.defaultHint}>
                            연결 후 학부모 계정에서 자녀 정보를 확인할 수
                            있습니다.
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={Boolean(unavailableMessage) || pending}
                >
                    {pending && (
                        <span className={styles.spinner} aria-hidden="true" />
                    )}
                    {pending ? "연결하는 중…" : "학부모 연결"}
                </button>
            </footer>
        </form>
    );
}
