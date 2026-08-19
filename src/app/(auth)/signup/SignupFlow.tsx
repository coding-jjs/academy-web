"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * `/signup` 가입 단계 클라이언트 UI.
 *
 * Server Component가 아니라 클라이언트다. 단계 상태(`google` / `details` /
 * `complete`)를 브라우저에서 올리고, Google 제출은 서버 페이지가 넘긴
 * `signUpWithGoogle` Server Action에 맡긴다.
 *
 * props:
 * - googleVerified: 세션에 user.id가 있으면 1단계를 건너뛴다.
 * - googleSignInAction: `signUpWithGoogle`. 로그인용 `signInWithGoogle`이 아니다.
 *
 * 상세 입력은 `SignupForm` → `completeSignup`. 이 파일은 폼 필드를 저장하지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 역할을 올리지 않는다.
 * - `/post-login`으로 보내지 않는다. 환영 화면 이동은 SignupForm이 `/` 링크를 연다.
 */

import { useCallback, useState } from "react"; // 의존성. Google 1단계 또는 상세 폼. 역할 부여는 원장.
import { // 의존성. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    cx, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    pageHeadingStyles, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    surfaceStyles, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    typographyStyles, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
} from "@/components/ui/shared-styles"; // Google 1단계 또는 상세 폼. 역할 부여는 원장.
import SignupForm from "./SignupForm"; // 같은 라우트 모듈. Google 1단계 또는 상세 폼. 역할 부여는 원장.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

type SignupStep = "google" | "details" | "complete"; // Google 1단계 또는 상세 폼. 역할 부여는 원장.
type StepState = "complete" | "current" | "upcoming"; // Google 1단계 또는 상세 폼. 역할 부여는 원장.
type SignupFlowProps = { // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    googleVerified: boolean; // googleVerified 필드.
    googleSignInAction: () => Promise<void>; // googleSignInAction 필드.
}; // 블록 끝.

/** Google → 정보 입력 → 완료 스텝퍼와 현재 단계 본문을 그린다. */
export default function SignupFlow({ // 이 파일의 화면. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    googleVerified, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    googleSignInAction, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
}: SignupFlowProps) { // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    const [step, setStep] = useState<SignupStep>( // Google 세션이 있으면 1단계를 건너뛰고 상세 입력부터.
        googleVerified ? "details" : "google", // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    ); // 호출/그룹 끝.
    const completeFlow = useCallback(() => setStep("complete"), []); // 스텝퍼만 올린다. redirect는 하지 않는다.

    return ( // JSX 반환. Google 1단계 또는 상세 폼. 역할 부여는 원장.
        <>{/* 요소. Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
            <ol className={styles.steps} aria-label="회원가입 진행 단계">{/* Google → 정보 입력 → 완료. 저장은 SignupForm. */}
                <Step // 1단계 Google. intent=signup.
                    number="1" // number 필드.
                    label="Google 로그인" // label 필드.
                    state={getStepState(step, "google")} // state 필드.
                />{/* 구문 끝. */}
                <Step // 2단계 프로필. completeSignup.
                    number="2" // number 필드.
                    label="정보 입력" // label 필드.
                    state={getStepState(step, "details")} // state 필드.
                />{/* 구문 끝. */}
                <Step // 3단계 환영. 역할은 올리지 않는다.
                    number="3" // number 필드.
                    label="가입 완료" // label 필드.
                    state={getStepState(step, "complete")} // state 필드.
                />{/* 구문 끝. */}
            </ol>{/* ol 닫기. */}

            {step === "google" ? ( // 미로그인. signUpWithGoogle. 로그인용 signInWithGoogle이 아니다.
                <section className={cx(surfaceStyles.root, styles.card)}>{/* Google 가입 카드. 역할 부여 UI가 아니다. */}
                    <div className={styles.authIntro}>{/* 1단계 안내. 신규 GUEST 생성. */}
                        <span className={pageHeadingStyles.eyebrow}>JOIN A ACADEMY</span>{/* 인라인 표시. */}
                        <h1>A학원과 함께 시작해요</h1>{/* 제목. */}
                        <p>{/* 문장. */}
                            Google 로그인 버튼을 누른 뒤{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                            <br />{/* 줄바꿈. */}
                            필요한 가입 정보를 입력해 주세요.{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                        </p>{/* p 닫기. */}
                    </div>{/* div 닫기. */}

                    <form action={googleSignInAction}>{/* signUpWithGoogle(intent=signup). 미등록이면 GUEST를 만든다. */}
                        <button className={styles.googleButton} type="submit">{/* 로그인 페이지 Google과 의도가 다르다. */}
                            <GoogleMark />{/* GoogleMark. Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                            <span>Google 계정으로 회원가입</span>{/* 인라인 표시. */}
                        </button>{/* button 닫기. */}
                    </form>{/* form 닫기. */}

                    <div className={styles.authBenefits}>{/* 레이아웃 상자. */}
                        <div>{/* 레이아웃 상자. */}
                            <span aria-hidden="true">✓</span>{/* 인라인 표시. */}
                            별도의 계정 인증 없이 간편하게 진행{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                        </div>{/* div 닫기. */}
                        <div>{/* 레이아웃 상자. */}
                            <span aria-hidden="true">✓</span>{/* 인라인 표시. */}
                            버튼 클릭 후 추가 정보 입력{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                        </div>{/* div 닫기. */}
                    </div>{/* div 닫기. */}

                    <p className={cx(typographyStyles.hint, styles.terms)}>{/* 문장. */}
                        계속하면 A학원의 서비스 이용약관 및 개인정보 처리방침에{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                        동의하는 것으로 간주합니다.{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
                    </p>{/* p 닫기. */}
                </section> // section 닫기.
            ) : ( // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
                <SignupForm onComplete={completeFlow} /> // 상세 폼 또는 환영. 역할은 올리지 않는다.
            )}{/* 구문 끝. */}
        </> // 구문 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 현재 단계 기준으로 완료/진행/대기 표시를 나눈다. */
function getStepState(current: SignupStep, target: SignupStep): StepState { // 로컬 헬퍼. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    const order: SignupStep[] = ["google", "details", "complete"]; // 표시 순서만. 저장은 SignupForm.
    const currentIndex = order.indexOf(current); // 현재 단계 위치.
    const targetIndex = order.indexOf(target); // 이 칸의 위치.

    if (targetIndex < currentIndex) return "complete"; // 이미 지난 단계.
    if (targetIndex === currentIndex) return "current"; // 지금 칸.
    return "upcoming"; // 아직 안 온 칸.
} // 블록 끝.

/** 스텝퍼 한 칸. current일 때만 `aria-current="step"`. */
function Step({ // 로컬 헬퍼. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    number, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    label, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    state, // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
}: { // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    number: string; // number 필드.
    label: string; // label 필드.
    state: StepState; // state 필드.
}) { // 구문. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    return ( // current일 때만 aria-current="step".
        <li // 항목.
            className={styles[state]} // className 필드.
            aria-current={state === "current" ? "step" : undefined} // Google 1단계 또는 상세 폼. 역할 부여는 원장.
        >{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
            <span>{state === "complete" ? "✓" : number}</span>{/* 인라인 표시. */}
            <strong>{label}</strong>{/* 강조. */}
        </li> // li 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** Google 브랜드 마크 SVG. 버튼 장식만. */
function GoogleMark() { // 로컬 헬퍼. Google 1단계 또는 상세 폼. 역할 부여는 원장.
    return ( // 버튼 안 SVG. 클릭 타깃이 아니다.
        <svg // 아이콘.
            className={styles.googleMark} // className 필드.
            viewBox="0 0 24 24" // viewBox 필드.
            aria-hidden="true" // Google 1단계 또는 상세 폼. 역할 부여는 원장.
        >{/* Google 1단계 또는 상세 폼. 역할 부여는 원장. */}
            <path // 아이콘 path.
                fill="#4285F4" // fill 필드.
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.4Z" // d 필드.
            />{/* 구문 끝. */}
            <path // 아이콘 path.
                fill="#34A853" // fill 필드.
                d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" // d 필드.
            />{/* 구문 끝. */}
            <path // 아이콘 path.
                fill="#FBBC05" // fill 필드.
                d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z" // d 필드.
            />{/* 구문 끝. */}
            <path // 아이콘 path.
                fill="#EA4335" // fill 필드.
                d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" // d 필드.
            />{/* 구문 끝. */}
        </svg> // svg 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
