"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 게스트 상담 문의 폼 (클라이언트).
 *
 * `useActionState(createInquiry)`로 보호자 이름·전화·학년·과목·희망 시간·본문을 낸다.
 * 제출자 `userId`를 문의 행에 안 남겨 GUEST 개인정보는 문의 테이블 필드에만 담는다.
 *
 * 성공 시 같은 URL에서 접수 완료 카드를 보여 주고, 재작성은 `/guest/inquiry` 링크.
 * 직원 상담 화면(`StaffCounselingScreen`, includeInquiries: true)이 이 건을 처리한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학생/학부모 계정을 만들지 않는다.
 * - 문의 상태를 게스트가 바꾸지 않는다 → `updateInquiryStatus` (직원).
 */

import { useActionState } from "react"; // 의존성. createInquiry. 원생 카드를 자동 만들지 않는다.
import { // 의존성. createInquiry. 원생 카드를 자동 만들지 않는다.
    createInquiry, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    type InquiryField, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    type InquiryState, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
} from "@/features/inquiries/actions"; // createInquiry. 원생 카드를 자동 만들지 않는다.
import { // 의존성. createInquiry. 원생 카드를 자동 만들지 않는다.
    buttonStyles, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    cx, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    fieldStyles, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    surfaceStyles, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    typographyStyles, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
} from "@/components/ui/shared-styles"; // createInquiry. 원생 카드를 자동 만들지 않는다.
import styles from "./GuestInquiryScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const initialState: InquiryState = { // useActionState 초기값. 상태 변경은 직원 몫.
    status: "idle", // status 필드.
    message: "", // message 필드.
    errors: {}, // errors 필드.
}; // 블록 끝.

/** 문의 접수 폼. 성공이면 완료 카드로 갈아탄다. */
export default function GuestInquiryForm() { // 이 파일의 화면. createInquiry. 원생 카드를 자동 만들지 않는다.
    const [state, formAction, pending] = useActionState( // createInquiry. 제출자 userId는 문의 행에 안 남긴다.
        createInquiry, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
        initialState, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    ); // 호출/그룹 끝.
    const errors = state.errors ?? {}; // 필드별 메시지.

    if (state.status === "success") { // 같은 URL에서 카드만. 재작성은 /guest/inquiry.
        return ( // JSX 반환. createInquiry. 원생 카드를 자동 만들지 않는다.
            <div className={cx(surfaceStyles.root, styles.success)} aria-live="polite">{/* 접수 완료. 원생 카드는 안 만든다. */}
                <span className={styles.successMark} aria-hidden="true">{/* 인라인 표시. */}
                    ✓{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
                </span>{/* span 닫기. */}
                <h2>문의가 접수되었습니다</h2>{/* 소제목. */}
                <p className={typographyStyles.hint}>{state.message}</p>{/* 문장. */}
                <a href="/guest/inquiry" className={cx(buttonStyles.secondary, styles.secondaryBtn)}>{/* 새 문의. 상태 변경 UI가 아니다. */}
                    새 문의 작성{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
                </a>{/* a 닫기. */}
            </div> // div 닫기.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    return ( // JSX 반환. createInquiry. 원생 카드를 자동 만들지 않는다.
        <form // 보호자·전화 필수. 원생 계정은 만들지 않는다.
            action={formAction} // action 필드.
            className={cx(surfaceStyles.root, fieldStyles.form, styles.form)} // className 필드.
            noValidate // createInquiry. 원생 카드를 자동 만들지 않는다.
        >{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
            {state.message && ( // 서버 범용 에러.
                <p className={cx(typographyStyles.error, styles.formError)} role="alert">{/* 문장. */}
                    {state.message}{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
                </p> // p 닫기.
            )}{/* 구문 끝. */}

            <Field // 보호자 이름. 학생 계정을 만들지 않는다.
                label="보호자 이름" // label 필드.
                name="guardianName" // name 필드.
                required // createInquiry. 원생 카드를 자동 만들지 않는다.
                placeholder="홍길동" // placeholder 필드.
                error={errors.guardianName} // error 필드.
            />{/* 구문 끝. */}
            <Field // 연락처 필수. 직원 상담이 처리.
                label="연락처" // label 필드.
                name="phone" // name 필드.
                type="tel" // type 필드.
                required // createInquiry. 원생 카드를 자동 만들지 않는다.
                placeholder="010-0000-0000" // placeholder 필드.
                error={errors.phone} // error 필드.
            />{/* 구문 끝. */}
            <Field // 학년 선택. STUDENT 역할로 올리지 않는다.
                label="학생 학년" // label 필드.
                name="studentGrade" // name 필드.
                placeholder="예: 중2" // placeholder 필드.
                error={errors.studentGrade} // error 필드.
            />{/* 구문 끝. */}
            <Field // Field. createInquiry. 원생 카드를 자동 만들지 않는다.
                label="희망 과목" // label 필드.
                name="interestedSubject" // name 필드.
                placeholder="예: 중등 수학" // placeholder 필드.
                error={errors.interestedSubject} // error 필드.
            />{/* 구문 끝. */}
            <Field // Field. createInquiry. 원생 카드를 자동 만들지 않는다.
                label="희망 상담 시간" // label 필드.
                name="preferredTime" // name 필드.
                placeholder="예: 평일 저녁" // placeholder 필드.
                error={errors.preferredTime} // error 필드.
            />{/* 구문 끝. */}

            <label className={cx(fieldStyles.root, styles.field)}>{/* 본문. 상태 변경은 직원 updateInquiryStatus. */}
                <span>문의 내용</span>{/* 인라인 표시. */}
                <textarea // 긴 입력. 서버에서 다시 검증한다.
                    className={cx(fieldStyles.control, fieldStyles.textarea, styles.inquiryTextarea)} // className 필드.
                    name="message" // name 필드.
                    rows={5} // rows 필드.
                    placeholder="학년, 과목, 상담할 내용을 적어 주세요" // placeholder 필드.
                    maxLength={1000} // maxLength 필드.
                />{/* 구문 끝. */}
                {errors.message && ( // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
                    <small className={typographyStyles.error}>{errors.message}</small> // 보조 문장.
                )}{/* 구문 끝. */}
            </label>{/* label 닫기. */}

            <button // pending이면 중복 접수를 막는다. 상태 변경은 직원 몫.
                type="submit" // type 필드.
                className={cx(buttonStyles.primaryLg, styles.primaryBtn)} // className 필드.
                disabled={pending} // disabled 필드.
            >{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
                {pending ? "접수 중…" : "문의 보내기"}{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
            </button>{/* button 닫기. */}
        </form> // form 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 라벨·에러를 묶은 입력. `name`은 InquiryField와 같다. */
function Field({ // 로컬 헬퍼. createInquiry. 원생 카드를 자동 만들지 않는다.
    label, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    name, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    type = "text", // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    required, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    placeholder, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    error, // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
}: { // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    label: string; // label 필드.
    name: InquiryField; // name 필드.
    type?: string; // type 필드.
    required?: boolean; // required 필드.
    placeholder?: string; // placeholder 필드.
    error?: string; // error 필드.
}) { // 구문. createInquiry. 원생 카드를 자동 만들지 않는다.
    return ( // name은 InquiryField와 같다.
        <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
            <span>{/* 인라인 표시. */}
                {label}{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
                {required ? " *" : ""}{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
            </span>{/* span 닫기. */}
            <input // createInquiry FormData 키.
                className={cx(fieldStyles.control, styles.inquiryControl)} // className 필드.
                type={type} // type 필드.
                name={name} // name 필드.
                required={required} // required 필드.
                placeholder={placeholder} // placeholder 필드.
                aria-invalid={Boolean(error)} // createInquiry. 원생 카드를 자동 만들지 않는다.
            />{/* 구문 끝. */}
            {error && <small className={typographyStyles.error}>{error}</small>}{/* createInquiry. 원생 카드를 자동 만들지 않는다. */}
        </label> // label 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
