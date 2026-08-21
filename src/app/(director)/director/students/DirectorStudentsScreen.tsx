"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 원장 원생 워크스페이스 (클라이언트).
 *
 * `/director/students`가 연결. 교사 StaffStudentsScreen을 쓰지 않는다.
 * props: students, classOptions, counselingMemos.
 * 테이블·상세(`DirectorStudentDetail` director-actions)·상담
 * (`DirectorStudentCounseling` → createDirectorCounselingMemo)을 조합한다.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import { useMemo, useState } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import type { StaffCounselingMemo } from "@/features/counseling/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import type { // 타입만. 런타임 로직이 아니다.
    DirectorClassOption, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    DirectorStudent, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    StudentStatus, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/students/types"; // 원장 Screen. layout requireRole DIRECTOR.
import { STUDENT_STATUS_METADATA } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    screenStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import DirectorStudentCounseling from "./components/DirectorStudentCounseling"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import DirectorStudentDetail from "./components/DirectorStudentDetail"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import DirectorStudentTable from "./components/DirectorStudentTable"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./DirectorStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

type PanelMode = "class" | "counseling"; // 원장 Screen. layout requireRole DIRECTOR.

/** 필터와 반/상담 패널 모드를 고른다. */
export default function DirectorStudentsScreen({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    students, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    classOptions, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    counselingMemos, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    students: DirectorStudent[]; // students 필드.
    classOptions: DirectorClassOption[]; // classOptions 필드.
    counselingMemos: StaffCounselingMemo[]; // counselingMemos 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    const [panelMode, setPanelMode] = useState<PanelMode | null>(null); // 원장 원생 명단. StaffStudentsScreen을 쓰지 않는다.
    const [searchQuery, setSearchQuery] = useState(""); // 원장 원생 명단. StaffStudentsScreen을 쓰지 않는다.
    const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        "ALL", // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.
    const [classFilter, setClassFilter] = useState("ALL"); // 원장 원생 명단. StaffStudentsScreen을 쓰지 않는다.
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        null, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ); // 호출/그룹 끝.

    const metrics = useMemo(() => { // 재원·휴원·학부모 미연결.
        const enrolledCount = students.filter( // 구문. 원장 Screen. layout requireRole DIRECTOR.
            (student) => student.status === "ENROLLED", // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ).length; // 원장 Screen. layout requireRole DIRECTOR.
        const pausedCount = students.filter( // 구문. 원장 Screen. layout requireRole DIRECTOR.
            (student) => student.status === "PAUSED", // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ).length; // 원장 Screen. layout requireRole DIRECTOR.
        const unlinkedParentCount = students.filter( // 구문. 원장 Screen. layout requireRole DIRECTOR.
            (student) => student.parentCount === 0, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ).length; // 원장 Screen. layout requireRole DIRECTOR.

        return [ // 반환. 원장 Screen. layout requireRole DIRECTOR.
            { // 객체/블록 시작.
                label: STUDENT_STATUS_METADATA.ENROLLED.label, // label 필드.
                value: `${enrolledCount}명`, // value 필드.
                detail: "ENROLLED", // detail 필드.
            }, // 객체/호출 끝.
            { // 객체/블록 시작.
                label: STUDENT_STATUS_METADATA.PAUSED.label, // label 필드.
                value: `${pausedCount}명`, // value 필드.
                detail: "PAUSED", // detail 필드.
            }, // 객체/호출 끝.
            { // 객체/블록 시작.
                label: "학부모 미연결", // label 필드.
                value: `${unlinkedParentCount}명`, // value 필드.
                detail: "연결 필요", // detail 필드.
            }, // 객체/호출 끝.
        ]; // 원장 Screen. layout requireRole DIRECTOR.
    }, [students]); // 원장 Screen. layout requireRole DIRECTOR.

    const filteredStudents = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        const normalizedQuery = searchQuery.trim().toLowerCase(); // 상태·반·이름 검색. StaffStudentsScreen을 쓰지 않는다.

        return students.filter((student) => { // 반환. 원장 Screen. layout requireRole DIRECTOR.
            if (statusFilter !== "ALL" && student.status !== statusFilter) { // 분기. 원장 Screen. layout requireRole DIRECTOR.
                return false; // 반환. 원장 Screen. layout requireRole DIRECTOR.
            } // 블록 끝.
            if ( // 분기. 원장 Screen. layout requireRole DIRECTOR.
                classFilter !== "ALL" && // 원장 Screen. layout requireRole DIRECTOR.
                !student.classes.some( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    (enrollment) => enrollment.classId === classFilter, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                ) // 호출/그룹 끝.
            ) { // 인자/블록 끝.
                return false; // 반환. 원장 Screen. layout requireRole DIRECTOR.
            } // 블록 끝.
            if (!normalizedQuery) return true; // 분기. 원장 Screen. layout requireRole DIRECTOR.

            const searchableText = [ // 원장 Screen. layout requireRole DIRECTOR.
                student.name, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                student.schoolName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                student.grade, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                ...student.classes.map((enrollment) => enrollment.className), // 구문. 원장 Screen. layout requireRole DIRECTOR.
            ] // 구문 끝.
                .filter(Boolean) // 원장 Screen. layout requireRole DIRECTOR.
                .join(" ") // 원장 Screen. layout requireRole DIRECTOR.
                .toLowerCase(); // 원장 Screen. layout requireRole DIRECTOR.
            return searchableText.includes(normalizedQuery); // 반환. 원장 Screen. layout requireRole DIRECTOR.
        }); // 객체/호출 끝.
    }, [students, searchQuery, statusFilter, classFilter]); // 원장 Screen. layout requireRole DIRECTOR.

    const selectedStudent ={/* 원장 Screen. layout requireRole DIRECTOR. */}
        students.find((student) => student.id === selectedStudentId) ?? null; // 원장 Screen. layout requireRole DIRECTOR.

    const selectedMemos = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        if (!selectedStudentId) return []; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        return counselingMemos.filter( // 반환. 원장 Screen. layout requireRole DIRECTOR.
            (memo) => memo.studentId === selectedStudentId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        ); // 호출/그룹 끝.
    }, [counselingMemos, selectedStudentId]); // 원장 Screen. layout requireRole DIRECTOR.

    function openPanel(studentId: string, mode: PanelMode) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        setSelectedStudentId(studentId); // 원장 Screen. layout requireRole DIRECTOR.
        setPanelMode(mode); // 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    function closePanel() { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        setSelectedStudentId(null); // 원장 Screen. layout requireRole DIRECTOR.
        setPanelMode(null); // 원장 Screen. layout requireRole DIRECTOR.
    } // 블록 끝.

    return ( // 원장 원생 명단. StaffStudentsScreen을 쓰지 않는다.
        <section className={screenStyles.animatedPage}>{/* 원장 원생 명단. StaffStudentsScreen을 쓰지 않는다. */}
            <header className={pageHeadingStyles.root}>{/* 가입 사용자로 이동 */}
                <div>{/* 레이아웃 상자. */}
                    <span>STUDENTS</span>{/* 인라인 표시. */}
                    <h1>학생 관리</h1>{/* 제목. */}
                    <p>재원 상태, 반 배정, 출결과 학습 기록을 관리합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <Link href="/director/users" className={styles.headerLink}>{/* 이동. layout 가드를 대신하지 않는다. */}
                    가입 사용자로 이동{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </Link>{/* Link 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.metrics}>{/* 재원·휴원·미연결 */}
                {metrics.map((metric) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <article // 원장 원생 명단. StaffStudentsScreen을 쓰지 않는다.
                        key={metric.label} // key 필드.
                        className={surfaceStyles.root} // className 필드.
                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                        <span>{metric.label}</span>{/* 인라인 표시. */}
                        <strong>{metric.value}</strong>{/* 강조. */}
                        <p>{metric.detail}</p>{/* 문장. */}
                    </article> // article 닫기.
                ))}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            <div className={styles.layout} data-open={Boolean(selectedStudent)}>{/* 레이아웃 상자. */}
                <div className={cx(surfaceStyles.root, styles.tablePanel)}>{/* 레이아웃 상자. */}
                    <div className={styles.filters}>{/* 이름·상태·반 */}
                        <label className={fieldStyles.root}>{/* 필드 라벨. */}
                            학생 검색{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            <input // 입력. 서버에서 다시 검증한다.
                                type="search" // type 필드.
                                placeholder="이름 또는 반" // placeholder 필드.
                                value={searchQuery} // value 필드.
                                onChange={(event) => // onChange 필드.
                                    setSearchQuery(event.target.value) // 원장 Screen. layout requireRole DIRECTOR.
                                } // 블록 끝.
                            />{/* 구문 끝. */}
                        </label>{/* label 닫기. */}
                        <label className={fieldStyles.root}>{/* 필드 라벨. */}
                            상태{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            <select // 선택. 서버에서 다시 검증한다.
                                value={statusFilter} // value 필드.
                                onChange={(event) => // onChange 필드.
                                    setStatusFilter( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        event.target.value as // 원장 Screen. layout requireRole DIRECTOR.
                                            | "ALL" // 원장 Screen. layout requireRole DIRECTOR.
                                            | StudentStatus, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    ) // 호출/그룹 끝.
                                } // 블록 끝.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                <option value="ALL">전체</option>{/* 선택지. */}
                                <option value="ENROLLED">재원</option>{/* 선택지. */}
                                <option value="PAUSED">휴원</option>{/* 선택지. */}
                                <option value="WITHDRAWN">퇴원</option>{/* 선택지. */}
                            </select>{/* select 닫기. */}
                        </label>{/* label 닫기. */}
                        <label className={fieldStyles.root}>{/* 필드 라벨. */}
                            반{/* 원장 Screen. layout requireRole DIRECTOR. */}
                            <select // 선택. 서버에서 다시 검증한다.
                                value={classFilter} // value 필드.
                                onChange={(event) => // onChange 필드.
                                    setClassFilter(event.target.value) // 원장 Screen. layout requireRole DIRECTOR.
                                } // 블록 끝.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                <option value="ALL">전체 반</option>{/* 선택지. */}
                                {classOptions.map((academyClass) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                    <option // 선택지.
                                        key={academyClass.id} // key 필드.
                                        value={academyClass.id} // value 필드.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        {academyClass.name}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </option> // option 닫기.
                                ))}{/* 구문 끝. */}
                            </select>{/* select 닫기. */}
                        </label>{/* label 닫기. */}
                    </div>{/* div 닫기. */}

                    <DirectorStudentTable // 원생 표. 상태 전이는 상세 패널.
                        students={filteredStudents} // students 필드.
                        totalStudentCount={students.length} // totalStudentCount 필드.
                        selectedStudentId={selectedStudentId} // selectedStudentId 필드.
                        panelMode={panelMode} // panelMode 필드.
                        onSelectClass={(studentId) => // onSelectClass 필드.
                            openPanel(studentId, "class") // 원장 Screen. layout requireRole DIRECTOR.
                        } // 블록 끝.
                        onSelectCounseling={(studentId) => // onSelectCounseling 필드.
                            openPanel(studentId, "counseling") // 원장 Screen. layout requireRole DIRECTOR.
                        } // 블록 끝.
                    />{/* 구문 끝. */}
                </div>{/* div 닫기. */}

                {selectedStudent && panelMode === "class" && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <DirectorStudentDetail // 반 배정·상태 전이
                        key={`class-${selectedStudent.id}`} // key 필드.
                        student={selectedStudent} // student 필드.
                        classOptions={classOptions} // classOptions 필드.
                        onClose={closePanel} // onClose 필드.
                    /> // 구문 끝.
                )}{/* 구문 끝. */}

                {selectedStudent && panelMode === "counseling" && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <DirectorStudentCounseling // 원장 상담 메모
                        key={`counseling-${selectedStudent.id}`} // key 필드.
                        student={selectedStudent} // student 필드.
                        memos={selectedMemos} // memos 필드.
                        onClose={closePanel} // onClose 필드.
                    /> // 구문 끝.
                )}{/* 구문 끝. */}
            </div>{/* div 닫기. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
