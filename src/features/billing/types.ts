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
export type InvoiceStatus = // createInvoice가 없어 DRAFT 발행 전이는 아직 UI만.
    | "DRAFT" // 원장 초안. createInvoice가 없어 화면은 준비 중.
    | "ISSUED" // 학부모 결제 대기.
    | "PAID" // 완납.
    | "OVERDUE" // 납기 지남. 학부모는 미납 라벨.
    | "CANCELLED"; // 취소. 결제 대기 탭에서 뺀다.

/** 작성 패널 학생 선택지. 학부모 미연결이면 parentUserId=null 이라 패널이 걸러 낸다. */
export type BillingStudentOption = { // InvoiceCreationPanel이 parentUserId 있는 행만 select.
    id: string; // Student PK. UI 전용 onCreate 입력.
    name: string; // 학생 표시 이름.
    parentName: string | null; // 연결 학부모 이름.
    parentUserId: string | null; // null이면 InvoiceCreationPanel이 선택지에서 뺀다.
    className: string | null; // 활성 반 이름. 없으면 옵션 보조 문구 생략.
};

/** 원장 목록 한 행. 항목 배열은 넣지 않고 합계·상태·납기만. */
export type BillingInvoiceRow = { // 학부모 ParentInvoice와 필드가 다르다.
    id: string; // Invoice PK. 발행·취소 콜백 키. 액션은 아직 없음.
    title: string; // 목록 제목.
    totalAmount: number; // 합계. 항목 배열은 관리 목록에 안 넣는다.
    status: InvoiceStatus; // DRAFT만 발행 버튼.
    dueDate: string; // ISO. formatInvoiceDate가 KST 날짜로.
    issuedAt: string | null; // 발행 시각. DRAFT면 null.
    paidAt: string | null; // 완납 시각.
    studentName: string; // 청구 대상 학생.
    parentName: string | null; // 연결된 학부모. 없으면 목록에 학생만.
};
