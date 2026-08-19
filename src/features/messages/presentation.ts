/**
 * 쪽지 audience·상태 라벨.
 *
 * 호출: MessagesScreen 작곡기 셀렉트, MessageListPanel 상태 칩, data.ts 대상 요약.
 * 원장/직원 목록이 상태 코드를 직접 해석하지 않게 한곳에 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 인박스 발신자 역할 문구 → `inbox-presentation.ts`.
 * - 상태 전환 규칙을 여기서 강제하지 않음 → `actions.ts`.
 *
 * 관련: `types.ts`.
 */

import type { MessageAudience, MessageStatus } from "@/features/messages/types"; // 칩·셀렉트 문구. 전환은 actions.ts.

/** 수신 대상 코드 → 작곡기/목록 문구. */
export const MESSAGE_AUDIENCE_LABELS: Record<MessageAudience, string> = { // 직원은 ALL/STAFF를 요청하지 못한다.
    ALL: "전체 사용자", // 직원은 이 방송을 요청하지 못한다.
    STAFF: "직원(선생님·사무)", // 원장 전용 대상. 작곡기 셀렉트에는 PARENT/STUDENT만.
    PARENT: "학부모", // 수신은 PARENT User만. 학생 계정은 빼 둔다.
    STUDENT: "학생", // 원생 카드의 userId. 계정 없는 학생은 수신에서 빠진다.
};

/** 쪽지 처리 단계 → 화면 문구·칩 색. */
export const MESSAGE_STATUS_METADATA: Record< // 작성/승인 칩. 인박스 발신자 라벨이 아니다.
    MessageStatus, // PENDING은 수신 행 없음. SENT만 인박스에 있다.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // 화면 칩. 서버 enum이 아니다.
> = { // 상태 코드를 화면이 직접 해석하지 않게.
    PENDING_APPROVAL: { label: "승인 대기", tone: "warning" }, // 직원 요청. 수신 행이 없어 인박스에 없다.
    SENT: { label: "발송됨", tone: "success" }, // 원장 즉시 또는 승인 후. 수신 행이 있다.
    REJECTED: { label: "반려", tone: "danger" }, // 수신 행 없이 반려. 인박스에 안 나간다.
    DRAFT: { label: "임시", tone: "neutral" }, // 이 화면 큐에는 안 올린다.
    CANCELLED: { label: "취소", tone: "neutral" }, // 목록 칩용. 승인 액션 대상이 아니다.
};
