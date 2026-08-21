/**
 * 원장 청구 목록 패널이다. 상태별 발행·취소 버튼을 그린다.
 *
 * 호출: `BillingManagementScreen`. 실제 처리는 부모 콜백에 맡기며,
 * 현재는 `notifyUnavailable`로 준비 중 안내만 한다.
 *
 * 의도적으로 하지 않는 일:
 * - issue/cancel Server Action. 버튼 활성 조건만 상태값으로 계산한다.
 * - 학부모 결제 UI. 관리자 라벨(`MANAGEMENT_INVOICE_STATUS_METADATA`)만 쓴다.
 *
 * 관련: `presentation.ts`, `types.ts`.
 */

import StatusChip from "@/components/ui/StatusChip"; // 상태·건수 칩.
import { // 공통 UI.
    buttonStyles, // 발행 버튼.
    cx, // 패널 클래스.
    panelStyles, // 헤더.
    surfaceStyles, // 카드.
    typographyStyles, // 빈 목록 힌트.
} from "@/components/ui/shared-styles"; // 학부모 결제 UI가 아니다.
import { // 원장 라벨·금액·날짜.
    formatInvoiceAmount, // ko-KR 원.
    formatInvoiceDate, // KST 날짜.
    MANAGEMENT_INVOICE_STATUS_METADATA, // 학부모 라벨 맵이 아니다.
} from "@/features/billing/presentation"; // 표시만. 전이 없음.
import type { BillingInvoiceRow } from "@/features/billing/types"; // 목록 행.
import styles from "../BillingManagementScreen.module.css"; // 행 레이아웃.

/** DRAFT만 발행, DRAFT·ISSUED·OVERDUE만 취소 버튼을 그린다. 클릭은 부모 콜백. */
export default function InvoiceListPanel({ invoices, isPending, onIssue, onCancel }: { invoices: BillingInvoiceRow[]; isPending: boolean; onIssue: (invoiceId: string) => void; onCancel: (invoiceId: string) => void }) { // 액션 없음.
    return ( // 목록 카드.
        <article className={cx(surfaceStyles.root, styles.panel)}> // 원장 목록.
            <div className={panelStyles.head}><h2>청구 목록</h2><StatusChip>{invoices.length}건</StatusChip></div> // issue/cancel Server Action은 없고 부모 콜백만.
            {invoices.length === 0 ? <p className={typographyStyles.hint}>아직 청구서가 없습니다.</p> : <ul className={styles.list}>{invoices.map((invoice) => { const metadata = MANAGEMENT_INVOICE_STATUS_METADATA[invoice.status]; const canIssue = invoice.status === "DRAFT"; const canCancel = ["DRAFT", "ISSUED", "OVERDUE"].includes(invoice.status); return <li key={invoice.id} className={styles.row}> // DRAFT만 발행, DRAFT·ISSUED·OVERDUE만 취소. 클릭은 notifyUnavailable.
                <div className={styles.rowMain}><strong>{invoice.title}</strong><small>{invoice.studentName}{invoice.parentName ? ` · ${invoice.parentName}` : ""}</small><small>{formatInvoiceAmount(invoice.totalAmount)} · 납기 {formatInvoiceDate(invoice.dueDate)}</small></div> // 항목 배열은 안 보여 준다.
                <div className={styles.rowSide}><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip>{canIssue && <button type="button" className={buttonStyles.secondary} disabled={isPending} onClick={() => onIssue(invoice.id)}>발행</button>}{canCancel && <button type="button" className={styles.dangerBtn} disabled={isPending} onClick={() => onCancel(invoice.id)}>취소</button>}</div> // 클릭은 부모 notifyUnavailable.
            </li>; })}</ul>} // 목록 끝.
        </article> // 패널 끝.
    );
}
