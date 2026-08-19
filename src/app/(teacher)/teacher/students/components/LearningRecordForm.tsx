"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 수업/숙제/생활 학습 기록 작성 폼 (클라이언트).
 *
 * `useActionState(createLearningRecord)`.
 * props: student, writableClassIds — 담당 반만 select에 넣는다.
 * 원생 상태나 수강을 바꾸지 않는다.
 */

import { useActionState } from "react"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import type { StaffStudentRow } from "@/features/students/types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    createLearningRecord, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    type LearningRecordState, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/students/staff-actions"; // 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    buttonStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    cx, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    fieldStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    panelStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    surfaceStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    typographyStyles, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/components/ui/shared-styles"; // 교사 Screen. StaffDashboard는 교사 전용.

import { getTodayDateInput } from "@/features/students/presentation"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const INITIAL_LEARNING_RECORD_STATE: LearningRecordState = { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    status: "idle", // status 필드.
    message: "", // message 필드.
}; // 블록 끝.

/** 기록 유형·반·본문을 제출한다. */
export default function LearningRecordForm({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    student, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    writableClassIds, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    student: StaffStudentRow; // student 필드.
    writableClassIds: Set<string>; // writableClassIds 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    const [actionState, formAction, isSaving] = useActionState( // Server Action 상태. 클라이언트에서 DB를 치지 않는다.
        createLearningRecord, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
        INITIAL_LEARNING_RECORD_STATE, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    ); // 호출/그룹 끝.

    return ( // 학습 기록 작성. 원생 상태 전이가 아니다.
        <article className={cx(surfaceStyles.root, styles.panel)}>{/* 학습 기록 작성. 원생 상태 전이가 아니다. */}
            <div className={panelStyles.headCompact}>{/* 레이아웃 상자. */}
                <h2>기록 작성</h2>{/* 소제목. */}
            </div>{/* div 닫기. */}
            <form action={formAction} className={cx(fieldStyles.form, styles.form)}>{/* 학습 기록 작성. 원생 상태 전이가 아니다. */}
                <input type="hidden" name="studentId" value={student.id} />{/* 스코프 안 재원생. 상태 전이는 원장 화면 몫. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>유형</span>{/* 인라인 표시. */}
                    <select name="type" defaultValue="CLASS_NOTE">{/* 선택. 서버에서 다시 검증한다. */}
                        <option value="CLASS_NOTE">수업 기록</option>{/* 선택지. */}
                        <option value="HOMEWORK">숙제</option>{/* 선택지. */}
                        <option value="LIFE_RECORD">생활 기록</option>{/* 선택지. */}
                    </select>{/* select 닫기. */}
                </label>{/* label 닫기. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>반 (선택)</span>{/* 인라인 표시. */}
                    <select name="classId" defaultValue="">{/* 담당 반만. 비우면 반 없이 기록만 생성. */}
                        <option value="">없음</option>{/* 선택지. */}
                        {student.classes // 교사 Screen. StaffDashboard는 교사 전용.
                            .filter((academyClass) => // 교사 Screen. StaffDashboard는 교사 전용.
                                writableClassIds.has(academyClass.id), // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                            ) // 호출/그룹 끝.
                            .map((academyClass) => ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                <option // 선택지.
                                    key={academyClass.id} // key 필드.
                                    value={academyClass.id} // value 필드.
                                >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                    {academyClass.name}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </option> // option 닫기.
                            ))}{/* 구문 끝. */}
                    </select>{/* select 닫기. */}
                </label>{/* label 닫기. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>날짜</span>{/* 인라인 표시. */}
                    <input // 입력. 서버에서 다시 검증한다.
                        type="date" // type 필드.
                        name="recordDate" // name 필드.
                        defaultValue={getTodayDateInput()} // defaultValue 필드.
                        required // 교사 Screen. StaffDashboard는 교사 전용.
                    />{/* 구문 끝. */}
                </label>{/* label 닫기. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>제목</span>{/* 인라인 표시. */}
                    <input // 입력. 서버에서 다시 검증한다.
                        name="title" // name 필드.
                        required // 교사 Screen. StaffDashboard는 교사 전용.
                        maxLength={80} // maxLength 필드.
                        placeholder="예: 오늘 수업 참여도" // placeholder 필드.
                    />{/* 구문 끝. */}
                </label>{/* label 닫기. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>내용</span>{/* 인라인 표시. */}
                    <textarea // 긴 입력. 서버에서 다시 검증한다.
                        name="content" // name 필드.
                        rows={5} // rows 필드.
                        required // 교사 Screen. StaffDashboard는 교사 전용.
                        maxLength={2000} // maxLength 필드.
                        placeholder="학습·생활 기록을 입력하세요" // placeholder 필드.
                    />{/* 구문 끝. */}
                </label>{/* label 닫기. */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="submit" // type 필드.
                    className={buttonStyles.primary} // className 필드.
                    disabled={isSaving} // disabled 필드.
                >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    {isSaving ? "저장 중…" : "기록 저장"}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                </button>{/* button 닫기. */}
                {actionState.message && ( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                    <p // 문장.
                        className={ // 객체/블록 시작.
                            actionState.status === "success" // 교사 Screen. StaffDashboard는 교사 전용.
                                ? typographyStyles.success // 교사 Screen. StaffDashboard는 교사 전용.
                                : typographyStyles.error // 교사 Screen. StaffDashboard는 교사 전용.
                        } // 블록 끝.
                        role="alert" // role 필드.
                    >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                        {actionState.message}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                    </p> // p 닫기.
                )}{/* 구문 끝. */}
            </form>{/* form 닫기. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
