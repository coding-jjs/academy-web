"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 상담 메모 작성·목록 패널 (클라이언트).
 *
 * `useActionState(createCounselingMemo)`.
 * props: students(스코프 안), memos.
 * 교사 page는 본인 메모만, 직원 page는 onlyOwnMemos: false.
 */

import { useActionState } from "react"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    formatCounselingDateTime, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    getCurrentLocalDateTimeInput, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/counseling/presentation"; // 교사 Screen. StaffDashboard는 교사 전용.
import type { // 타입만. 런타임 로직이 아니다.
    CounselingStudentOption, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    StaffCounselingMemo, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/counseling/types"; // 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    createCounselingMemo, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    type CounselingActionState, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/counseling/actions"; // 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffCounselingScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const INITIAL_STATE: CounselingActionState = { status: "idle", message: "" }; // 교사 Screen. StaffDashboard는 교사 전용.

/** 학생·일시·본문 폼과 기존 메모 목록을 그린다. */
export default function CounselingMemoPanel({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    students, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    memos, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    students: CounselingStudentOption[]; // students 필드.
    memos: StaffCounselingMemo[]; // memos 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    const [state, formAction, isPending] = useActionState( // createCounselingMemo. 교사는 본인 메모만, 직원은 전체.
        createCounselingMemo, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
        INITIAL_STATE, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    ); // 호출/그룹 끝.
    return ( // 상담 메모 저장. 게스트 문의가 아니다.
        <div className={styles.layout}>{/* 레이아웃 상자. */}
            <article className={styles.panel}>{/* 상담 메모 저장. 게스트 문의가 아니다. */}
                <div className={styles.panelHead}>{/* 상담 등록 */}
                    <h2>상담 등록</h2>{/* 소제목. */}
                </div>{/* div 닫기. */}
                {students.length === 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                    <p className={styles.muted}>{/* 스코프 안 학생 없음 */}
                        등록 가능한 담당 학생이 없습니다.{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    </p> // p 닫기.
                ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                    <form action={formAction} className={styles.form}>{/* 상담 메모 저장. 게스트 문의가 아니다. */}
                        <label className={styles.field}>{/* 필드 라벨. */}
                            <span>학생</span>{/* 인라인 표시. */}
                            <select name="studentId" required defaultValue="">{/* 선택. 서버에서 다시 검증한다. */}
                                <option value="" disabled>{/* 선택지. */}
                                    선택{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </option>{/* option 닫기. */}
                                {students.map((student) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                    <option key={student.id} value={student.id}>{/* 선택지. */}
                                        {student.name}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                        {student.className // 교사 Screen. StaffDashboard는 교사 전용.
                                            ? ` · ${student.className}` // 교사 Screen. StaffDashboard는 교사 전용.
                                            : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                        {student.grade // 교사 Screen. StaffDashboard는 교사 전용.
                                            ? ` · ${student.grade}` // 교사 Screen. StaffDashboard는 교사 전용.
                                            : ""}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    </option> // option 닫기.
                                ))}{/* 구문 끝. */}
                            </select>{/* select 닫기. */}
                        </label>{/* label 닫기. */}
                        <label className={styles.field}>{/* 필드 라벨. */}
                            <span>상담 일시</span>{/* 인라인 표시. */}
                            <input // 입력. 서버에서 다시 검증한다.
                                type="datetime-local" // type 필드.
                                name="counseledAt" // name 필드.
                                defaultValue={getCurrentLocalDateTimeInput()} // defaultValue 필드.
                                max={getCurrentLocalDateTimeInput()} // max 필드.
                                required // 교사 Screen. StaffDashboard는 교사 전용.
                            />{/* 구문 끝. */}
                        </label>{/* label 닫기. */}
                        <label className={styles.field}>{/* 필드 라벨. */}
                            <span>상담 내용</span>{/* 인라인 표시. */}
                            <textarea // 긴 입력. 서버에서 다시 검증한다.
                                name="content" // name 필드.
                                rows={6} // rows 필드.
                                required // 교사 Screen. StaffDashboard는 교사 전용.
                                maxLength={2000} // maxLength 필드.
                                placeholder="상담 요청 내용, 진행 상황, 후속 조치를 적어 주세요." // placeholder 필드.
                            />{/* 구문 끝. */}
                        </label>{/* label 닫기. */}
                        <button // pending이면 중복 등록을 막는다.
                            type="submit" // type 필드.
                            className={styles.primaryBtn} // className 필드.
                            disabled={isPending} // disabled 필드.
                        >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            {isPending ? "등록 중…" : "상담 등록"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        </button>{/* button 닫기. */}
                        {state.message && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                            <p // 문장.
                                className={ // 객체/블록 시작.
                                    state.status === "success" // 교사 Screen. StaffDashboard는 교사 전용.
                                        ? styles.success // 교사 Screen. StaffDashboard는 교사 전용.
                                        : styles.error // 교사 Screen. StaffDashboard는 교사 전용.
                                } // 블록 끝.
                                role="alert" // role 필드.
                            >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                {state.message}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                            </p> // p 닫기.
                        )}{/* 구문 끝. */}
                    </form> // form 닫기.
                )}{/* 구문 끝. */}
            </article>{/* article 닫기. */}
            <article className={styles.panel}>{/* 상담 메모 저장. 게스트 문의가 아니다. */}
                <div className={styles.panelHead}>{/* 최근 상담. 교사 page는 onlyOwnMemos. */}
                    <h2>최근 상담</h2>{/* 소제목. */}
                    <StatusChip>{memos.length}건</StatusChip>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
                </div>{/* div 닫기. */}
                {memos.length === 0 ? ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                    <p className={styles.muted}>등록된 상담 기록이 없습니다.</p> // 상담 기록 없음
                ) : ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                    <ul className={styles.list}>{/* 목록. */}
                        {memos.map((memo) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                            <li key={memo.id}>{/* 항목. */}
                                <div className={styles.itemTop}>{/* 레이아웃 상자. */}
                                    <strong>{memo.studentName}</strong>{/* 강조. */}
                                    <span>{/* 인라인 표시. */}
                                        {formatCounselingDateTime( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                            memo.counseledAt, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                        )}{/* 구문 끝. */}
                                    </span>{/* span 닫기. */}
                                </div>{/* div 닫기. */}
                                <p>{memo.content}</p>{/* 문장. */}
                                <small>{memo.authorName}</small>{/* 보조 문장. */}
                            </li> // li 닫기.
                        ))}{/* 구문 끝. */}
                    </ul> // ul 닫기.
                )}{/* 구문 끝. */}
            </article>{/* article 닫기. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
