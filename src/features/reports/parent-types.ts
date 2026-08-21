/**
 * 학부모 리포트 화면용 자녀·발송 리포트 조회 모델이다.
 *
 * 호출: `parent-data.ts`가 SENT 건만 채워 `(parent)/parent/reports`가 읽는다.
 * 읽음 시각(`parentReadAt`)과 기간만 화면에 넘기면 된다.
 *
 * 의도적으로 하지 않는 일:
 * - DRAFTING·PENDING_APPROVAL·REJECTED는 넣지 않는다 → 가정에는 승인·발송본만.
 * - 교사 편집 필드(반려 사유 등) → `types.ts`의 `StaffReportItem`.
 *
 * 관련: `parent-data.ts`, `director-actions.ts`(승인 시 SENT + Message).
 */

/** 학부모에게 보여 주는 발송 완료 리포트 한 건. */
export type ParentReportItem = {
    id: string;
    content: string;
    keywords: string[];
    teacherName: string;
    periodStart: string;
    periodEnd: string;
    sentAt: string | null;
    parentReadAt: string | null;
};

/** 연결된 자녀 한 명과 그 자녀의 SENT 리포트 목록. */
export type ParentReportChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    reports: ParentReportItem[];
};
