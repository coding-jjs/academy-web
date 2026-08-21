"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학부모-학생 연결 폼 (클라이언트).
 *
 * `useActionState(linkParentStudent)`. 원장만 가족 관계를 만든다.
 * props: parents, students — 연결 가능한 계정. 학부모가 스스로 묶지 못한다.
 */

import { useActionState, useEffect, useRef } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    linkParentStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    type ParentLinkState, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/families/actions"; // 원장 Screen. layout requireRole DIRECTOR.
import { formatStudentOptionLabel } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    spinnerStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const initialState: ParentLinkState = { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    status: "idle", // status 필드.
    message: "", // message 필드.
}; // 블록 끝.

type ParentOption = { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    id: string; // id 필드.
    name: string; // name 필드.
    email: string; // email 필드.
}; // 블록 끝.

type StudentOption = { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    id: string; // id 필드.
    name: string; // name 필드.
    schoolName: string | null; // schoolName 필드.
    grade: string | null; // grade 필드.
}; // 블록 끝.

/** 연결할 쌍이 없을 때 폼 대신 보여줄 안내. */
function getUnavailableMessage(parentCount: number, studentCount: number) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    if (parentCount === 0 && studentCount === 0) { // 후보가 없으면 폼 대신 안내. 학부모가 스스로 묶지 못하게 후보를 data가 걸러 둔다.
        return "연결 가능한 학부모와 학생 계정이 없습니다."; // 반환. 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    if (parentCount === 0) { // 분기. 원장 Screen. layout requireRole DIRECTOR.
        return "연결 가능한 학부모 계정이 없습니다."; // 반환. 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    if (studentCount === 0) { // 분기. 원장 Screen. layout requireRole DIRECTOR.
        return "학부모가 연결되지 않은 학생이 없습니다."; // 반환. 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    return null; // 반환. 원장 Screen. layout requireRole DIRECTOR.
} // 블록 끝.

/** 학부모·학생 select를 묶어 연결을 제출한다. */
export default function ParentStudentLinkForm({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    parents, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    students, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    parents: ParentOption[]; // parents 필드.
    students: StudentOption[]; // students 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const formRef = useRef<HTMLFormElement>(null); // 성공 시 reset. 역할을 안 바꾼다.
    const unavailableMessage = getUnavailableMessage( // 구문. 원장 Screen. layout requireRole DIRECTOR.
        parents.length, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        students.length, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.
    const [state, formAction, pending] = useActionState( // Server Action 상태. 클라이언트에서 DB를 치지 않는다.
        linkParentStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        initialState, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.

    useEffect(() => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
        if (state.status === "success") { // 연결 후 셀렉트를 비워 같은 쌍을 다시 제출하지 않게.
            formRef.current?.reset(); // 원장 Screen. layout requireRole DIRECTOR.
        } // 블록 끝.
    }, [state.status]); // 원장 Screen. layout requireRole DIRECTOR.

    return ( // 원장만 연결. linkParentStudent.
        <form // 원장만 연결. linkParentStudent.
            ref={formRef} // ref 필드.
            action={formAction} // action 필드.
            className={cx(surfaceStyles.soft, styles.linkForm)} // className 필드.
        >{/* 원장 Screen. layout requireRole DIRECTOR. */}
            <header className={styles.formHeader}>{/* 새 가족 연결 */}
                <div className={styles.formIcon} aria-hidden="true">{/* 레이아웃 상자. */}
                    +{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
                <div className={styles.formHeading}>{/* 레이아웃 상자. */}
                    <span className={pageHeadingStyles.sectionLabel}>{/* 인라인 표시. */}
                        FAMILY CONNECTION{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </span>{/* span 닫기. */}
                    <h2>새로운 가족 연결</h2>{/* 소제목. */}
                    <p className={typographyStyles.hint}>가입이 완료된 학부모와 학생 계정을 연결합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.formGrid}>{/* 학부모·학생·관계 select */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* ACTIVE PARENT + 온보딩 완료. GUEST로 떨어진 계정은 없다. */}
                    <span className={styles.fieldLabel}>{/* 인라인 표시. */}
                        학부모 <small>필수</small>{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </span>{/* span 닫기. */}
                    <select // 선택. 서버에서 다시 검증한다.
                        className={fieldStyles.select} // className 필드.
                        name="parentUserId" // name 필드.
                        defaultValue="" // defaultValue 필드.
                        required // 원장 Screen. layout requireRole DIRECTOR.
                        disabled={pending || parents.length === 0} // disabled 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <option value="" disabled>{/* 선택지. */}
                            학부모를 선택해 주세요{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </option>{/* option 닫기. */}
                        {parents.map((parent) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <option key={parent.id} value={parent.id}>{/* 선택지. */}
                                {parent.name} · {parent.email}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </option> // option 닫기.
                        ))}{/* 구문 끝. */}
                    </select>{/* select 닫기. */}
                    <small className={fieldStyles.hint}>{/* 보조 문장. */}
                        한 학부모에게 여러 자녀를 연결할 수 있습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </small>{/* small 닫기. */}
                </label>{/* label 닫기. */}

                <label className={cx(fieldStyles.root, styles.field)}>{/* 활성 링크가 없는 재원만. 한 학생에 활성 보호자 최대 1명. */}
                    <span className={styles.fieldLabel}>{/* 인라인 표시. */}
                        학생 <small>필수</small>{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </span>{/* span 닫기. */}
                    <select // 선택. 서버에서 다시 검증한다.
                        className={fieldStyles.select} // className 필드.
                        name="studentId" // name 필드.
                        defaultValue="" // defaultValue 필드.
                        required // 원장 Screen. layout requireRole DIRECTOR.
                        disabled={pending || students.length === 0} // disabled 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <option value="" disabled>{/* 선택지. */}
                            학생을 선택해 주세요{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </option>{/* option 닫기. */}
                        {students.map((student) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <option key={student.id} value={student.id}>{/* 선택지. */}
                                {formatStudentOptionLabel(student)}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </option> // option 닫기.
                        ))}{/* 구문 끝. */}
                    </select>{/* select 닫기. */}
                    <small className={fieldStyles.hint}>{/* 보조 문장. */}
                        현재 학부모가 연결되지 않은 학생만 표시됩니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </small>{/* small 닫기. */}
                </label>{/* label 닫기. */}

                <label className={cx(fieldStyles.root, styles.field)}>{/* 허용 집합만. 서버 allowedRelationships와 값을 맞춘다. */}
                    <span className={styles.fieldLabel}>{/* 인라인 표시. */}
                        학생과의 관계 <small>필수</small>{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </span>{/* span 닫기. */}
                    <select // 선택. 서버에서 다시 검증한다.
                        className={fieldStyles.select} // className 필드.
                        name="relationship" // name 필드.
                        defaultValue="" // defaultValue 필드.
                        required // 원장 Screen. layout requireRole DIRECTOR.
                        disabled={pending} // disabled 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <option value="" disabled>{/* 선택지. */}
                            관계를 선택해 주세요{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </option>{/* option 닫기. */}
                        <option value="어머니">어머니</option>{/* 선택지. */}
                        <option value="아버지">아버지</option>{/* 선택지. */}
                        <option value="조부모">조부모</option>{/* 선택지. */}
                        <option value="기타 보호자">기타 보호자</option>{/* 선택지. */}
                    </select>{/* select 닫기. */}
                    <small className={fieldStyles.hint}>{/* 보조 문장. */}
                        학부모 계정과 학생의 관계입니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </small>{/* small 닫기. */}
                </label>{/* label 닫기. */}
            </div>{/* div 닫기. */}

            <footer className={styles.formFooter}>{/* footer. 원장 Screen. layout requireRole DIRECTOR. */}
                <div className={styles.feedbackArea} aria-live="polite">{/* 레이아웃 상자. */}
                    {unavailableMessage ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <p className={cx(typographyStyles.hint, styles.notice)}>{unavailableMessage}</p> // 문장.
                    ) : state.message ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <p // 문장.
                            role={ // 객체/블록 시작.
                                state.status === "error" ? "alert" : "status" // 원장 Screen. layout requireRole DIRECTOR.
                            } // 블록 끝.
                            className={cx( // className 필드.
                                styles.feedback, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                state.status === "success" // 원장 Screen. layout requireRole DIRECTOR.
                                    ? typographyStyles.success // 원장 Screen. layout requireRole DIRECTOR.
                                    : typographyStyles.error, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                state.status === "success" // 원장 Screen. layout requireRole DIRECTOR.
                                    ? styles.feedbackSuccess // 원장 Screen. layout requireRole DIRECTOR.
                                    : styles.feedbackError, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            )} // 구문 끝.
                        >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            <span aria-hidden="true">{/* 인라인 표시. */}
                                {state.status === "success" ? "✓" : "!"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </span>{/* span 닫기. */}
                            {state.message}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p> // p 닫기.
                    ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <p className={cx(typographyStyles.hint, styles.defaultHint)}>{/* 문장. */}
                            연결 후 학부모 계정에서 자녀 정보를 확인할 수{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            있습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p> // p 닫기.
                    )}{/* 구문 끝. */}
                </div>{/* div 닫기. */}

                <button // 후보가 없으면 잠근다.
                    type="submit" // type 필드.
                    className={buttonStyles.primaryLg} // className 필드.
                    disabled={Boolean(unavailableMessage) || pending} // disabled 필드.
                >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    {pending && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <span className={spinnerStyles.root} aria-hidden="true" /> // 인라인 표시.
                    )}{/* 구문 끝. */}
                    {pending ? "연결하는 중…" : "학부모 연결"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </button>{/* button 닫기. */}
            </footer>{/* footer 닫기. */}
        </form> // form 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
