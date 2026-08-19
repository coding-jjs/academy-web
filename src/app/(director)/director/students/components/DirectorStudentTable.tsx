/**
 * 원장 원생 목록 테이블 (서버 컴포넌트).
 *
 * props: students, 선택 id, panelMode, 반/상담 선택 콜백.
 * 저장은 상세·상담 패널의 Action. 여기서는 행 선택만.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    typographyStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import type { DirectorStudent } from "@/features/students/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    STUDENT_STATUS_METADATA, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    formatStudentSchool, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/students/presentation"; // 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorStudentsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 원생 행과 반/상담 열기 버튼을 그린다. */
export default function DirectorStudentTable({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    students, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    totalStudentCount, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    selectedStudentId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    panelMode, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onSelectClass, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onSelectCounseling, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    students: DirectorStudent[]; // students 필드.
    totalStudentCount: number; // totalStudentCount 필드.
    selectedStudentId: string | null; // selectedStudentId 필드.
    panelMode: "class" | "counseling" | null; // panelMode 필드.
    onSelectClass: (studentId: string) => void; // onSelectClass 필드.
    onSelectCounseling: (studentId: string) => void; // onSelectCounseling 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    if (students.length === 0) { // 분기. 원장 Screen. layout requireRole DIRECTOR.
        return ( // 전체 없음 vs 필터 결과 없음.
            <div className={cx(surfaceStyles.root, emptyStateStyles.root)}>{/* 레이아웃 상자. */}
                <h2>{/* 소제목. */}
                    {totalStudentCount === 0 // 원장 Screen. layout requireRole DIRECTOR.
                        ? "등록된 학생이 없습니다" // 원장 Screen. layout requireRole DIRECTOR.
                        : "조건에 맞는 학생이 없습니다"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </h2>{/* h2 닫기. */}
                <p>{/* 문장. */}
                    {totalStudentCount === 0 // 원장 Screen. layout requireRole DIRECTOR.
                        ? "가입 사용자에서 학생 역할을 부여하면 여기에 표시됩니다." // 원장 Screen. layout requireRole DIRECTOR.
                        : "검색어나 필터를 바꿔보세요."}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                </p>{/* p 닫기. */}
                {totalStudentCount === 0 && ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                    <Link href="/director/users" className={styles.headerLink}>{/* 이동. layout 가드를 대신하지 않는다. */}
                        가입 사용자 보기{/* 원장 Screen. layout requireRole DIRECTOR. */}
                    </Link> // Link 닫기.
                )}{/* 구문 끝. */}
            </div> // div 닫기.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    return ( // 원장 명단 표. 선택만.
        <div className={styles.tableWrap}>{/* 레이아웃 상자. */}
            <table>{/* 반/상담 패널만 연다. 저장은 상세 Action. */}
                <thead>{/* 표 머리. */}
                    <tr>{/* 행. */}
                        <th>학생</th>{/* 머리칸. */}
                        <th>반</th>{/* 머리칸. */}
                        <th>연동</th>{/* 머리칸. */}
                        <th>학부모</th>{/* 머리칸. */}
                        <th>상태</th>{/* 머리칸. */}
                        <th>조치</th>{/* 머리칸. */}
                        <th>상담 관리</th>{/* 머리칸. */}
                    </tr>{/* tr 닫기. */}
                </thead>{/* thead 닫기. */}
                <tbody>{/* 표 몸. */}
                    {students.map((student) => { // 구문. 원장 Screen. layout requireRole DIRECTOR.
                        const statusMetadata = // 원장 Screen. layout requireRole DIRECTOR.
                            STUDENT_STATUS_METADATA[student.status]; // 원장 Screen. layout requireRole DIRECTOR.
                        const isActive = selectedStudentId === student.id; // 원장 Screen. layout requireRole DIRECTOR.

                        return ( // 원장 명단 표. 선택만.
                            <tr // 행.
                                key={student.id} // key 필드.
                                className={ // 객체/블록 시작.
                                    isActive ? styles.activeRow : undefined // 원장 Screen. layout requireRole DIRECTOR.
                                } // 블록 끝.
                            >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                <td>{/* 칸. */}
                                    <strong>{student.name}</strong>{/* 강조. */}
                                    <small>{/* 보조 문장. */}
                                        {formatStudentSchool( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            student.schoolName, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            student.grade, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            "학교·학년 미입력", // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        )}{/* 구문 끝. */}
                                    </small>{/* small 닫기. */}
                                </td>{/* td 닫기. */}
                                <td>{/* 칸. */}
                                    {student.classes.length === 0 ? ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        <span className={typographyStyles.muted}>{/* 인라인 표시. */}
                                            반 미배정{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        </span> // span 닫기.
                                    ) : ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        <div className={styles.chips}>{/* 레이아웃 상자. */}
                                            {student.classes.map( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                                (enrollment) => ( // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                                    <span // 인라인 표시.
                                                        key={ // 객체/블록 시작.
                                                            enrollment.enrollmentId // 원장 Screen. layout requireRole DIRECTOR.
                                                        } // 블록 끝.
                                                        className={ // 객체/블록 시작.
                                                            styles.classChip // 원장 Screen. layout requireRole DIRECTOR.
                                                        } // 블록 끝.
                                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                                        {enrollment.className}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                                    </span> // span 닫기.
                                                ), // 구문 끝.
                                            )}{/* 구문 끝. */}
                                        </div> // div 닫기.
                                    )}{/* 구문 끝. */}
                                </td>{/* td 닫기. */}
                                <td>{/* 칸. */}
                                    <StatusChip // StatusChip. 원장 Screen. layout requireRole DIRECTOR.
                                        tone={ // 객체/블록 시작.
                                            student.googleLinked // 원장 Screen. layout requireRole DIRECTOR.
                                                ? "success" // 원장 Screen. layout requireRole DIRECTOR.
                                                : "neutral" // 원장 Screen. layout requireRole DIRECTOR.
                                        } // 블록 끝.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        {student.googleLinked // 원장 Screen. layout requireRole DIRECTOR.
                                            ? "연동" // 원장 Screen. layout requireRole DIRECTOR.
                                            : "미연동"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </td>{/* td 닫기. */}
                                <td>{/* 칸. */}
                                    {student.parentCount > 0 // 원장 Screen. layout requireRole DIRECTOR.
                                        ? `${student.parentCount}명` // 원장 Screen. layout requireRole DIRECTOR.
                                        : "—"}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                </td>{/* td 닫기. */}
                                <td>{/* 칸. */}
                                    <StatusChip tone={statusMetadata.tone}>{/* StatusChip. 원장 Screen. layout requireRole DIRECTOR. */}
                                        {statusMetadata.label}{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                </td>{/* td 닫기. */}
                                <td>{/* 칸. */}
                                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                        type="button" // type 필드.
                                        className={cx( // className 필드.
                                            buttonStyles.action, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            isActive && // 원장 Screen. layout requireRole DIRECTOR.
                                                panelMode === "class" && // 원장 Screen. layout requireRole DIRECTOR.
                                                styles.actionActive, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        )} // 구문 끝.
                                        onClick={() => // onClick 필드.
                                            onSelectClass(student.id) // 원장 Screen. layout requireRole DIRECTOR.
                                        } // 블록 끝.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        반 관리{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </button>{/* button 닫기. */}
                                </td>{/* td 닫기. */}
                                <td>{/* 칸. */}
                                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                        type="button" // type 필드.
                                        className={cx( // className 필드.
                                            buttonStyles.action, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                            isActive && // 원장 Screen. layout requireRole DIRECTOR.
                                                panelMode === "counseling" && // 원장 Screen. layout requireRole DIRECTOR.
                                                styles.actionActive, // 구문. 원장 Screen. layout requireRole DIRECTOR.
                                        )} // 구문 끝.
                                        onClick={() => // onClick 필드.
                                            onSelectCounseling(student.id) // 원장 Screen. layout requireRole DIRECTOR.
                                        } // 블록 끝.
                                    >{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                        상담 관리{/* 원장 Screen. layout requireRole DIRECTOR. */}
                                    </button>{/* button 닫기. */}
                                </td>{/* td 닫기. */}
                            </tr> // tr 닫기.
                        ); // 호출/그룹 끝.
                    })}{/* 구문 끝. */}
                </tbody>{/* tbody 닫기. */}
            </table>{/* table 닫기. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
