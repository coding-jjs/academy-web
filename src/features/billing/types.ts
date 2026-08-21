/**
 * 원장 청구 관리용 Invoice 상태와 목록 행 모델이다.
 *
 * 호출: `data.ts`가 채우고 `BillingManagementScreen`·목록 패널이 읽는다.
 * 화면과 data 레이어가 같은 상태값을 쓰게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 결제 행(항목·결제 이력) → `parent-types.ts`.
 * - createInvoice 입력 타입 → `InvoiceCreationPanel`의 `NewInvoiceInput` (UI 전용).
 *
 * 관련: `presentation.ts`(관리자 라벨).
 */

/** 청구서 수명주기. DRAFT는 학부모 화면에 안 나오고, ISSUED·OVERDUE만 결제 대기. */
export type InvoiceStatus =
    | "DRAFT"
    | "ISSUED"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";

/** 작성 패널 학생 선택지. 학부모 미연결이면 parentUserId=null 이라 패널이 걸러 낸다. */
export type BillingStudentOption = {
    id: string;
    name: string;
    parentName: string | null;
    parentUserId: string | null;
    className: string | null;
};

/** 원장 목록 한 행. 항목 배열은 넣지 않고 합계·상태·납기만. */
export type BillingInvoiceRow = {
    id: string;
    title: string;
    totalAmount: number;
    status: InvoiceStatus;
    dueDate: string;
    issuedAt: string | null;
    paidAt: string | null;
    studentName: string;
    parentName: string | null;
};
