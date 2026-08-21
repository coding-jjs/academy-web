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

import type { MessageAudience, MessageStatus } from "@/features/messages/types";

/** 수신 대상 코드 → 작곡기/목록 문구. */
export const MESSAGE_AUDIENCE_LABELS: Record<MessageAudience, string> = {
    ALL: "전체 사용자",
    STAFF: "직원(선생님·사무)",
    PARENT: "학부모",
    STUDENT: "학생",
};

/** 쪽지 처리 단계 → 화면 문구·칩 색. */
export const MESSAGE_STATUS_METADATA: Record<
    MessageStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PENDING_APPROVAL: { label: "승인 대기", tone: "warning" },
    SENT: { label: "발송됨", tone: "success" },
    REJECTED: { label: "반려", tone: "danger" },
    DRAFT: { label: "임시", tone: "neutral" },
    CANCELLED: { label: "취소", tone: "neutral" },
};
