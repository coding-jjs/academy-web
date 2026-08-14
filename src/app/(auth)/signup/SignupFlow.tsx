"use client";

import { useCallback, useState } from "react";
import {
    cx,
    pageHeadingStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import SignupForm from "./SignupForm";
import styles from "./page.module.css";

type SignupStep = "google" | "details" | "complete";
type StepState = "complete" | "current" | "upcoming";
type SignupFlowProps = {
    googleVerified: boolean;
    googleSignInAction: () => Promise<void>;
};

export default function SignupFlow({
    googleVerified,
    googleSignInAction,
}: SignupFlowProps) {
    const [step, setStep] = useState<SignupStep>(
        googleVerified ? "details" : "google",
    );
    const completeFlow = useCallback(() => setStep("complete"), []);

    return (
        <>
            <ol className={styles.steps} aria-label="회원가입 진행 단계">
                <Step
                    number="1"
                    label="Google 로그인"
                    state={getStepState(step, "google")}
                />
                <Step
                    number="2"
                    label="정보 입력"
                    state={getStepState(step, "details")}
                />
                <Step
                    number="3"
                    label="가입 완료"
                    state={getStepState(step, "complete")}
                />
            </ol>

            {step === "google" ? (
                <section className={cx(surfaceStyles.root, styles.card)}>
                    <div className={styles.authIntro}>
                        <span className={pageHeadingStyles.eyebrow}>JOIN A ACADEMY</span>
                        <h1>A학원과 함께 시작해요</h1>
                        <p>
                            Google 로그인 버튼을 누른 뒤
                            <br />
                            필요한 가입 정보를 입력해 주세요.
                        </p>
                    </div>

                    <form action={googleSignInAction}>
                        <button className={styles.googleButton} type="submit">
                            <GoogleMark />
                            <span>Google 계정으로 회원가입</span>
                        </button>
                    </form>

                    <div className={styles.authBenefits}>
                        <div>
                            <span aria-hidden="true">✓</span>
                            별도의 계정 인증 없이 간편하게 진행
                        </div>
                        <div>
                            <span aria-hidden="true">✓</span>
                            버튼 클릭 후 추가 정보 입력
                        </div>
                    </div>

                    <p className={cx(typographyStyles.hint, styles.terms)}>
                        계속하면 A학원의 서비스 이용약관 및 개인정보 처리방침에
                        동의하는 것으로 간주합니다.
                    </p>
                </section>
            ) : (
                <SignupForm onComplete={completeFlow} />
            )}
        </>
    );
}

function getStepState(current: SignupStep, target: SignupStep): StepState {
    const order: SignupStep[] = ["google", "details", "complete"];
    const currentIndex = order.indexOf(current);
    const targetIndex = order.indexOf(target);

    if (targetIndex < currentIndex) return "complete";
    if (targetIndex === currentIndex) return "current";
    return "upcoming";
}

function Step({
    number,
    label,
    state,
}: {
    number: string;
    label: string;
    state: StepState;
}) {
    return (
        <li
            className={styles[state]}
            aria-current={state === "current" ? "step" : undefined}
        >
            <span>{state === "complete" ? "✓" : number}</span>
            <strong>{label}</strong>
        </li>
    );
}

function GoogleMark() {
    return (
        <svg
            className={styles.googleMark}
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.4Z"
            />
            <path
                fill="#34A853"
                d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
            />
            <path
                fill="#FBBC05"
                d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
            />
            <path
                fill="#EA4335"
                d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
            />
        </svg>
    );
}
