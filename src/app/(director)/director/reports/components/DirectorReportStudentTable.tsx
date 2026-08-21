/**
 * 학생별 리포트 상태 표 (서버 컴포넌트).
 *
 * props: students, activeStudentId, onSelect.
 * 승인/반려는 부모 Screen이 director-actions로 보낸다. 여기서는 선택만.
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { cx, panelStyles, surfaceStyles } from "@/components/ui/shared-styles"; // 공유 UI 클래스. 로직이 아니다.
import { REPORT_STATUS_METADATA } from "@/features/reports/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import type { DirectorReportStudent } from "@/features/reports/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { getStudentReportStatus } from "@/features/reports/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { formatStudentSchool } from "@/features/students/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 학생 행을 눌러 상세 패널을 연다. */
export default function DirectorReportStudentTable({ // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    students, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    activeStudentId, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    onSelect, // 구문. 원장 Screen. layout requireRole DIRECTOR.
}: { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    students: DirectorReportStudent[]; // students 필드.
    activeStudentId: string | null; // activeStudentId 필드.
    onSelect: (studentId: string) => void; // onSelect 필드.
}) { // 구문. 원장 Screen. layout requireRole DIRECTOR.
    return ( // JSX 반환. 원장 Screen. layout requireRole DIRECTOR.
        <article className={cx(surfaceStyles.root, styles.tablePanel)}>{/* 학생별 리포트 상태. 승인/반려는 상세 패널. */}
            <div className={panelStyles.head}>{/* 레이아웃 상자. */}
                <h2>학생 목록</h2>{/* 소제목. */}
                <StatusChip>{students.length}명</StatusChip>{/* StatusChip. 원장 Screen. layout requireRole DIRECTOR. */}
            </div>{/* div 닫기. */}
            <div className={styles.tableWrap}>{/* 레이아웃 상자. */}
                <table>{/* 선택만. 교사 초안 작성이 아니다. */}
                    <thead><tr><th>학생</th><th>학교·학년</th><th>반</th><th>상태</th></tr></thead>{/* 표 머리. */}
                    <tbody>{/* 표 몸. */}
                        {students.map((student) => { // 행 클릭 → 상세. 여기서 승인하지 않는다.
                            const metadata = REPORT_STATUS_METADATA[getStudentReportStatus(student)]; // 원장 Screen. layout requireRole DIRECTOR.
                            return ( // JSX 반환. 원장 Screen. layout requireRole DIRECTOR.
                                <tr key={student.id} className={student.id === activeStudentId ? styles.activeRow : undefined} onClick={() => onSelect(student.id)}>{/* 행. */}
                                    <td><strong>{student.name}</strong><small>{student.email}</small></td>{/* 칸. */}
                                    <td>{formatStudentSchool(student.schoolName, student.grade)}</td>{/* 칸. */}
                                    <td>{student.className ?? "—"}</td>{/* 칸. */}
                                    <td><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip></td>{/* 칸. */}
                                </tr> // tr 닫기.
                            ); // 호출/그룹 끝.
                        })}{/* 구문 끝. */}
                    </tbody>{/* tbody 닫기. */}
                </table>{/* table 닫기. */}
            </div>{/* div 닫기. */}
        </article> // article 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
