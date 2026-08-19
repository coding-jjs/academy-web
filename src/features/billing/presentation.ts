/**
 * 청구 상태 라벨(관리자/학부모)과 금액·날짜 표시 헬퍼다.
 *
 * 호출: 원장 `InvoiceListPanel`, 학부모 `ParentPaymentsScreen`.
 * 같은 InvoiceStatus라도 역할에 따라 문구가 달라 메타데이터를 나눈다.
 *
 * 의도적으로 하지 않는 일:
 * - 상태 전이·발행 액션은 없다. 아직 createInvoice가 없다.
 * - 타임존 변환은 `formatKstYearMonthDay`에 맡긴다.
 *
 * 관련: `types.ts`의 `InvoiceStatus`.
 */

import type { InvoiceStatus } from "@/features/billing/types"; // 상태 코드. 전이는 아직 없음.
import { formatKstYearMonthDay } from "@/lib/date-kst"; // 목록 납기. UTC 자르지 않음.

type InvoiceStatusMetadata = Record< // 라벨+칩 톤. 역할별로 문구가 다르다.
    InvoiceStatus, // DRAFT 포함. 학부모 목록에는 안 나와도 맵은 채운다.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip.
>; // InvoiceStatusMetadata 끝.

/** 원장 화면: 초안·발행·연체·완납. */
export const MANAGEMENT_INVOICE_STATUS_METADATA: InvoiceStatusMetadata = { // 원장 목록 칩.
    DRAFT: { label: "초안", tone: "neutral" }, // 학부모 목록에는 안 나옴. 발행 버튼만.
    ISSUED: { label: "발행", tone: "warning" }, // 결제 대기. 학부모 라벨과 다름.
    OVERDUE: { label: "연체", tone: "danger" }, // 학부모는 "미납".
    PAID: { label: "완납", tone: "success" }, // 학부모는 "완료".
    CANCELLED: { label: "취소", tone: "neutral" }, // 발행 버튼 없음.
};

/** 학부모 화면: 작성중·결제 대기·미납. DRAFT는 목록에 안 나오지만 맵은 채워 둔다. */
export const PARENT_INVOICE_STATUS_METADATA: InvoiceStatusMetadata = { // 학부모 결제 칩.
    DRAFT: { label: "작성중", tone: "neutral" }, // parent-data where에서 빼지만 맵은 채운다.
    ISSUED: { label: "결제 대기", tone: "warning" }, // 원장 "발행"과 문구가 다르다.
    OVERDUE: { label: "미납", tone: "danger" }, // 원장 "연체"와 문구가 다르다.
    PAID: { label: "완료", tone: "success" }, // 원장 "완납"과 문구가 다르다.
    CANCELLED: { label: "취소", tone: "neutral" }, // 이력 탭.
};

/** ko-KR 천 단위 + '원'. */
export function formatInvoiceAmount(amount: number) { // 표시만. 발행 액션이 아니다.
    return `${new Intl.NumberFormat("ko-KR").format(amount)}원`; // 상태 전이가 아니라 라벨만.
}

/** ISO 시각을 KST 날짜 라벨로. 목록 납기 표시용. */
export function formatInvoiceDate(isoDate: string) { // UTC 자정으로 자르지 않는다.
    return formatKstYearMonthDay(isoDate); // 목록 납기 표시. 발행 액션이 아니다.
}
