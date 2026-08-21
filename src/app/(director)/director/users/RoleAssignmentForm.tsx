"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * GUEST 역할 부여 폼 (클라이언트).
 *
 * 제출: `assignUserRole`. GUEST만 대상 — 이미 역할 있는 유저를 덮어쓰지 않는다.
 * STUDENT를 고르면 미연결 원생 카드가 필요하다.
 *
 * props: userId, userName, students, hasStudentProfile.
 */

import { useState } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { useFormStatus } from "react-dom"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { assignUserRole } from "@/features/users/actions"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    formatStudentOptionLabel, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    STUDENT_STATUS_METADATA, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/students/presentation"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import { roleLabels } from "@/lib/role-routes"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./page.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 역할 select와 (학생이면) 원생 카드 선택을 제출한다. */
export default function RoleAssignmentForm({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    userId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    userName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    students, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    hasStudentProfile, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    userId: string; // userId 필드.
    userName: string; // userName 필드.
    hasStudentProfile: boolean; // hasStudentProfile 필드.
    students: Array<{ // students 필드.
        id: string; // id 필드.
        name: string; // name 필드.
        schoolName: string | null; // schoolName 필드.
        grade: string | null; // grade 필드.
        status: "ENROLLED" | "PAUSED" | "WITHDRAWN"; // status 필드.
    }>; // 원장 Screen. layout requireRole DIRECTOR.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const selectId = `role-${userId}`; // 원장 Screen. layout requireRole DIRECTOR.
    const studentSelectId = `student-${userId}`; // 원장 Screen. layout requireRole DIRECTOR.
    const [role, setRole] = useState(""); // assignUserRole. 이미 역할 있는 유저를 덮지 않는다.

    return ( // assignUserRole. 이미 역할 있는 유저를 덮지 않는다.
        <form action={assignUserRole} className={styles.roleForm}>{/* assignUserRole. 이미 역할 있는 유저를 덮지 않는다. */}
            <input type="hidden" name="userId" value={userId} />{/* GUEST userId. 이미 역할 있는 계정을 덮지 않는다. */}
            <label className={typographyStyles.muted} htmlFor={selectId}>{/* 필드 라벨. */}
                부여할 역할{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </label>{/* label 닫기. */}
            <div className={styles.roleControls}>{/* 레이아웃 상자. */}
                <select // 선택. 서버에서 다시 검증한다.
                    className={cx(fieldStyles.select, styles.roleSelect)} // className 필드.
                    id={selectId} // id 필드.
                    name="role" // name 필드.
                    defaultValue="" // defaultValue 필드.
                    onChange={(event) => setRole(event.target.value)} // onChange 필드.
                    aria-label={`${userName} 역할 선택`} // 원장 Screen. layout requireRole DIRECTOR.
                    required // 원장 Screen. layout requireRole DIRECTOR.
                >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    <option value="" disabled>{/* 선택지. */}
                        역할을 선택하세요{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </option>{/* option 닫기. */}
                    <option value="TEACHER">{roleLabels.TEACHER}</option>{/* 선택지. */}
                    <option value="STAFF">{roleLabels.STAFF}</option>{/* 선택지. */}
                    <option value="PARENT">{roleLabels.PARENT}</option>{/* 선택지. */}
                    <option // 빈 카드가 없거나 이미 프로필이 있으면 부여 UI를 잠근다. 신규 Student 행 없음.
                        value="STUDENT" // value 필드.
                        disabled={students.length === 0 || hasStudentProfile} // disabled 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        {roleLabels.STUDENT}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </option>{/* option 닫기. */}
                </select>{/* select 닫기. */}
                <AssignButton />{/* AssignButton. 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
            {role === "STUDENT" && ( // STUDENT일 때만 userId:null 재원/휴원 카드를 고른다. 신규 원생을 만들지 않는다.
                <div className={cx(fieldStyles.root, styles.studentLinkField)}>{/* 레이아웃 상자. */}
                    <label htmlFor={studentSelectId}>연결할 기존 학생</label>{/* 필드 라벨. */}
                    <select // 선택. 서버에서 다시 검증한다.
                        className={cx(fieldStyles.select, styles.studentSelect)} // className 필드.
                        id={studentSelectId} // id 필드.
                        name="studentId" // name 필드.
                        defaultValue="" // defaultValue 필드.
                        required // 원장 Screen. layout requireRole DIRECTOR.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <option value="" disabled>{/* 선택지. */}
                            학생을 선택하세요{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </option>{/* option 닫기. */}
                        {students.map((student) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <option key={student.id} value={student.id}>{/* 선택지. */}
                                {formatStudentOption(student)}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </option> // option 닫기.
                        ))}{/* 구문 끝. */}
                    </select>{/* select 닫기. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
            {hasStudentProfile && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <p className={cx(typographyStyles.hint, styles.roleHint)}>{/* 문장. */}
                    기존 학생 계정의 재등록은 학생 관리에서 처리하세요.{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </p> // p 닫기.
            )}{/* 구문 끝. */}
        </form> // form 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** select 옵션 라벨. 학교·학년·재원 상태를 붙인다. */
function formatStudentOption(student: { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    name: string; // name 필드.
    schoolName: string | null; // schoolName 필드.
    grade: string | null; // grade 필드.
    status: "ENROLLED" | "PAUSED" | "WITHDRAWN"; // status 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const status = STUDENT_STATUS_METADATA[student.status].label; // 학교·학년·재원 상태를 옵션 라벨에 붙인다.
    return `${formatStudentOptionLabel(student)} (${status})`; // 반환. 원장 Screen. layout requireRole DIRECTOR.
} // 블록 끝.

/** 제출 중이면 버튼을 잠근다. */
function AssignButton() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    const { pending } = useFormStatus(); // pending이면 이중 부여를 막는다.

    return ( // assignUserRole. 이미 역할 있는 유저를 덮지 않는다.
        <button type="submit" className={buttonStyles.assign} disabled={pending}>{/* 클릭. 권한을 클라이언트에서 올리지 않는다. */}
            {pending ? "부여 중…" : "역할 부여"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
        </button> // button 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
