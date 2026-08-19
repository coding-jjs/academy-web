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

import { formatKstMonthDay } from "@/lib/date-kst"; // 대시보드 미리보기 월·일. 시각은 인박스 목록만.

/** 인박스 목록용 월·일·시·분(KST, 24시간). */
export function formatInboxDateTime(isoDate: string) { // 인박스 목록. 대시보드 미리보기는 날짜만.
    return new Intl.DateTimeFormat("ko-KR", { // KST 24시간. UTC로 찍으면 저녁 쪽지가 전날이 된다.
        timeZone: "Asia/Seoul", // UTC로 찍으면 저녁 쪽지가 전날이 된다.
        month: "2-digit", // 월 숫자. 로케일 월 이름을 피한다.
        day: "2-digit", // 일 숫자.
        hour: "2-digit", // 시.
        minute: "2-digit", // 분.
        hour12: false, // 24시간. 학부모/학생 목록이 서버 ISO와 어긋나지 않게.
    }).format(new Date(isoDate)); // Message.createdAt ISO.
}

/** 대시보드 미리보기용 월·일(KST). */
export function formatInboxDate(isoDate: string) { // 대시보드 미리보기. 시각은 인박스 목록만.
    return formatKstMonthDay(isoDate); // 대시보드 미리보기. 시각은 인박스 목록만.
}

/**
 * 발신자 역할을 짧은 한글 라벨로.
 * 매칭되지 않으면 "학원" — 시스템/리포트 자동 쪽지와 같다.
 */
export function getMessageSenderRoleLabel(role: string | null) { // 인박스 발신자. 작성 화면 상태 칩이 아니다.
    if (role === "DIRECTOR") return "원장"; // 즉시 발송·승인 쪽지.
    if (role === "TEACHER") return "선생님"; // 승인 후 SENT. 직원이 직접 SENT로 넣지 않는다.
    if (role === "STAFF") return "사무"; // 승인 후 SENT.
    return "학원"; // 시스템/리포트 자동 쪽지. 작성 화면 상태 칩이 아니다.
}
