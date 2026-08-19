"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 원생 상세·수강 추가/해제·상태 전이 (클라이언트).
 *
 * director-actions: `addStudentEnrollment`, `endStudentEnrollment`,
 * `updateStudentStatus`. 교사 상세에는 이 전이가 없다.
 *
 * props: student, classOptions, onClose.
 */

import { useMemo, useState, useTransition } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
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
import type { // 타입만. 런타임 로직이 아니다.
    DirectorClassOption, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    DirectorStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    StudentStatus, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/students/types"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    addStudentEnrollment, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    endStudentEnrollment, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    updateStudentStatus, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/students/director-actions"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    formatEnrollmentChangeDate, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    formatStudentSchool, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    STUDENT_STATUS_METADATA, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/students/presentation"; // 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 상태·수강·변경 이력을 한 패널에 묶는다. */
export default function DirectorStudentDetail({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    student, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    classOptions, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onClose, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    student: DirectorStudent; // student 필드.
    classOptions: DirectorClassOption[]; // classOptions 필드.
    onClose: () => void; // onClose 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    const [isSaving, startSaving] = useTransition(); // 원장 Screen. layout requireRole DIRECTOR.
    const [selectedClassId, setSelectedClassId] = useState(""); // 상태 전이·수강 배정. 교사 상세가 아니다.
    const [feedback, setFeedback] = useState<string | null>(null); // Action 결과 안내. JWT를 여기서 안 갱신한다.
    const addableClasses = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        const enrolledClassIds = new Set( // 이미 ACTIVE 수강 중인 반은 빼다. 퇴원 학생은 서버가 추가를 거절.
            student.classes.map((enrollment) => enrollment.classId), // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ); // 호출/그룹 끝.
        return classOptions.filter( // 반환. 원장 Screen. layout requireRole DIRECTOR.
            (academyClass) => !enrolledClassIds.has(academyClass.id), // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ); // 호출/그룹 끝.
    }, [student.classes, classOptions]); // 원장 Screen. layout requireRole DIRECTOR.

    function addClassEnrollment() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!selectedClassId) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.

        startSaving(async () => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
            const result = await addStudentEnrollment({ // ACTIVE 수강 한 줄. Student 행은 건드리지 않는다.
                studentId: student.id, // studentId 필드.
                classId: selectedClassId, // classId 필드.
            }); // 객체/호출 끝.
            setFeedback(result.message); // 원장 Screen. layout requireRole DIRECTOR.
            if (result.ok) { // 분기. 원장 Screen. layout requireRole DIRECTOR.
                setSelectedClassId(""); // 원장 Screen. layout requireRole DIRECTOR.
                router.refresh(); // page 데이터를 다시 읽는다. redirect 없음.
            } // 블록 끝.
        }); // 객체/호출 끝.
    } // 블록 끝.

    function endClassEnrollment(enrollmentId: string, className: string) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        const confirmed = window.confirm( // 구문. 원장 Screen. layout requireRole DIRECTOR.
            `${className} 수강을 해제할까요?\n출결·성적 기록은 유지됩니다.`, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ); // 호출/그룹 끝.
        if (!confirmed) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.

        startSaving(async () => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
            const result = await endStudentEnrollment({ enrollmentId }); // 행 삭제가 아니라 CANCELLED+endedAt. 출결·청구 이력 보존.
            setFeedback(result.message); // 원장 Screen. layout requireRole DIRECTOR.
            if (result.ok) router.refresh(); // 분기. 원장 Screen. layout requireRole DIRECTOR.
        }); // 객체/호출 끝.
    } // 블록 끝.

    function changeStudentStatus(nextStatus: StudentStatus) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (student.status === nextStatus) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.

        const statusLabel = STUDENT_STATUS_METADATA[nextStatus].label; // 원장 Screen. layout requireRole DIRECTOR.
        const confirmed = window.confirm( // 구문. 원장 Screen. layout requireRole DIRECTOR.
            nextStatus === "WITHDRAWN" // 원장 Screen. layout requireRole DIRECTOR.
                ? `${student.name} 학생을 퇴원 처리할까요?\n활성 수강이 모두 해제됩니다.` // 원장 Screen. layout requireRole DIRECTOR.
                : `${student.name} 학생 상태를 "${statusLabel}"(으)로 바꿀까요?`, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ); // 호출/그룹 끝.
        if (!confirmed) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.

        startSaving(async () => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
            const result = await updateStudentStatus({ // ENROLLED↔PAUSED↔WITHDRAWN. Student 행 삭제·즉시 BLOCK은 lifecycle/크론.
                studentId: student.id, // studentId 필드.
                status: nextStatus, // status 필드.
            }); // 객체/호출 끝.
            setFeedback(result.message); // 원장 Screen. layout requireRole DIRECTOR.
            if (result.ok) router.refresh(); // 분기. 원장 Screen. layout requireRole DIRECTOR.
        }); // 객체/호출 끝.
    } // 블록 끝.

    return ( // 상태 전이·수강 배정. 교사 상세가 아니다.
        <aside className={cx(surfaceStyles.root, styles.detailPanel)}>{/* 상태 전이·수강 배정. 교사 상세가 아니다. */}
            <div className={panelStyles.head}>{/* 원생 카드. googleLinked는 userId 연결 여부. */}
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

            <div className={styles.meta}>{/* 레이아웃 상자. */}
                <div>{/* 레이아웃 상자. */}
                    <span>Google 연동</span>{/* 인라인 표시. */}
                    <strong>{/* 강조. */}
                        {student.googleLinked // 원장 Screen. layout requireRole DIRECTOR.
                            ? (student.email ?? "연동됨") // 원장 Screen. layout requireRole DIRECTOR.
                            : "미연동"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </strong>{/* strong 닫기. */}
                </div>{/* div 닫기. */}
                <div>{/* 레이아웃 상자. */}
                    <span>학부모</span>{/* 인라인 표시. */}
                    <strong>{/* 강조. */}
                        {student.parentNames.length > 0 // 원장 Screen. layout requireRole DIRECTOR.
                            ? student.parentNames.join(", ") // 원장 Screen. layout requireRole DIRECTOR.
                            : "미연결"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </strong>{/* strong 닫기. */}
                </div>{/* div 닫기. */}
            </div>{/* div 닫기. */}

            <StudentStatusEditor // StudentStatusEditor. 원장 Screen. layout requireRole DIRECTOR.
                student={student} // student 필드.
                isSaving={isSaving} // isSaving 필드.
                onChange={changeStudentStatus} // onChange 필드.
            />{/* 구문 끝. */}
            <CurrentEnrollments // CurrentEnrollments. 원장 Screen. layout requireRole DIRECTOR.
                student={student} // student 필드.
                isSaving={isSaving} // isSaving 필드.
                onEnd={endClassEnrollment} // onEnd 필드.
            />{/* 구문 끝. */}
            <AddEnrollment // AddEnrollment. 원장 Screen. layout requireRole DIRECTOR.
                hasClasses={classOptions.length > 0} // hasClasses 필드.
                classes={addableClasses} // classes 필드.
                selectedClassId={selectedClassId} // selectedClassId 필드.
                isSaving={isSaving} // isSaving 필드.
                onClassChange={setSelectedClassId} // onClassChange 필드.
                onAdd={addClassEnrollment} // onAdd 필드.
            />{/* 구문 끝. */}
            <RecentEnrollmentChanges student={student} />{/* RecentEnrollmentChanges. 원장 Screen. layout requireRole DIRECTOR. */}

            {feedback && <p className={typographyStyles.hint}>{feedback}</p>}{/* 원장 Screen. layout requireRole DIRECTOR. */}
        </aside> // aside 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 재원/휴원/퇴원 상태를 `updateStudentStatus`로 보낸다. */
function StudentStatusEditor({ // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    student, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    isSaving, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onChange, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    student: DirectorStudent; // student 필드.
    isSaving: boolean; // isSaving 필드.
    onChange: (status: StudentStatus) => void; // onChange 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const statusMetadata = STUDENT_STATUS_METADATA[student.status]; // 원장 Screen. layout requireRole DIRECTOR.

    return ( // 상태 전이·수강 배정. 교사 상세가 아니다.
        <section className={styles.block}>{/* 상태 전이·수강 배정. 교사 상세가 아니다. */}
            <h3>재원 상태</h3>{/* lifecycle 전이. 퇴원은 당일 24시 유예 후 계정 차단. */}
            <div className={styles.statusRow}>{/* 레이아웃 상자. */}
                <StatusChip tone={statusMetadata.tone}>{/* StatusChip. 원장 Screen. layout requireRole DIRECTOR. */}
                    {statusMetadata.label}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </StatusChip>{/* StatusChip 닫기. */}
                <select // 선택. 서버에서 다시 검증한다.
                    className={styles.statusSelect} // className 필드.
                    value={student.status} // value 필드.
                    disabled={isSaving} // disabled 필드.
                    onChange={(event) => // onChange 필드.
                        onChange(event.target.value as StudentStatus) // 원장 Screen. layout requireRole DIRECTOR.
                    } // 블록 끝.
                >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    <option value="ENROLLED">재원</option>{/* 선택지. */}
                    <option value="PAUSED">휴원</option>{/* 선택지. */}
                    <option value="WITHDRAWN">퇴원</option>{/* 선택지. */}
                </select>{/* select 닫기. */}
            </div>{/* div 닫기. */}
            <p className={typographyStyles.muted}>{/* 문장. */}
                휴원·퇴원 학생은 청구·성적 등 재원 목록에서 제외됩니다. 퇴원은{/* 원장 Screen. layout requireRole DIRECTOR. */}
                수강도 해제합니다.{/* 원장 Screen. layout requireRole DIRECTOR. */}
            </p>{/* p 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 현재 수강 반과 해제 버튼. `endStudentEnrollment`. */
function CurrentEnrollments({ // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    student, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    isSaving, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onEnd, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    student: DirectorStudent; // student 필드.
    isSaving: boolean; // isSaving 필드.
    onEnd: (enrollmentId: string, className: string) => void; // onEnd 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 상태 전이·수강 배정. 교사 상세가 아니다.
        <section className={styles.block}>{/* 상태 전이·수강 배정. 교사 상세가 아니다. */}
            <h3>현재 수강</h3>{/* 해제는 CANCELLED+endedAt. 행을 지우지 않아 출결 이력이 남는다. */}
            {student.classes.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <p className={typographyStyles.muted}>배정된 반이 없습니다.</p> // 반 미배정
            ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <ul className={styles.enrollmentList}>{/* 목록. */}
                    {student.classes.map((enrollment) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <li key={enrollment.enrollmentId}>{/* 항목. */}
                            <div>{/* 레이아웃 상자. */}
                                <strong>{enrollment.className}</strong>{/* 강조. */}
                                <small>{/* 보조 문장. */}
                                    {enrollment.teacherName ?? "담당 미지정"} ·{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    활성{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                </small>{/* small 닫기. */}
                            </div>{/* div 닫기. */}
                            <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                type="button" // type 필드.
                                className={buttonStyles.danger} // className 필드.
                                disabled={isSaving} // disabled 필드.
                                onClick={() => // onClick 필드.
                                    onEnd( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        enrollment.enrollmentId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        enrollment.className, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    ) // 호출/그룹 끝.
                                } // 블록 끝.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                해제{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </button>{/* button 닫기. */}
                        </li> // li 닫기.
                    ))}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 미수강 반을 골라 `addStudentEnrollment`. */
function AddEnrollment({ // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    hasClasses, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    classes, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    selectedClassId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    isSaving, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onClassChange, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onAdd, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    hasClasses: boolean; // hasClasses 필드.
    classes: DirectorClassOption[]; // classes 필드.
    selectedClassId: string; // selectedClassId 필드.
    isSaving: boolean; // isSaving 필드.
    onClassChange: (classId: string) => void; // onClassChange 필드.
    onAdd: () => void; // onAdd 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 상태 전이·수강 배정. 교사 상세가 아니다.
        <section className={styles.block}>{/* 상태 전이·수강 배정. 교사 상세가 아니다. */}
            <h3>반 추가</h3>{/* 미수강 반 추가 */}
            {!hasClasses ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <p className={typographyStyles.muted}>등록된 활성 반이 없습니다.</p> // 문장.
            ) : classes.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <p className={typographyStyles.muted}>추가할 수 있는 반이 없습니다.</p> // 문장.
            ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <div className={styles.addRow}>{/* 레이아웃 상자. */}
                    <select // 선택. 서버에서 다시 검증한다.
                        className={cx(fieldStyles.control, fieldStyles.select)} // className 필드.
                        value={selectedClassId} // value 필드.
                        onChange={(event) => onClassChange(event.target.value)} // onChange 필드.
                        disabled={isSaving} // disabled 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <option value="">반 선택</option>{/* 선택지. */}
                        {classes.map((academyClass) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                            <option // 선택지.
                                key={academyClass.id} // key 필드.
                                value={academyClass.id} // value 필드.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                {academyClass.name}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                {academyClass.teacherName // 원장 Screen. layout requireRole DIRECTOR.
                                    ? ` · ${academyClass.teacherName}` // 원장 Screen. layout requireRole DIRECTOR.
                                    : ""}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            </option> // option 닫기.
                        ))}{/* 구문 끝. */}
                    </select>{/* select 닫기. */}
                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                        type="button" // type 필드.
                        className={buttonStyles.action} // className 필드.
                        disabled={isSaving || !selectedClassId} // disabled 필드.
                        onClick={onAdd} // onClick 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        추가{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </button>{/* button 닫기. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 최근 수강 변경 이력. 읽기 전용. */
function RecentEnrollmentChanges({ student }: { student: DirectorStudent }) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    return ( // 상태 전이·수강 배정. 교사 상세가 아니다.
        <section className={styles.block}>{/* 상태 전이·수강 배정. 교사 상세가 아니다. */}
            <h3>최근 변경</h3>{/* 최근 해제 이력. 읽기만. */}
            {student.recentChanges.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <p className={typographyStyles.muted}>최근 해제 이력이 없습니다.</p> // 문장.
            ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                <ul className={styles.historyList}>{/* 목록. */}
                    {student.recentChanges.map((change) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        <li key={change.id}>{/* 항목. */}
                            {formatEnrollmentChangeDate(change.endedAt)}{" "}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            {change.className} 해제{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        </li> // li 닫기.
                    ))}{/* 구문 끝. */}
                </ul> // ul 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
