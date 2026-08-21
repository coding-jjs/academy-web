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
export type ReportStatus = // DB enum과 화면 가상 상태를 한 유니온으로.
    | "UNWRITTEN" // DB 행 없음. staff-actions가 새 DRAFTING을 만든다.
    | "DRAFTING" // 교사 편집 가능. 학부모에게는 안 보임.
    | "PENDING_APPROVAL" // 원장 큐. Message는 아직 없음.
    | "REJECTED" // 원장 반려. Message 없이 교사 EDITABLE로 되돌림.
    | "SENT" // 원장 승인 + 학부모 Message SENT 같은 tx.
    | "FAILED"; // 발송 실패. 승인 tx가 아니라 별도 실패 표시.

/** 학생 한 명에 붙는 리포트 한 건. 기간·키워드·반려 사유까지 편집기가 쓴다. */
export type StaffReportItem = { // 교사 편집기·잠긴 제출 카드가 같은 행 모델을 쓴다.
    id: string; // AiReport PK.
    status: ReportStatus; // UNWRITTEN은 이 행에 안 온다. 행이 있으면 실제 상태.
    content: string; // 본문. 승인 시 Message body와 같다.
    keywords: string[]; // 초안 생성 관찰 포인트.
    rejectionReason: string | null; // REJECTED일 때만. SENT에는 비움.
    teacherName: string; // author.name. 원장 큐에도 쓴다.
    periodStart: string; // ISO. 화면이 Date를 직접 다루지 않게.
    periodEnd: string; // ISO. getDefaultReportPeriod YYYY-MM-DD를 서버가 파싱.
    updatedAt: string; // 목록 정렬·최근 수정 표시.
};

/** 교사 화면의 학생 한 행. 작업 초안과 잠긴 제출을 같이 둔다. */
export type StaffReportStudent = { // staff-data가 초안 vs 잠긴 행을 나눠 채운다.
    id: string; // Student User id.
    studentProfileId: string | null; // Student PK. 리포트 author 대상.
    name: string; // User.name.
    email: string; // 목록 보조 식별. 챗봇 JSON에는 안 넣는다.
    schoolName: string | null; // 온보딩 학교. 반 이름이 아니다.
    grade: string | null; // 1~12 문자열.
    className: string | null; // 활성 수강 1건의 반 이름.
    teacherName: string | null; // 그 반 담당. 리포트 author와 다를 수 있다.
    /** 편집 가능한 초안. 없으면 최신 잠긴 리포트를 보여 빈 화면을 피한다. */
    report: StaffReportItem | null; // DRAFTING·REJECTED. 제출 후엔 null일 수 있다.
    /** 가장 최근 잠긴 리포트(승인 대기·발송·실패). 승인 큐 배지에 쓴다. */
    submittedReport: StaffReportItem | null; // PENDING_APPROVAL·SENT·FAILED 최신 1건.
    /** 잠긴 리포트 목록. 최신순이며 submittedReport를 포함한다. */
    submittedReports: StaffReportItem[]; // 이력. 초안은 여기 없다.
};

/** 원장 승인 큐의 학생 한 행. 최신 리포트 1건만 붙인다. */
export type DirectorReportStudent = { // director-data는 초안/잠긴 행을 나누지 않는다.
    id: string; // Student User id.
    studentProfileId: string | null; // Student PK.
    name: string; // User.name.
    email: string; // 원장 목록 식별.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12 문자열.
    className: string | null; // 활성 수강 1건.
    teacherName: string | null; // 반 담당.
    report: { // 최신 aiReport 1건. 없으면 큐에 빈 행.
        id: string; // AiReport PK. 승인·반려 액션 키.
        status: ReportStatus; // PENDING_APPROVAL이면 승인·반려.
        content: string; // 승인 시 Message body로 복사.
        teacherName: string; // 작성 교사.
        periodStart: string; // ISO.
        periodEnd: string; // ISO.
    } | null; // 미작성이면 큐에 빈 행.
};
