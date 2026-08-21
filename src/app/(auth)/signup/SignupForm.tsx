"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

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

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import { useActionState, useEffect } from "react"; // 의존성. completeSignup. 역할은 올리지 않는다.
import { // 의존성. completeSignup. 역할은 올리지 않는다.
    buttonStyles, // 구문. completeSignup. 역할은 올리지 않는다.
    cx, // 구문. completeSignup. 역할은 올리지 않는다.
    fieldStyles, // 구문. completeSignup. 역할은 올리지 않는다.
    pageHeadingStyles, // 구문. completeSignup. 역할은 올리지 않는다.
    surfaceStyles, // 구문. completeSignup. 역할은 올리지 않는다.
    typographyStyles, // 구문. completeSignup. 역할은 올리지 않는다.
} from "@/components/ui/shared-styles"; // completeSignup. 역할은 올리지 않는다.
import { completeSignup, type SignupField, type SignupState } from "./actions"; // 같은 라우트 모듈. completeSignup. 역할은 올리지 않는다.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const initialSignupState: SignupState = { // useActionState 초기값. 서버는 폼만 본다.
    status: "idle", // status 필드.
    message: "", // message 필드.
    errors: {}, // errors 필드.
}; // 블록 끝.

type SignupFormProps = { // 구문. completeSignup. 역할은 올리지 않는다.
    onComplete: () => void; // onComplete 필드.
}; // 블록 끝.

/** 온보딩 필드 제출과 성공 시 환영 카드를 그린다. */
export default function SignupForm({ onComplete }: SignupFormProps) { // 이 파일의 화면. completeSignup. 역할은 올리지 않는다.
    const [state, formAction, pending] = useActionState( // completeSignup. 이메일·역할은 폼에 없다.
        completeSignup, // 구문. completeSignup. 역할은 올리지 않는다.
        initialSignupState, // 구문. completeSignup. 역할은 올리지 않는다.
    ); // 호출/그룹 끝.
    const status = state?.status ?? "idle"; // idle/error/success. redirect 없음.
    const errors = state?.errors ?? {}; // 필드별 메시지.

    useEffect(() => { // 구문. completeSignup. 역할은 올리지 않는다.
        if (status === "success") { // 스텝퍼만 올린다. redirect는 하지 않는다.
            onComplete(); // completeSignup. 역할은 올리지 않는다.
        } // 블록 끝.
    }, [onComplete, status]); // completeSignup. 역할은 올리지 않는다.

    if (status === "success") { // 환영 카드. 역할은 여전히 GUEST.
        return ( // JSX 반환. completeSignup. 역할은 올리지 않는다.
            <section // /post-login이 아니라 공개 홈 / 로 안내.
                className={cx(surfaceStyles.root, styles.card, styles.welcomeCard)} // className 필드.
                aria-live="polite" // completeSignup. 역할은 올리지 않는다.
            >{/* completeSignup. 역할은 올리지 않는다. */}
                <div className={styles.successMark} aria-hidden="true">{/* 레이아웃 상자. */}
                    ✓{/* completeSignup. 역할은 올리지 않는다. */}
                </div>{/* div 닫기. */}
                <span className={pageHeadingStyles.eyebrow}>WELCOME TO A ACADEMY</span>{/* 인라인 표시. */}
                <h1>{state?.userName}님, 환영합니다!</h1>{/* 제목. */}
                <p>{/* 문장. */}
                    A학원 가입 정보가 정상적으로 입력되었어요.{/* completeSignup. 역할은 올리지 않는다. */}
                    <br />{/* 줄바꿈. */}
                    잠시 후 메인 화면으로 자동 이동합니다.{/* completeSignup. 역할은 올리지 않는다. */}
                </p>{/* p 닫기. */}
                <div className={styles.welcomeInfo}>{/* 온보딩 완료. 원장 역할 부여 대기. */}
                    <span>가입 상태</span>{/* 인라인 표시. */}
                    <strong>추가 정보 입력 완료</strong>{/* 강조. */}
                </div>{/* div 닫기. */}
                <Link href="/" className={cx(buttonStyles.primaryLg, styles.primaryLink)}>{/* 공개 홈. /post-login·역할 홈이 아니다. */}
                    지금 메인으로 이동{/* completeSignup. 역할은 올리지 않는다. */}
                </Link>{/* Link 닫기. */}
            </section> // section 닫기.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    return ( // JSX 반환. completeSignup. 역할은 올리지 않는다.
        <section className={cx(surfaceStyles.root, styles.card)}>{/* 온보딩 필드. Google 토큰·비밀번호 없음. */}
            <div className={styles.formHeading}>{/* 온보딩 필드 안내. */}
                <div>{/* 레이아웃 상자. */}
                    <span className={pageHeadingStyles.eyebrow}>ADDITIONAL INFO</span>{/* 인라인 표시. */}
                    <h1>가입 정보를 알려주세요</h1>{/* 제목. */}
                    <p>학원 서비스를 이용하기 위한 기본 정보예요.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <div className={styles.accountChip}>{/* Google 1단계 완료 표시. 역할은 아직 GUEST. */}
                    <span aria-hidden="true">G</span>{/* 인라인 표시. */}
                    <div>{/* 레이아웃 상자. */}
                        <strong>Google 로그인 단계 완료</strong>{/* 강조. */}
                        <small>추가 가입 정보를 입력해 주세요</small>{/* 보조 문장. */}
                    </div>{/* div 닫기. */}
                </div>{/* div 닫기. */}
            </div>{/* div 닫기. */}

            {state?.message && ( // 서버 범용 에러. 필드 에러는 Field.
                <p className={cx(typographyStyles.error, styles.formError)} role="alert">{/* 문장. */}
                    {state.message}{/* completeSignup. 역할은 올리지 않는다. */}
                </p> // p 닫기.
            )}{/* 구문 끝. */}

            <form action={formAction} className={cx(fieldStyles.form, styles.signupForm)}>{/* completeSignup. 이메일은 세션 JWT. */}
                <Field // 이름 필수. 원장 역할 부여·출석 명단에 그대로 쓰인다.
                    id="name" // id 필드.
                    label="이름" // label 필드.
                    placeholder="이름을 입력해 주세요" // placeholder 필드.
                    error={errors.name} // error 필드.
                    autoComplete="name" // autoComplete 필드.
                />{/* 구문 끝. */}
                <Field // 주소 필수. 학원 연락·등원 안내.
                    id="address" // id 필드.
                    label="주소" // label 필드.
                    placeholder="거주지 주소를 입력해 주세요" // placeholder 필드.
                    error={errors.address} // error 필드.
                    autoComplete="street-address" // autoComplete 필드.
                />{/* 구문 끝. */}

                <div className={styles.fieldRow}>{/* 학교·학년은 선택. STUDENT 역할로 올리지 않는다. */}
                    <Field // Field. completeSignup. 역할은 올리지 않는다.
                        id="school" // id 필드.
                        label="학교" // label 필드.
                        optional // completeSignup. 역할은 올리지 않는다.
                        placeholder="재학 중인 학교" // placeholder 필드.
                        error={errors.school} // error 필드.
                    />{/* 구문 끝. */}
                    <Field // Field. completeSignup. 역할은 올리지 않는다.
                        id="grade" // id 필드.
                        label="학년" // label 필드.
                        optional // completeSignup. 역할은 올리지 않는다.
                        placeholder="예: 2" // placeholder 필드.
                        error={errors.grade} // error 필드.
                        inputMode="numeric" // inputMode 필드.
                        pattern="[0-9]*" // pattern 필드.
                        maxLength={2} // maxLength 필드.
                    />{/* 구문 끝. */}
                </div>{/* div 닫기. */}

                <Field // 전화 선택. 이메일은 폼에 없다.
                    id="phone" // id 필드.
                    label="번호" // label 필드.
                    optional // completeSignup. 역할은 올리지 않는다.
                    placeholder="010-0000-0000" // placeholder 필드.
                    error={errors.phone} // error 필드.
                    inputMode="tel" // inputMode 필드.
                    autoComplete="tel" // autoComplete 필드.
                />{/* 구문 끝. */}

                <button // pending이면 중복 저장을 막는다.
                    className={cx(buttonStyles.primaryLg, styles.submitButton)} // className 필드.
                    type="submit" // type 필드.
                    disabled={pending} // disabled 필드.
                >{/* completeSignup. 역할은 올리지 않는다. */}
                    {pending ? "가입 정보를 확인하는 중..." : "가입 완료하기"}{/* completeSignup. 역할은 올리지 않는다. */}
                </button>{/* button 닫기. */}
                <p className={cx(typographyStyles.hint, styles.privacyNotice)}>{/* 문장. */}
                    입력한 정보는 학원 등록 확인과 서비스 제공을 위해서만{/* completeSignup. 역할은 올리지 않는다. */}
                    사용됩니다.{/* completeSignup. 역할은 올리지 않는다. */}
                </p>{/* p 닫기. */}
            </form>{/* form 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

type FieldProps = { // 구문. completeSignup. 역할은 올리지 않는다.
    id: SignupField; // id 필드.
    label: string; // label 필드.
    placeholder: string; // placeholder 필드.
    error?: string; // error 필드.
    optional?: boolean; // optional 필드.
    defaultValue?: string; // defaultValue 필드.
    inputMode?: "text" | "numeric" | "tel"; // inputMode 필드.
    pattern?: string; // pattern 필드.
    maxLength?: number; // maxLength 필드.
    autoComplete?: string; // autoComplete 필드.
}; // 블록 끝.

/** 라벨·에러·선택 표시를 묶은 입력. `name`은 SignupField와 같게 둔다. */
function Field({ // 로컬 헬퍼. completeSignup. 역할은 올리지 않는다.
    id, // 구문. completeSignup. 역할은 올리지 않는다.
    label, // 구문. completeSignup. 역할은 올리지 않는다.
    placeholder, // 구문. completeSignup. 역할은 올리지 않는다.
    error, // 구문. completeSignup. 역할은 올리지 않는다.
    optional = false, // 구문. completeSignup. 역할은 올리지 않는다.
    ...inputProps // completeSignup. 역할은 올리지 않는다.
}: FieldProps) { // 구문. completeSignup. 역할은 올리지 않는다.
    const errorId = `${id}-error`; // 필드 에러 id. completeSignup errors 키와 맞춘다.

    return ( // name은 SignupField와 같게. 선택 항목은 required 해제.
        <label className={cx(fieldStyles.root, styles.field)} htmlFor={id}>{/* 필드 라벨. */}
            <span>{/* 인라인 표시. */}
                {label}{/* completeSignup. 역할은 올리지 않는다. */}
                {optional ? ( // 구문. completeSignup. 역할은 올리지 않는다.
                    <small>선택사항</small> // 보조 문장.
                ) : ( // 구문. completeSignup. 역할은 올리지 않는다.
                    <em aria-hidden="true">*</em> // em. completeSignup. 역할은 올리지 않는다.
                )}{/* 구문 끝. */}
            </span>{/* span 닫기. */}
            <input // 서버 Action FormData 키. 이메일 필드가 없다.
                className={cx(fieldStyles.control, styles.signupControl)} // className 필드.
                id={id} // id 필드.
                name={id} // name 필드.
                placeholder={placeholder} // placeholder 필드.
                required={!optional} // required 필드.
                aria-invalid={Boolean(error)} // completeSignup. 역할은 올리지 않는다.
                aria-describedby={error ? errorId : undefined} // completeSignup. 역할은 올리지 않는다.
                {...inputProps} // completeSignup. 역할은 올리지 않는다.
            />{/* 구문 끝. */}
            {error && ( // 필드 검증 실패. 부분 저장 없음.
                <small id={errorId} className={typographyStyles.error}>{/* 보조 문장. */}
                    {error}{/* completeSignup. 역할은 올리지 않는다. */}
                </small> // small 닫기.
            )}{/* 구문 끝. */}
        </label> // label 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
