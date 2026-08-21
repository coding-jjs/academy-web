"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 교사 AI 리포트 작성 화면 (클라이언트).
 *
 * `/teacher/reports`만 연결한다. 직원 URL에는 리포트 page가 없다.
 * props: students — staff-data. 목록은 `ReportStudentList`, 편집은 `ReportEditor`.
 * 원장 승인 전에 학부모에게 나가지 않게 초안 워크스페이스로 묶는다.
 */

import { useMemo, useState } from "react"; // 의존성. 교사 초안. 승인은 원장.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 교사 초안. 승인은 원장.
import type { StaffReportStudent } from "@/features/reports/types"; // features 데이터/액션. 교사 초안. 승인은 원장.
import { // 의존성. 교사 초안. 승인은 원장.
    buttonStyles, // 구문. 교사 초안. 승인은 원장.
    cx, // 구문. 교사 초안. 승인은 원장.
    emptyStateStyles, // 구문. 교사 초안. 승인은 원장.
    fieldStyles, // 구문. 교사 초안. 승인은 원장.
    pageHeadingStyles, // 구문. 교사 초안. 승인은 원장.
    panelStyles, // 구문. 교사 초안. 승인은 원장.
    screenStyles, // 구문. 교사 초안. 승인은 원장.
    surfaceStyles, // 구문. 교사 초안. 승인은 원장.
    typographyStyles, // 구문. 교사 초안. 승인은 원장.
} from "@/components/ui/shared-styles"; // 교사 초안. 승인은 원장.
import ReportEditor from "./components/ReportEditor"; // 같은 라우트 모듈. 교사 초안. 승인은 원장.
import ReportStudentList from "./components/ReportStudentList"; // 같은 라우트 모듈. 교사 초안. 승인은 원장.
import { getStudentReportStatus } from "@/features/reports/presentation"; // features 데이터/액션. 교사 초안. 승인은 원장.
import styles from "./StaffReportsScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 학생을 고르면 해당 리포트 편집기를 연다. */
export default function StaffReportsScreen({ // 이 파일의 화면. 교사 초안. 승인은 원장.
    students, // 구문. 교사 초안. 승인은 원장.
}: { // 구문. 교사 초안. 승인은 원장.
    students: StaffReportStudent[]; // students 필드.
}) { // 구문. 교사 초안. 승인은 원장.
    const [selectedStudentId, setSelectedStudentId] = useState( // 스코프 안 첫 학생. 저장하지 않고 선택만.
        students[0]?.id ?? "", // 구문. 교사 초안. 승인은 원장.
    ); // 호출/그룹 끝.
    const selectedStudent = // 편집기 대상. 원장 승인 전에 학부모에게 안 나간다.
        students.find((student) => student.id === selectedStudentId) ?? // 교사 초안. 승인은 원장.
        students[0] ?? // 교사 초안. 승인은 원장.
        null; // 교사 초안. 승인은 원장.
    const metrics = useMemo(() => { // 미작성·초안·승인대기/반려. 원장 승인 전에 학부모에게 안 나간다.
        const counts = { // 구문. 교사 초안. 승인은 원장.
            unwritten: 0, // unwritten 필드.
            drafting: 0, // drafting 필드.
            pendingApproval: 0, // pendingApproval 필드.
            rejected: 0, // rejected 필드.
        }; // 블록 끝.

        for (const student of students) { // 반복. 조회 범위를 넓히지 않는다.
            const status = getStudentReportStatus(student); // 교사 초안. 승인은 원장.
            if (status === "UNWRITTEN" || status === "FAILED") { // 분기. 교사 초안. 승인은 원장.
                counts.unwritten += 1; // 교사 초안. 승인은 원장.
            } else if (status === "DRAFTING") { // 다른 분기. 권한을 올리지 않는다.
                counts.drafting += 1; // 교사 초안. 승인은 원장.
            } else if (status === "PENDING_APPROVAL") { // 다른 분기. 권한을 올리지 않는다.
                counts.pendingApproval += 1; // 교사 초안. 승인은 원장.
            } else if (status === "REJECTED") { // 다른 분기. 권한을 올리지 않는다.
                counts.rejected += 1; // 교사 초안. 승인은 원장.
            } // 블록 끝.
        } // 블록 끝.

        return [ // 반환. 교사 초안. 승인은 원장.
            { // 객체/블록 시작.
                label: "미작성", // label 필드.
                value: `${counts.unwritten}명`, // value 필드.
                detail: "작성 필요", // detail 필드.
                tone: "neutral" as const, // tone 필드.
            }, // 객체/호출 끝.
            { // 객체/블록 시작.
                label: "작성 중", // label 필드.
                value: `${counts.drafting}명`, // value 필드.
                detail: "초안 편집", // detail 필드.
                tone: "neutral" as const, // tone 필드.
            }, // 객체/호출 끝.
            { // 객체/블록 시작.
                label: "승인·반려", // label 필드.
                value: `${counts.pendingApproval} / ${counts.rejected}`, // value 필드.
                detail: `학생 ${students.length}명`, // detail 필드.
                tone: "warning" as const, // tone 필드.
            }, // 객체/호출 끝.
        ]; // 교사 초안. 승인은 원장.
    }, [students]); // 교사 초안. 승인은 원장.

    return ( // 교사 초안. 직원 URL에는 리포트 page가 없다.
        <section className={screenStyles.animatedPage}>{/* 교사 초안. 직원 URL에는 리포트 page가 없다. */}
            <header className={pageHeadingStyles.root}>{/* 교사 리포트 초안. 직원 URL에는 이 Screen이 없다. */}
                <div>{/* 레이아웃 상자. */}
                    <span className={pageHeadingStyles.eyebrow}>AI REPORT</span>{/* 인라인 표시. */}
                    <h1>AI 리포트 작성</h1>{/* 제목. */}
                    <p>학습 기록을 바탕으로 리포트 초안을 만들고 검토합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.metrics}>{/* 작성 큐 */}
                {metrics.map((metric) => ( // 구문. 교사 초안. 승인은 원장.
                    <article key={metric.label} className={surfaceStyles.root}>{/* 교사 초안. 직원 URL에는 리포트 page가 없다. */}
                        <StatusChip tone={metric.tone}>{/* StatusChip. 교사 초안. 승인은 원장. */}
                            {metric.label}{/* 교사 초안. 승인은 원장. */}
                        </StatusChip>{/* StatusChip 닫기. */}
                        <strong>{metric.value}</strong>{/* 강조. */}
                        <p>{metric.detail}</p>{/* 문장. */}
                    </article> // article 닫기.
                ))}{/* 구문 끝. */}
            </div>{/* div 닫기. */}

            {!selectedStudent ? ( // 구문. 교사 초안. 승인은 원장.
                <div className={cx(surfaceStyles.root, emptyStateStyles.root)}>{/* 스코프 안 학생 없음 */}
                    <h2>표시할 학생이 없습니다</h2>{/* 소제목. */}
                    <p>학생 역할이 부여되면 이곳에 나타납니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 교사 초안. 승인은 원장.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <ReportStudentList // 학생별 리포트 상태
                        students={students} // students 필드.
                        selectedStudentId={selectedStudent.id} // selectedStudentId 필드.
                        onSelect={setSelectedStudentId} // onSelect 필드.
                    />{/* 구문 끝. */}
                    <ReportEditor // 초안 편집기. 학부모 발송은 원장 승인.
                        key={`${selectedStudent.id}:${selectedStudent.report?.id ?? "none"}:${selectedStudent.submittedReport?.id ?? "none"}:${selectedStudent.submittedReport?.updatedAt ?? ""}`} // key 필드.
                        student={selectedStudent} // student 필드.
                    />{/* 구문 끝. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
