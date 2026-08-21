/**
 * 리포트를 작성할 학생 목록 (서버 컴포넌트).
 *
 * props: students, selectedStudentId, onSelect.
 * 스코프 밖 학생은 page가 이미 걸렀다. 저장하지 않고 선택만 한다.
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
import { cx, panelStyles, surfaceStyles } from "@/components/ui/shared-styles"; // 공유 UI 클래스. 로직이 아니다.
import type { StaffReportStudent } from "@/features/reports/types"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import { // 의존성. 교사 Screen. StaffDashboard는 교사 전용.
    getStudentReportStatus, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    REPORT_STATUS_METADATA, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
} from "@/features/reports/presentation"; // 교사 Screen. StaffDashboard는 교사 전용.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 교사 Screen. StaffDashboard는 교사 전용.
import styles from "../StaffReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 학생별 리포트 상태 칩과 선택 버튼을 그린다. */
export default function ReportStudentList({ // 이 파일의 화면. 교사 Screen. StaffDashboard는 교사 전용.
    students, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    selectedStudentId, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    onSelect, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
}: { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    students: StaffReportStudent[]; // students 필드.
    selectedStudentId: string; // selectedStudentId 필드.
    onSelect: (studentId: string) => void; // onSelect 필드.
}) { // 구문. 교사 Screen. StaffDashboard는 교사 전용.
    return ( // JSX 반환. 교사 Screen. StaffDashboard는 교사 전용.
        <article className={cx(surfaceStyles.root, styles.listPanel)}>{/* 스코프 안 학생. 저장하지 않고 선택만. */}
            <div className={panelStyles.head}>{/* 레이아웃 상자. */}
                <h2>학생 목록</h2>{/* 소제목. */}
                <StatusChip>{students.length}명</StatusChip>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
            </div>{/* div 닫기. */}
            <ul className={styles.studentList}>{/* 목록. */}
                {students.map((student) => { // 선택만. 원장 승인 전에 학부모에게 안 나간다.
                    const status = getStudentReportStatus(student); // 교사 Screen. StaffDashboard는 교사 전용.
                    const statusMetadata = REPORT_STATUS_METADATA[status]; // 교사 Screen. StaffDashboard는 교사 전용.

                    return ( // JSX 반환. 교사 Screen. StaffDashboard는 교사 전용.
                        <li key={student.id}>{/* 항목. */}
                            <button // 편집기는 ReportEditor. 여기서 저장하지 않는다.
                                type="button" // type 필드.
                                className={ // 객체/블록 시작.
                                    student.id === selectedStudentId // 교사 Screen. StaffDashboard는 교사 전용.
                                        ? styles.activeStudent // 교사 Screen. StaffDashboard는 교사 전용.
                                        : undefined // 교사 Screen. StaffDashboard는 교사 전용.
                                } // 블록 끝.
                                onClick={() => onSelect(student.id)} // onClick 필드.
                            >{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                <span>{/* 인라인 표시. */}
                                    <strong>{student.name}</strong>{/* 강조. */}
                                    <small>{/* 보조 문장. */}
                                        {student.className ?? // 교사 Screen. StaffDashboard는 교사 전용.
                                            formatStudentSchool( // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                                student.schoolName, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                                student.grade, // 구문. 교사 Screen. StaffDashboard는 교사 전용.
                                            )}{/* 구문 끝. */}
                                    </small>{/* small 닫기. */}
                                </span>{/* span 닫기. */}
                                <StatusChip tone={statusMetadata.tone}>{/* StatusChip. 교사 Screen. StaffDashboard는 교사 전용. */}
                                    {statusMetadata.label}{/* 교사 Screen. StaffDashboard는 교사 전용. */}
                                </StatusChip>{/* StatusChip 닫기. */}
                            </button>{/* button 닫기. */}
                        </li> // li 닫기.
                    ); // 호출/그룹 끝.
                })}{/* 구문 끝. */}
            </ul>{/* ul 닫기. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
