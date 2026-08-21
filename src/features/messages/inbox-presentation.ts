/**
 * 인박스 날짜·발신자 역할 문구.
 *
 * 호출: ParentInboxScreen, StudentMessagesPanel.
 * 시각은 KST로 맞춰 학부모/학생 화면이 서버 ISO와 어긋나지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 작성 화면 상태 라벨 → `presentation.ts`.
 * - 읽음 처리 → `inbox-actions.ts`.
 *
 * 관련: `inbox-types.ts`, `@/lib/date-kst`.
 */

import { formatKstMonthDay } from "@/lib/date-kst";

/** 인박스 목록용 월·일·시·분(KST, 24시간). */
export function formatInboxDateTime(isoDate: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(isoDate));
}

/** 대시보드 미리보기용 월·일(KST). */
export function formatInboxDate(isoDate: string) {
    return formatKstMonthDay(isoDate);
}

/**
 * 발신자 역할을 짧은 한글 라벨로.
 * 매칭되지 않으면 "학원" — 시스템/리포트 자동 쪽지와 같다.
 */
export function getMessageSenderRoleLabel(role: string | null) {
    if (role === "DIRECTOR") return "원장";
    if (role === "TEACHER") return "선생님";
    if (role === "STAFF") return "사무";
    return "학원";
}
