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
export type ParentReportItem = { // SENT만. 초안·반려는 parent-data where에서 뺀다.
    id: string; // AiReport PK.
    content: string; // 원장 승인 때 Message와 같은 본문.
    keywords: string[]; // 관찰 포인트. 반려 사유는 없다.
    teacherName: string; // 작성 교사 이름.
    periodStart: string; // ISO.
    periodEnd: string; // ISO.
    sentAt: string | null; // approveAndSendReport가 찍은 시각.
    parentReadAt: string | null; // 읽음은 이 타입이 아니라 인박스/화면 액션.
};

/** 연결된 자녀 한 명과 그 자녀의 SENT 리포트 목록. */
export type ParentReportChild = { // 종료되지 않은 링크만 parent-data가 채운다.
    id: string; // Student PK.
    name: string; // User.name.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12 문자열.
    className: string | null; // 활성 수강 1건.
    teacherName: string | null; // 반 담당.
    reports: ParentReportItem[]; // SENT만. 초안은 없음.
};
