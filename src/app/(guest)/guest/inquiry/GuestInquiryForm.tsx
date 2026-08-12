"use client";

import { useActionState } from "react";
import {
    createInquiry,
    type InquiryField,
    type InquiryState,
} from "@/features/inquiries/actions";
import styles from "./GuestInquiryScreen.module.css";

const initialState: InquiryState = {
    status: "idle",
    message: "",
    errors: {},
};

export default function GuestInquiryForm() {
    const [state, formAction, pending] = useActionState(
        createInquiry,
        initialState,
    );
    const errors = state.errors ?? {};

    if (state.status === "success") {
        return (
            <div className={styles.success} aria-live="polite">
                <span className={styles.successMark} aria-hidden="true">
                    ✓
                </span>
                <h2>문의가 접수되었습니다</h2>
                <p>{state.message}</p>
                <a href="/guest/inquiry" className={styles.secondaryBtn}>
                    새 문의 작성
                </a>
            </div>
        );
    }

    return (
        <form action={formAction} className={styles.form} noValidate>
            {state.message && (
                <p className={styles.formError} role="alert">
                    {state.message}
                </p>
            )}

            <Field
                label="보호자 이름"
                name="guardianName"
                required
                placeholder="홍길동"
                error={errors.guardianName}
            />
            <Field
                label="연락처"
                name="phone"
                type="tel"
                required
                placeholder="010-0000-0000"
                error={errors.phone}
            />
            <Field
                label="학생 학년"
                name="studentGrade"
                placeholder="예: 중2"
                error={errors.studentGrade}
            />
            <Field
                label="희망 과목"
                name="interestedSubject"
                placeholder="예: 중등 수학"
                error={errors.interestedSubject}
            />
            <Field
                label="희망 상담 시간"
                name="preferredTime"
                placeholder="예: 평일 저녁"
                error={errors.preferredTime}
            />

            <label className={styles.field}>
                <span>문의 내용</span>
                <textarea
                    name="message"
                    rows={5}
                    placeholder="학년, 과목, 상담할 내용을 적어 주세요"
                    maxLength={1000}
                />
                {errors.message && (
                    <small className={styles.fieldError}>{errors.message}</small>
                )}
            </label>

            <button type="submit" className={styles.primaryBtn} disabled={pending}>
                {pending ? "접수 중…" : "문의 보내기"}
            </button>
        </form>
    );
}

function Field({
    label,
    name,
    type = "text",
    required,
    placeholder,
    error,
}: {
    label: string;
    name: InquiryField;
    type?: string;
    required?: boolean;
    placeholder?: string;
    error?: string;
}) {
    return (
        <label className={styles.field}>
            <span>
                {label}
                {required ? " *" : ""}
            </span>
            <input
                type={type}
                name={name}
                required={required}
                placeholder={placeholder}
                aria-invalid={Boolean(error)}
            />
            {error && <small className={styles.fieldError}>{error}</small>}
        </label>
    );
}
