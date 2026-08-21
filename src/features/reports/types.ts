/**
 * 교사·원장 리포트 워크플로의 상태와 학생 행 모델이다.
 *
 * 호출: `staff-data` / `director-data`가 채우고,
 * `(teacher)/teacher/reports`, `(director)/director/reports` 화면이 읽는다.
 * 초안(편집 가능)과 잠긴 제출(승인 대기·발송)을 같은 `ReportStatus`로 맞춘다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 조회 모델 → `parent-types.ts` (SENT만, 읽음 시각 포함).
 * - 상태 전이 → `staff-actions` / `director-actions`.
 *
 * 관련: `presentation.ts`(라벨), `staff-data.ts`(초안 vs 잠긴 행 분리).
 */

/** 리포트 수명주기. UNWRITTEN은 DB 행이 없을 때 화면이 쓰는 가상 상태다. */
export type ReportStatus =
    | "UNWRITTEN"
    | "DRAFTING"
    | "PENDING_APPROVAL"
    | "REJECTED"
    | "SENT"
    | "FAILED";

/** 학생 한 명에 붙는 리포트 한 건. 기간·키워드·반려 사유까지 편집기가 쓴다. */
export type StaffReportItem = {
    id: string;
    status: ReportStatus;
    content: string;
    keywords: string[];
    rejectionReason: string | null;
    teacherName: string;
    periodStart: string;
    periodEnd: string;
    updatedAt: string;
};

/** 교사 화면의 학생 한 행. 작업 초안과 잠긴 제출을 같이 둔다. */
export type StaffReportStudent = {
    id: string;
    studentProfileId: string | null;
    name: string;
    email: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    /** 편집 가능한 초안. 없으면 최신 잠긴 리포트를 보여 빈 화면을 피한다. */
    report: StaffReportItem | null;
    /** 가장 최근 잠긴 리포트(승인 대기·발송·실패). 승인 큐 배지에 쓴다. */
    submittedReport: StaffReportItem | null;
    /** 잠긴 리포트 목록. 최신순이며 submittedReport를 포함한다. */
    submittedReports: StaffReportItem[];
};

/** 원장 승인 큐의 학생 한 행. 최신 리포트 1건만 붙인다. */
export type DirectorReportStudent = {
    id: string;
    studentProfileId: string | null;
    name: string;
    email: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    report: {
        id: string;
        status: ReportStatus;
        content: string;
        teacherName: string;
        periodStart: string;
        periodEnd: string;
    } | null;
};
