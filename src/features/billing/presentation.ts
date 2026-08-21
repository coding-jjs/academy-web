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

import type { InvoiceStatus } from "@/features/billing/types";
import { formatKstYearMonthDay } from "@/lib/date-kst";

type InvoiceStatusMetadata = Record<
    InvoiceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
>;

/** 원장 화면: 초안·발행·연체·완납. */
export const MANAGEMENT_INVOICE_STATUS_METADATA: InvoiceStatusMetadata = {
    DRAFT: { label: "초안", tone: "neutral" },
    ISSUED: { label: "발행", tone: "warning" },
    OVERDUE: { label: "연체", tone: "danger" },
    PAID: { label: "완납", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

/** 학부모 화면: 작성중·결제 대기·미납. DRAFT는 목록에 안 나오지만 맵은 채워 둔다. */
export const PARENT_INVOICE_STATUS_METADATA: InvoiceStatusMetadata = {
    DRAFT: { label: "작성중", tone: "neutral" },
    ISSUED: { label: "결제 대기", tone: "warning" },
    OVERDUE: { label: "미납", tone: "danger" },
    PAID: { label: "완료", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

/** ko-KR 천 단위 + '원'. */
export function formatInvoiceAmount(amount: number) {
    return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

/** ISO 시각을 KST 날짜 라벨로. 목록 납기 표시용. */
export function formatInvoiceDate(isoDate: string) {
    return formatKstYearMonthDay(isoDate);
}
