/**
 * 원장·직원 쪽지 작성/목록 DTO와 targetFilter 형태.
 *
 * 호출: MessagesScreen, MessageComposer, MessageListPanel, data.ts.
 * broadcast는 작성 시 전체 선택 여부를 남겨 목록 요약을 '전체 발송'으로 보여 준다.
 *
 * 의도적으로 하지 않는 일:
 * - 인박스 DTO → `inbox-types.ts`.
 * - 수신 User id 해석 → `recipients.ts`.
 *
 * 관련: `target-filter.ts`, `presentation.ts`.
 */

/** 발송 대상 구분. 직원은 PARENT/STUDENT만 요청할 수 있다. */
export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT"; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.

/** 처리 단계. 직원 요청은 PENDING_APPROVAL, 원장 즉시 발송은 SENT. */
export type MessageStatus = // 직원 요청=PENDING(수신 행 없음). 원장 즉시=SENT.
    | "DRAFT" // 이 화면 큐에는 안 올린다.
    | "PENDING_APPROVAL" // 직원 요청. 수신 행이 없어 인박스에 없다.
    | "SENT" // 원장 즉시 또는 승인 후. 수신 행이 있다.
    | "REJECTED" // 수신 행 없이 반려.
    | "CANCELLED"; // 목록 칩용. 승인 액션 대상이 아니다.

/** 작곡기 학부모 체크 항목. userId는 학생 id가 아니다. */
export type MessageParentOption = { // PARENT User. 학생 계정·원생 카드가 아니다.
    userId: string; // PARENT User id. 학생 계정·원생 카드 id가 아니다.
    name: string; // 학부모 표시 이름.
};

/** 작곡기 학생 행. parents는 연결된 학부모 User만. */
export type MessageRecipientOption = { // 원생 카드. parents는 학생 User를 넣지 않는다.
    id: string; // 원생 카드 id. 학생 audience의 targetStudentIds.
    name: string; // 체크 목록 이름.
    parents?: MessageParentOption[]; // ACTIVE 링크 학부모만. 학생 User는 넣지 않는다.
};

/**
 * 승인 시 수신자를 다시 펼치기 위한 Json.
 * broadcast=true면 목록에 "전체 발송"으로 표시한다.
 */
export type MessageTargetFilter = { // 승인 때 작성자 스코프로 다시 펼친다. 수신 행이 아니다.
    studentIds?: string[]; // 학생 audience 체크 목록. 승인 때 작성자 스코프로 다시 펼친다.
    parentUserIds?: string[]; // 학부모 User id. 학생 계정이 섞이면 recipients가 거절.
    /** 작성 시 전체 선택으로 보낸 경우 */
    broadcast?: boolean; // 목록 요약만 "전체 발송". 수신 행을 전원에게 만드는 플래그가 아니다.
};

/** 원장 승인 큐·직원 내 요청 목록 행. */
export type MessageListItem = { // 작성/승인 목록. 인박스 InboxMessage가 아니다.
    id: string; // 승인·반려 키. 인박스 recipientId와 다르다.
    title: string; // 쪽지 제목.
    content: string; // 본문.
    status: MessageStatus; // 직원 요청=PENDING_APPROVAL(수신 행 없음), 원장 즉시=SENT.
    audience: MessageAudience | null; // PARENT/STUDENT. 직원은 ALL/STAFF를 요청하지 못한다.
    authorName: string; // 작성자. 없으면 "학원".
    rejectionReason: string | null; // 원장 반려 사유. PENDING에는 없다.
    createdAt: string; // ISO 작성.
    submittedAt: string | null; // 직원 승인 요청 시각. 원장 즉시 발송은 다른 경로.
    sentAt: string | null; // SENT가 된 시각. 승인 전이면 null.
    recipientCount: number; // SENT 수신 행 수. PENDING은 0 — 아직 인박스에 없다.
    /** 승인/목록용 대상 요약 ("전체 발송" 또는 이름 목록) */
    targetSummary: string; // broadcast면 "전체 발송". 수신 User id 목록이 아니다.
};
