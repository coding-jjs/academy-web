/**
 * 학부모 결제 화면용 Invoice·결제 조회 모델이다.
 *
 * 호출: `parent-data.ts` → `(parent)/parent/payments`.
 * 원장 관리 목록과 라벨·필드가 달라, 학부모 전용 타입을 따로 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - DRAFT 청구서는 넣지 않는다. parent-data where에서 뺀다.
 * - 원장 작성 UI 입력 → `InvoiceCreationPanel`.
 *
 * 관련: `types.ts`의 `InvoiceStatus`를 재export해 화면 import를 한곳으로.
 */

import type { InvoiceStatus } from "@/features/billing/types";

/** 원장·학부모가 같은 코드값을 쓰도록 재export. 라벨은 presentation이 역할별로 나눈다. */
export type { InvoiceStatus } from "@/features/billing/types";

/** 학부모에게 보이는 청구서 한 건. 최근 결제 1건을 붙여 실패 메시지를 보여 준다. */
export type ParentInvoice = {
    id: string;
    title: string;
    items: Array<{ name: string; amount: number }>;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: string;
    issuedAt: string | null;
    paidAt: string | null;
    studentId: string;
    studentName: string;
    latestPayment: {
        id: string;
        orderId: string;
        status: string;
        method: string | null;
        approvedAt: string | null;
        failureMessage: string | null;
    } | null;
};

/** 결제 대기(ISSUED·OVERDUE)와 이력(PAID·CANCELLED)을 화면이 탭처럼 나누게 한다. */
export type ParentPaymentsData = {
    payable: ParentInvoice[];
    history: ParentInvoice[];
};
