"use client";

/**
 * `/signup` 2단계 온보딩 폼 (클라이언트).
 *
 * `useActionState(completeSignup)`로 이름·주소·학교·학년·전화를 제출한다.
 * 서버가 성공을 돌려주면 `onComplete`로 SignupFlow를 `complete` 단계로 올린다.
 * 이메일·역할은 폼에 없다 — 세션 JWT와 원장 부여 몫이다.
 *
 * props:
 * - onComplete: 저장 성공 후 스텝퍼만 올린다. redirect는 하지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 비밀번호·Google 토큰을 받지 않는다.
 * - STUDENT/PARENT로 올리지 않는다.
 * - 환영 화면에서 `/post-login`이 아니라 공개 홈 `/`로 안내한다.
 */

import Link from "next/link";
import { useActionState, useEffect } from "react";
import {
    buttonStyles,
    cx,
    fieldStyles,
    pageHeadingStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import { completeSignup, type SignupField, type SignupState } from "./actions";
import styles from "./page.module.css";

const initialSignupState: SignupState = {
    status: "idle",
    message: "",
    errors: {},
};

type SignupFormProps = {
    onComplete: () => void;
};

/** 온보딩 필드 제출과 성공 시 환영 카드를 그린다. */
export default function SignupForm({ onComplete }: SignupFormProps) {
    const [state, formAction, pending] = useActionState(
        completeSignup,
        initialSignupState,
    );
    const status = state?.status ?? "idle";
    const errors = state?.errors ?? {};

    useEffect(() => {
        if (status === "success") {
            onComplete();
        }
    }, [onComplete, status]);

    if (status === "success") {
        return (
            <section
                className={cx(surfaceStyles.root, styles.card, styles.welcomeCard)}
                aria-live="polite"
            >
                <div className={styles.successMark} aria-hidden="true">
                    ✓
                </div>
                <span className={pageHeadingStyles.eyebrow}>WELCOME TO A ACADEMY</span>
                <h1>{state?.userName}님, 환영합니다!</h1>
                <p>
                    A학원 가입 정보가 정상적으로 입력되었어요.
                    <br />
                    잠시 후 메인 화면으로 자동 이동합니다.
                </p>
                <div className={styles.welcomeInfo}>
                    <span>가입 상태</span>
                    <strong>추가 정보 입력 완료</strong>
                </div>
                <Link href="/" className={cx(buttonStyles.primaryLg, styles.primaryLink)}>
                    지금 메인으로 이동
                </Link>
            </section>
        );
    }

    return (
        <section className={cx(surfaceStyles.root, styles.card)}>
            <div className={styles.formHeading}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>ADDITIONAL INFO</span>
                    <h1>가입 정보를 알려주세요</h1>
                    <p>학원 서비스를 이용하기 위한 기본 정보예요.</p>
                </div>
                <div className={styles.accountChip}>
                    <span aria-hidden="true">G</span>
                    <div>
                        <strong>Google 로그인 단계 완료</strong>
                        <small>추가 가입 정보를 입력해 주세요</small>
                    </div>
                </div>
            </div>
            {state?.message && (
                <p className={cx(typographyStyles.error, styles.formError)} role="alert">
                    {state.message}
                </p>
            )}

            <form action={formAction} className={cx(fieldStyles.form, styles.signupForm)}>
                <Field
                    id="name"
                    label="이름"
                    placeholder="이름을 입력해 주세요"
                    error={errors.name}
                    autoComplete="name"
                />
                <Field
                    id="address"
                    label="주소"
                    placeholder="거주지 주소를 입력해 주세요"
                    error={errors.address}
                    autoComplete="street-address"
                />
                <div className={styles.fieldRow}>
                    <Field
                        id="school"
                        label="학교"
                        optional
                        placeholder="재학 중인 학교"
                        error={errors.school}
                    />
                    <Field
                        id="grade"
                        label="학년"
                        optional
                        placeholder="예: 2"
                        error={errors.grade}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                    />
                </div>
                <Field
                    id="phone"
                    label="번호"
                    optional
                    placeholder="010-0000-0000"
                    error={errors.phone}
                    inputMode="tel"
                    autoComplete="tel"
                />
                <button
                    className={cx(buttonStyles.primaryLg, styles.submitButton)}
                    type="submit"
                    disabled={pending}
                >
                    {pending ? "가입 정보를 확인하는 중..." : "가입 완료하기"}
                </button>
                <p className={cx(typographyStyles.hint, styles.privacyNotice)}>
                    입력한 정보는 학원 등록 확인과 서비스 제공을 위해서만
                    사용됩니다.
                </p>
            </form>
        </section>
    );
}

type FieldProps = {
    id: SignupField;
    label: string;
    placeholder: string;
    error?: string;
    optional?: boolean;
    defaultValue?: string;
    inputMode?: "text" | "numeric" | "tel";
    pattern?: string;
    maxLength?: number;
    autoComplete?: string;
};

/** 라벨·에러·선택 표시를 묶은 입력. `name`은 SignupField와 같게 둔다. */
function Field({
    id,
    label,
    placeholder,
    error,
    optional = false,
    ...inputProps
}: FieldProps) {
    const errorId = `${id}-error`;

    return (
        <label className={cx(fieldStyles.root, styles.field)} htmlFor={id}>
            <span>
                {label}
                {optional ? (
                    <small>선택사항</small>
                ) : (
                    <em aria-hidden="true">*</em>
                )}
            </span>
            <input
                className={cx(fieldStyles.control, styles.signupControl)}
                id={id}
                name={id}
                placeholder={placeholder}
                required={!optional}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                {...inputProps}
            />
            {error && (
                <small id={errorId} className={typographyStyles.error}>
                    {error}
                </small>
            )}
        </label>
    );
}
