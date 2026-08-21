"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 선택한 원생의 상담 메모 패널 (클라이언트).
 *
 * `useActionState(createDirectorCounselingMemo)`.
 * 학생 목록에서 상담 모드로 열린다. 직원 문의 처리와 별개로 원장이 생활 상담을 남긴다.
 *
 * props: student, memos, onClose.
 */

import { useActionState, useEffect, useRef } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    panelStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    createDirectorCounselingMemo, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    type CounselingActionState, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/counseling/actions"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    formatCounselingDateTime, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    getCurrentLocalDateTimeInput, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/counseling/presentation"; // 원장 Screen. layout requireRole DIRECTOR.
import type { StaffCounselingMemo } from "@/features/counseling/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import type { DirectorStudent } from "@/features/students/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const INITIAL_STATE: CounselingActionState = { status: "idle", message: "" }; // 원장 Screen. layout requireRole DIRECTOR.

/** 해당 원생 메모 목록과 새 기록 폼을 그린다. */
export default function DirectorStudentCounseling({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    student, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    memos, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onClose, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    student: DirectorStudent; // student 필드.
    memos: StaffCounselingMemo[]; // memos 필드.
    onClose: () => void; // onClose 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    const formRef = useRef<HTMLFormElement>(null); // 성공 시 reset. 역할을 안 바꾼다.
    const [state, formAction, isPending] = useActionState( // Server Action 상태. 클라이언트에서 DB를 치지 않는다.
        createDirectorCounselingMemo, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        INITIAL_STATE, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.

    useEffect(() => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
        if (state.status !== "success") return; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        formRef.current?.reset(); // 원장 Screen. layout requireRole DIRECTOR.
        router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
    }, [state, router]); // 원장 Screen. layout requireRole DIRECTOR.

    const maxCounseledAt = getCurrentLocalDateTimeInput(); // 원장 Screen. layout requireRole DIRECTOR.

    return ( // 원장 상담 메모. 교사 onlyOwnMemos와 별개.
        <aside className={cx(surfaceStyles.root, styles.detailPanel)}>{/* 원장 상담 메모. 교사 onlyOwnMemos와 별개. */}
            <div className={panelStyles.head}>{/* 선택한 원생. 직원 문의 처리와 별개. */}
                <div>{/* 레이아웃 상자. */}
                    <h2>{student.name}</h2>{/* 소제목. */}
                    <p>{/* 문장. */}
                        {formatStudentSchool( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            student.schoolName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            student.grade, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            "학교·학년 미입력", // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        )}{/* 구문 끝. */}
                    </p>{/* p 닫기. */}
                </div>{/* div 닫기. */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="button" // type 필드.
                    className={buttonStyles.secondary} // className 필드.
                    onClick={onClose} // onClick 필드.
                >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    닫기{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </button>{/* button 닫기. */}
            </div>{/* div 닫기. */}

            <section className={styles.block}>{/* 원장 상담 메모. 교사 onlyOwnMemos와 별개. */}
                <h3>상담 등록</h3>{/* createDirectorCounselingMemo */}
                <form ref={formRef} action={formAction} className={fieldStyles.form}>{/* 원장 상담 메모. 교사 onlyOwnMemos와 별개. */}
                    <input type="hidden" name="studentId" value={student.id} />{/* 입력. 서버에서 다시 검증한다. */}
                    <label className={fieldStyles.root}>{/* 필드 라벨. */}
                        상담 일시{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <input // 입력. 서버에서 다시 검증한다.
                            type="datetime-local" // type 필드.
                            name="counseledAt" // name 필드.
                            defaultValue={maxCounseledAt} // defaultValue 필드.
                            max={maxCounseledAt} // max 필드.
                            required // 원장 Screen. layout requireRole DIRECTOR.
                        />{/* 구문 끝. */}
                    </label>{/* label 닫기. */}
                    <label className={fieldStyles.root}>{/* 필드 라벨. */}
                        상담 내용{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <textarea // 긴 입력. 서버에서 다시 검증한다.
                            name="content" // name 필드.
                            rows={6} // rows 필드.
                            required // 원장 Screen. layout requireRole DIRECTOR.
                            maxLength={2000} // maxLength 필드.
                            placeholder="상담 요청 내용, 진행 상황, 후속 조치를 적어 주세요." // placeholder 필드.
                        />{/* 구문 끝. */}
                    </label>{/* label 닫기. */}
                    <button // pending이면 중복 등록을 막는다.
                        type="submit" // type 필드.
                        className={buttonStyles.primary} // className 필드.
                        disabled={isPending} // disabled 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        {isPending ? "등록 중…" : "상담 등록"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </button>{/* button 닫기. */}
                    {state.message && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <p // 문장.
                            className={ // 객체/블록 시작.
                                state.status === "success" // 원장 Screen. layout requireRole DIRECTOR.
                                    ? typographyStyles.success // 원장 Screen. layout requireRole DIRECTOR.
                                    : typographyStyles.error // 원장 Screen. layout requireRole DIRECTOR.
                            } // 블록 끝.
                            role="alert" // role 필드.
                        >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            {state.message}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </p> // p 닫기.
                    )}{/* 구문 끝. */}
                </form>{/* form 닫기. */}
            </section>{/* section 닫기. */}

            <section className={styles.block}>{/* 원장 상담 메모. 교사 onlyOwnMemos와 별개. */}
                <div className={styles.counselingHead}>{/* 해당 원생 최근 메모 */}
                    <h3>최근 상담</h3>{/* 소제목. */}
                    <StatusChip>{memos.length}건</StatusChip>{/* StatusChip. 원장 Screen. layout requireRole DIRECTOR. */}
                </div>{/* div 닫기. */}
                {memos.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <p className={typographyStyles.muted}>{/* 상담 기록 없음 */}
                        등록된 상담 기록이 없습니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </p> // p 닫기.
                ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <ul className={styles.counselingList}>{/* 목록. */}
                        {memos.map((memo) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <li key={memo.id}>{/* 항목. */}
                                <div className={styles.counselingItemTop}>{/* 레이아웃 상자. */}
                                    <strong>{/* 강조. */}
                                        {formatCounselingDateTime( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            memo.counseledAt, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        )}{/* 구문 끝. */}
                                    </strong>{/* strong 닫기. */}
                                    <span>{memo.authorName}</span>{/* 인라인 표시. */}
                                </div>{/* div 닫기. */}
                                <p>{memo.content}</p>{/* 문장. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </section>{/* section 닫기. */}
        </aside> // aside 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
