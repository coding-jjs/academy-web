import type { InvoiceStatus } from "@/features/billing/types";
import { formatKstYearMonthDay } from "@/lib/date-kst";

type InvoiceStatusMetadata = Record<
    InvoiceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
>;

export const MANAGEMENT_INVOICE_STATUS_METADATA: InvoiceStatusMetadata = {
    DRAFT: { label: "초안", tone: "neutral" },
    ISSUED: { label: "발행", tone: "warning" },
    OVERDUE: { label: "연체", tone: "danger" },
    PAID: { label: "완납", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

export const PARENT_INVOICE_STATUS_METADATA: InvoiceStatusMetadata = {
    DRAFT: { label: "작성중", tone: "neutral" },
    ISSUED: { label: "결제 대기", tone: "warning" },
    OVERDUE: { label: "미납", tone: "danger" },
    PAID: { label: "완료", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

export function formatInvoiceAmount(amount: number) {
    return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

export function formatInvoiceDate(isoDate: string) {
    return formatKstYearMonthDay(isoDate);
}
