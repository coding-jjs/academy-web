"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학부모-학생 연결 해제 버튼 (클라이언트).
 *
 * `useActionState(unlinkParentStudent)`.
 * 링크만 끊고 User 역할(PARENT/STUDENT)은 유지한다.
 * props: linkId, parentName, studentName — 확인 대화상자에 쓴다.
 */

import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    type SyntheticEvent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    useActionState, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    useEffect, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    useRef, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "react"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    unlinkParentStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    type ParentLinkState, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/families/actions"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    dialogStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    spinnerStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const initialState: ParentLinkState = { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    status: "idle", // status 필드.
    message: "", // message 필드.
}; // 블록 끝.

/** 확인 다이얼로그 후 해제를 제출한다. */
export default function UnlinkParentStudentButton({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    linkId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    parentName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    studentName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    linkId: string; // linkId 필드.
    parentName: string; // parentName 필드.
    studentName: string; // studentName 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const dialogRef = useRef<HTMLDialogElement>(null); // 해제 확인. 학부모가 스스로 끊지 못한다.
    const [state, formAction, pending] = useActionState( // unlinkParentStudent. 역할은 유지하고 링크만 끊는다.
        unlinkParentStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        initialState, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.

    useEffect(() => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
        if (state.status === "success") { // endedAt만 찍힌 뒤 다이얼로그를 닫는다. 행 삭제가 아니다.
            dialogRef.current?.close(); // 원장 Screen. layout requireRole DIRECTOR.
        } // 블록 끝.
    }, [state.status]); // 원장 Screen. layout requireRole DIRECTOR.

    function openDialog() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        dialogRef.current?.showModal(); // 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    function closeDialog() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        dialogRef.current?.close(); // 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    function handleCancel(event: SyntheticEvent<HTMLDialogElement>) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (pending) { // 제출 중 ESC로 닫히면 사유 없이 중단되는 것을 막는다.
            event.preventDefault(); // 원장 Screen. layout requireRole DIRECTOR.
        } // 블록 끝.
    } // 블록 끝.

    return ( // 원장만 해제. unlinkParentStudent.
        <>{/* 요소. 원장 Screen. layout requireRole DIRECTOR. */}
            <button // 확인 다이얼로그를 연다.
                type="button" // type 필드.
                className={cx(buttonStyles.cancel, styles.unlinkTrigger)} // className 필드.
                onClick={openDialog} // onClick 필드.
            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                연결 해제{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </button>{/* button 닫기. */}

            <dialog // 원장만 해제. unlinkParentStudent.
                ref={dialogRef} // ref 필드.
                className={dialogStyles.overlay} // className 필드.
                aria-labelledby={`unlink-title-${linkId}`} // 원장 Screen. layout requireRole DIRECTOR.
                aria-describedby={`unlink-description-${linkId}`} // 원장 Screen. layout requireRole DIRECTOR.
                onCancel={handleCancel} // onCancel 필드.
            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                <section className={dialogStyles.card}>{/* 원장만 해제. unlinkParentStudent. */}
                    <header className={dialogStyles.header}>{/* 원장만 해제. unlinkParentStudent. */}
                        <div className={styles.warningIcon} aria-hidden="true">{/* 레이아웃 상자. */}
                            !{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </div>{/* div 닫기. */}
                        <div className={styles.dialogHeading}>{/* 레이아웃 상자. */}
                            <span className={cx(pageHeadingStyles.sectionLabel, styles.dangerLabel)}>{/* 인라인 표시. */}
                                DISCONNECT FAMILY{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </span>{/* span 닫기. */}
                            <h2 id={`unlink-title-${linkId}`}>{/* 소제목. */}
                                가족 연결을 해제할까요?{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </h2>{/* h2 닫기. */}
                            <p // 문장.
                                id={`unlink-description-${linkId}`} // id 필드.
                                className={typographyStyles.hint} // className 필드.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                연결 기록은 삭제하지 않고 해제 사유와 처리자를{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                함께 기록합니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </p>{/* p 닫기. */}
                        </div>{/* div 닫기. */}
                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                            type="button" // type 필드.
                            className={dialogStyles.close} // className 필드.
                            onClick={closeDialog} // onClick 필드.
                            disabled={pending} // disabled 필드.
                            aria-label="연결 해제 창 닫기" // 원장 Screen. layout requireRole DIRECTOR.
                        >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            ×{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </button>{/* button 닫기. */}
                    </header>{/* header 닫기. */}

                    <div className={styles.unlinkSummary}>{/* 레이아웃 상자. */}
                        <div className={styles.unlinkPerson}>{/* 레이아웃 상자. */}
                            <span className={typographyStyles.muted}>학부모</span>{/* 인라인 표시. */}
                            <strong>{parentName}</strong>{/* 강조. */}
                        </div>{/* div 닫기. */}
                        <div className={styles.unlinkArrow} aria-hidden="true">{/* 레이아웃 상자. */}
                            →{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </div>{/* div 닫기. */}
                        <div className={styles.unlinkPerson}>{/* 레이아웃 상자. */}
                            <span className={typographyStyles.muted}>학생</span>{/* 인라인 표시. */}
                            <strong>{studentName}</strong>{/* 강조. */}
                        </div>{/* div 닫기. */}
                    </div>{/* div 닫기. */}

                    <div className={styles.unlinkNotice}>{/* 레이아웃 상자. */}
                        <span aria-hidden="true">i</span>{/* 인라인 표시. */}
                        <p>{/* 마지막 자녀면 PARENT → GUEST. 학생 역할은 유지. */}
                            학생의 재원 상태와 계정 역할은 유지됩니다. 학부모는{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            다른 연결된 자녀가 없을 때 게스트로 변경됩니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p>{/* p 닫기. */}
                    </div>{/* div 닫기. */}

                    <form action={formAction} className={styles.unlinkForm}>{/* 원장만 해제. unlinkParentStudent. */}
                        <input type="hidden" name="linkId" value={linkId} />{/* linkId + 사유. 서버가 endedAt을 찍고 마지막 링크면 강등. */}
                        <label className={cx(fieldStyles.root, styles.reasonField)}>{/* 필드 라벨. */}
                            <span>{/* 인라인 표시. */}
                                해제 사유 <small>필수</small>{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </span>{/* span 닫기. */}
                            <select // 선택. 서버에서 다시 검증한다.
                                className={fieldStyles.select} // className 필드.
                                name="reason" // name 필드.
                                defaultValue="" // defaultValue 필드.
                                required // 원장 Screen. layout requireRole DIRECTOR.
                                disabled={pending} // disabled 필드.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                <option value="" disabled>{/* 선택지. */}
                                    해제 사유를 선택해 주세요{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                </option>{/* option 닫기. */}
                                <option value="잘못된 연결">잘못된 연결</option>{/* 선택지. */}
                                <option value="보호자 변경">보호자 변경</option>{/* 선택지. */}
                                <option value="원장 수동 해제">{/* 선택지. */}
                                    기타 운영 사유{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                </option>{/* option 닫기. */}
                            </select>{/* select 닫기. */}
                        </label>{/* label 닫기. */}

                        {state.status === "error" && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <p // 문장.
                                className={cx(typographyStyles.error, styles.dialogError)} // className 필드.
                                role="alert" // role 필드.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                <span aria-hidden="true">!</span>{/* 인라인 표시. */}
                                {state.message}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </p> // p 닫기.
                        )}{/* 구문 끝. */}

                        <footer className={styles.dialogActions}>{/* footer. 원장 Screen. layout requireRole DIRECTOR. */}
                            <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                type="button" // type 필드.
                                className={buttonStyles.cancel} // className 필드.
                                onClick={closeDialog} // onClick 필드.
                                disabled={pending} // disabled 필드.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                취소{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </button>{/* button 닫기. */}
                            <button // pending이면 취소도 막는다.
                                type="submit" // type 필드.
                                className={buttonStyles.dangerSolid} // className 필드.
                                disabled={pending} // disabled 필드.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                {pending && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    <span // 인라인 표시.
                                        className={spinnerStyles.root} // className 필드.
                                        aria-hidden="true" // 원장 Screen. layout requireRole DIRECTOR.
                                    /> // 구문 끝.
                                )}{/* 구문 끝. */}
                                {pending ? "연결을 해제하는 중…" : "연결 해제"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </button>{/* button 닫기. */}
                        </footer>{/* footer 닫기. */}
                    </form>{/* form 닫기. */}
                </section>{/* section 닫기. */}
            </dialog>{/* dialog 닫기. */}
        </> // 구문 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
