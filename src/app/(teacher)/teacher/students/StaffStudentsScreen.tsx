"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 스코프 안 원생 목록+상세 (클라이언트).
 *
 * `/teacher/students`와 `/employee/students`가 같은 Screen을 쓴다.
 * props: viewAllStudents, students, classes — staff-data.
 * 학습 기록 작성은 `LearningRecordForm` → `createLearningRecord`.
 * 원생 상태(재원/휴원) 전이는 원장 화면 몫이라 여기 없다.
 */

import { useMemo, useState } from "react"; // 의존성. 교사/직원 공용. 상태 전이는 원장만.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사/직원 공용. 상태 전이는 원장만.
import { // 의존성. 교사/직원 공용. 상태 전이는 원장만.
    buttonStyles, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    cx, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    emptyStateStyles, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    fieldStyles, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    pageHeadingStyles, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    screenStyles, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    surfaceStyles, // 구문. 교사/직원 공용. 상태 전이는 원장만.
} from "@/components/ui/shared-styles"; // 교사/직원 공용. 상태 전이는 원장만.
import type { // 타입만. 런타임 로직이 아니다.
    StaffClassOption, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    StaffStudentRow, // 구문. 교사/직원 공용. 상태 전이는 원장만.
} from "@/features/students/types"; // 교사/직원 공용. 상태 전이는 원장만.
import StaffStudentDetail from "./components/StaffStudentDetail"; // 같은 라우트 모듈. 교사/직원 공용. 상태 전이는 원장만.
import StaffStudentList from "./components/StaffStudentList"; // 같은 라우트 모듈. 교사/직원 공용. 상태 전이는 원장만.
import styles from "./StaffStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 검색·반 필터와 리스트/상세를 조합한다. */
export default function StaffStudentsScreen({ // 이 파일의 화면. 교사/직원 공용. 상태 전이는 원장만.
    viewAllStudents, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    students, // 구문. 교사/직원 공용. 상태 전이는 원장만.
    classes, // 구문. 교사/직원 공용. 상태 전이는 원장만.
}: { // 구문. 교사/직원 공용. 상태 전이는 원장만.
    viewAllStudents: boolean; // viewAllStudents 필드.
    students: StaffStudentRow[]; // students 필드.
    classes: StaffClassOption[]; // classes 필드.
}) { // 구문. 교사/직원 공용. 상태 전이는 원장만.
    const [searchQuery, setSearchQuery] = useState(""); // 교사/직원 공용 원생. 상태 전이는 원장만.
    const [selectedClassId, setSelectedClassId] = useState("ALL"); // 교사/직원 공용 원생. 상태 전이는 원장만.
    const [selectedStudentId, setSelectedStudentId] = useState( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        students[0]?.id ?? "", // 구문. 교사/직원 공용. 상태 전이는 원장만.
    ); // 호출/그룹 끝.
    const [showLearningRecordForm, setShowLearningRecordForm] = useState(false); // 교사/직원 공용 원생. 상태 전이는 원장만.

    const filteredStudents = useMemo(() => { // 반·이름. 상태 전이는 원장 화면 몫.
        const normalizedQuery = searchQuery.trim().toLowerCase(); // 교사/직원 공용. 상태 전이는 원장만.

        return students.filter((student) => { // 반환. 교사/직원 공용. 상태 전이는 원장만.
            const matchesClass = // 교사/직원 공용. 상태 전이는 원장만.
                selectedClassId === "ALL" || // 교사/직원 공용. 상태 전이는 원장만.
                student.classes.some( // 구문. 교사/직원 공용. 상태 전이는 원장만.
                    (academyClass) => academyClass.id === selectedClassId, // 구문. 교사/직원 공용. 상태 전이는 원장만.
                ); // 호출/그룹 끝.
            const matchesQuery = // 교사/직원 공용. 상태 전이는 원장만.
                !normalizedQuery || // 교사/직원 공용. 상태 전이는 원장만.
                student.name.toLowerCase().includes(normalizedQuery) || // 교사/직원 공용. 상태 전이는 원장만.
                student.classes.some((academyClass) => // 교사/직원 공용. 상태 전이는 원장만.
                    academyClass.name.toLowerCase().includes(normalizedQuery), // 구문. 교사/직원 공용. 상태 전이는 원장만.
                ); // 호출/그룹 끝.

            return matchesClass && matchesQuery; // 반환. 교사/직원 공용. 상태 전이는 원장만.
        }); // 객체/호출 끝.
    }, [students, searchQuery, selectedClassId]); // 교사/직원 공용. 상태 전이는 원장만.

    const selectedStudent = // 교사/직원 공용. 상태 전이는 원장만.
        filteredStudents.find( // 구문. 교사/직원 공용. 상태 전이는 원장만.
            (student) => student.id === selectedStudentId, // 구문. 교사/직원 공용. 상태 전이는 원장만.
        ) ?? // 교사/직원 공용. 상태 전이는 원장만.
        filteredStudents[0] ?? // 교사/직원 공용. 상태 전이는 원장만.
        null; // 교사/직원 공용. 상태 전이는 원장만.
    const writableClassIds = useMemo( // 교사/직원 공용 원생. 상태 전이는 원장만.
        () => new Set(classes.map((academyClass) => academyClass.id)), // 구문. 교사/직원 공용. 상태 전이는 원장만.
        [classes], // 구문. 교사/직원 공용. 상태 전이는 원장만.
    ); // 호출/그룹 끝.

    function selectStudent(studentId: string) { // 로컬 헬퍼. 교사/직원 공용. 상태 전이는 원장만.
        setSelectedStudentId(studentId); // 교사/직원 공용. 상태 전이는 원장만.
        setShowLearningRecordForm(false); // 교사/직원 공용. 상태 전이는 원장만.
    } // 블록 끝.

    return ( // 교사/직원 공용 원생. 상태 전이는 원장만.
        <section className={screenStyles.animatedPage}>{/* 교사/직원 공용 원생. 상태 전이는 원장만. */}
            <header className={pageHeadingStyles.root}>{/* 학습 기록 작성 토글. 교사·직원이 같은 Screen. */}
                <div>{/* 레이아웃 상자. */}
                    <span>MY STUDENTS</span>{/* 인라인 표시. */}
                    <h1>학생 관리</h1>{/* 제목. */}
                    <p>학생의 출결과 최근 학습 기록을 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="button" // type 필드.
                    className={buttonStyles.primary} // className 필드.
                    disabled={!selectedStudent} // disabled 필드.
                    onClick={() => // onClick 필드.
                        setShowLearningRecordForm((isVisible) => !isVisible) // 교사/직원 공용. 상태 전이는 원장만.
                    } // 블록 끝.
                >{/* 교사/직원 공용. 상태 전이는 원장만. */}
                    {showLearningRecordForm ? "닫기" : "기록 작성"}{/* 교사/직원 공용. 상태 전이는 원장만. */}
                </button>{/* button 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.filters}>{/* 검색·반. viewAllStudents면 전체 학생 칩. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>학생 검색</span>{/* 인라인 표시. */}
                    <input // 입력. 서버에서 다시 검증한다.
                        type="search" // type 필드.
                        placeholder="이름 또는 반" // placeholder 필드.
                        value={searchQuery} // value 필드.
                        onChange={(event) => setSearchQuery(event.target.value)} // onChange 필드.
                    />{/* 구문 끝. */}
                </label>{/* label 닫기. */}
                <label className={cx(fieldStyles.root, styles.field)}>{/* 필드 라벨. */}
                    <span>반</span>{/* 인라인 표시. */}
                    <select // 선택. 서버에서 다시 검증한다.
                        value={selectedClassId} // value 필드.
                        onChange={(event) => // onChange 필드.
                            setSelectedClassId(event.target.value) // 교사/직원 공용. 상태 전이는 원장만.
                        } // 블록 끝.
                    >{/* 교사/직원 공용. 상태 전이는 원장만. */}
                        <option value="ALL">전체 반</option>{/* 선택지. */}
                        {classes.map((academyClass) => ( // 구문. 교사/직원 공용. 상태 전이는 원장만.
                            <option key={academyClass.id} value={academyClass.id}>{/* 선택지. */}
                                {academyClass.name}{/* 교사/직원 공용. 상태 전이는 원장만. */}
                            </option> // option 닫기.
                        ))}{/* 구문 끝. */}
                    </select>{/* select 닫기. */}
                </label>{/* label 닫기. */}
                <StatusChip>{/* StatusChip. 교사/직원 공용. 상태 전이는 원장만. */}
                    {viewAllStudents ? "전체 학생" : "담당 반"} ·{" "}{/* 교사/직원 공용. 상태 전이는 원장만. */}
                    {filteredStudents.length}명{/* 교사/직원 공용. 상태 전이는 원장만. */}
                </StatusChip>{/* StatusChip 닫기. */}
            </div>{/* div 닫기. */}

            {students.length === 0 ? ( // 구문. 교사/직원 공용. 상태 전이는 원장만.
                <div className={cx(surfaceStyles.root, emptyStateStyles.root, styles.empty)}>{/* 반 배정 전 */}
                    <h2>담당 학생이 없습니다</h2>{/* 소제목. */}
                    <p>반 배정이 되면 이곳에 학생이 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 교사/직원 공용. 상태 전이는 원장만.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <StaffStudentList // 스코프 안 재원생
                        students={filteredStudents} // students 필드.
                        selectedStudentId={selectedStudent?.id ?? null} // selectedStudentId 필드.
                        onSelect={selectStudent} // onSelect 필드.
                    />{/* 구문 끝. */}
                    {selectedStudent && ( // 구문. 교사/직원 공용. 상태 전이는 원장만.
                        <StaffStudentDetail // 출결·학습 기록. 상태 전이는 없다.
                            student={selectedStudent} // student 필드.
                            showLearningRecordForm={showLearningRecordForm} // showLearningRecordForm 필드.
                            writableClassIds={writableClassIds} // writableClassIds 필드.
                        /> // 구문 끝.
                    )}{/* 구문 끝. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
