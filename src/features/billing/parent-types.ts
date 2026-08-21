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

import type { InvoiceStatus } from "@/features/billing/types"; // 상태 코드 공유. 라벨은 presentation이 나눈다.

/** 원장·학부모가 같은 코드값을 쓰도록 재export. 라벨은 presentation이 역할별로 나눈다. */
export type { InvoiceStatus } from "@/features/billing/types"; // 화면이 billing/types를 직접 안 보게.

/** 학부모에게 보이는 청구서 한 건. 최근 결제 1건을 붙여 실패 메시지를 보여 준다. */
export type ParentInvoice = { // DRAFT는 parent-data where에서 제외.
    id: string; // Invoice PK.
    title: string; // 청구 제목.
    items: Array<{ name: string; amount: number }>; // 항목. 원장 목록 행에는 없다.
    totalAmount: number; // 합계.
    status: InvoiceStatus; // DRAFT는 parent-data에서 제외.
    dueDate: string; // ISO 납기.
    issuedAt: string | null; // 발행 시각.
    paidAt: string | null; // 완납 시각.
    studentId: string; // 자녀 Student PK.
    studentName: string; // 자녀 이름.
    latestPayment: { // 최근 결제 1건. 없으면 미결제.
        id: string; // Payment PK.
        orderId: string; // 토스 주문 id.
        status: string; // 결제 상태 코드.
        method: string | null; // 결제 수단.
        approvedAt: string | null; // 승인 시각.
        failureMessage: string | null; // 토스 실패 안내. 웹훅 처리는 이 타입이 아니다.
    } | null; // 결제 이력 없으면 null.
};

/** 결제 대기(ISSUED·OVERDUE)와 이력(PAID·CANCELLED)을 화면이 탭처럼 나누게 한다. */
export type ParentPaymentsData = { // parent-data가 두 배열로 나눈다.
    payable: ParentInvoice[]; // ISSUED·OVERDUE.
    history: ParentInvoice[]; // PAID·CANCELLED.
};
