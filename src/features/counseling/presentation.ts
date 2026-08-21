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

import type { InquiryStatus } from "@/features/counseling/types";
import { formatKstDateTime } from "@/lib/date-kst";

/** 문의 처리 단계 → 화면 문구·칩 색. */
export const INQUIRY_STATUS_METADATA: Record<
    InquiryStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    NEW: { label: "신규", tone: "warning" },
    IN_PROGRESS: { label: "진행중", tone: "neutral" },
    DONE: { label: "완료", tone: "success" },
    SPAM: { label: "스팸", tone: "danger" },
};

/** ISO 상담 일시를 KST 날짜+시각으로 표시. */
export function formatCounselingDateTime(isoDate: string) {
    return formatKstDateTime(isoDate);
}

/**
 * datetime-local 입력 기본값. 서버 TZ가 아니라 브라우저 로컬을 쓴다.
 * UTC ISO를 넣으면 한국에서 몇 시간 어긋난 기본값이 된다.
 */
export function getCurrentLocalDateTimeInput(date = new Date()) {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
