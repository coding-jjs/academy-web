/**
 * 문의 상태 라벨·톤과 상담 일시 표시.
 *
 * 호출: 문의 패널·원장 학생 상담 UI.
 * datetime-local 기본값은 브라우저 로컬 시각을 써서 서버의 미래 일시(+60초) 검증과 맞춘다.
 *
 * 의도적으로 하지 않는 일:
 * - 상태 전환 허용 값을 여기서 강제하지 않음 → `actions.ts`의 allowed 목록.
 * - 평가일처럼 KST 날짜만 쓰지 않음. 상담은 시각까지 필요하므로 로컬 datetime-local.
 *
 * 관련: `types.ts`, `@/lib/date-kst`.
 */

import type { InquiryStatus } from "@/features/counseling/types"; // 칩 라벨용. 전환 허용 값은 actions.ts.
import { formatKstDateTime } from "@/lib/date-kst"; // 상담은 시각까지. 평가일처럼 날짜만 자르지 않는다.

/** 문의 처리 단계 → 화면 문구·칩 색. */
export const INQUIRY_STATUS_METADATA: Record< // 게스트 문의 칩. 원생 카드는 만들지 않는다.
    InquiryStatus, // NEW/IN_PROGRESS만 직원 큐. DONE/SPAM은 뺀다.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // 화면 칩. 서버 enum이 아니다.
> = { // 상태 코드를 화면이 직접 해석하지 않게.
    NEW: { label: "신규", tone: "warning" }, // 게스트 createInquiry 직후. 제출자 userId는 없다.
    IN_PROGRESS: { label: "진행중", tone: "neutral" }, // 직원 큐에 남는 상태. 교사는 이 목록을 안 본다.
    DONE: { label: "완료", tone: "success" }, // staff-data where에서 빼 진행 중만 보여 준다.
    SPAM: { label: "스팸", tone: "danger" }, // 큐에서 뺀다. 원생 카드는 만들지 않는다.
};

/** ISO 상담 일시를 KST 날짜+시각으로 표시. */
export function formatCounselingDateTime(isoDate: string) { // 평가일처럼 날짜만 자르지 않는다.
    return formatKstDateTime(isoDate); // ISO → KST 날짜+시각. datetime-local 기본값과는 별개.
}

/**
 * datetime-local 입력 기본값. 서버 TZ가 아니라 브라우저 로컬을 쓴다.
 * UTC ISO를 넣으면 한국에서 몇 시간 어긋난 기본값이 된다.
 */
export function getCurrentLocalDateTimeInput(date = new Date()) { // 브라우저 로컬. 서버 TZ가 아니다.
    const pad = (value: number) => String(value).padStart(2, "0"); // datetime-local용 2자리.
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; // 브라우저 로컬. UTC ISO를 넣으면 한국에서 몇 시간 어긋난다.
}
