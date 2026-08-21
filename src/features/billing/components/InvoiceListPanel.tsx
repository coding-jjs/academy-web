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

import StatusChip from "@/components/ui/StatusChip";
import {
    buttonStyles,
    cx,
    panelStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import {
    formatInvoiceAmount,
    formatInvoiceDate,
    MANAGEMENT_INVOICE_STATUS_METADATA,
} from "@/features/billing/presentation";
import type { BillingInvoiceRow } from "@/features/billing/types";
import styles from "../BillingManagementScreen.module.css";

/** DRAFT만 발행, DRAFT·ISSUED·OVERDUE만 취소 버튼을 그린다. 클릭은 부모 콜백. */
export default function InvoiceListPanel({ invoices, isPending, onIssue, onCancel }: { invoices: BillingInvoiceRow[]; isPending: boolean; onIssue: (invoiceId: string) => void; onCancel: (invoiceId: string) => void }) {
    return (
        <article className={cx(surfaceStyles.root, styles.panel)}>
            <div className={panelStyles.head}><h2>청구 목록</h2><StatusChip>{invoices.length}건</StatusChip></div>
            {invoices.length === 0 ? <p className={typographyStyles.hint}>아직 청구서가 없습니다.</p> : <ul className={styles.list}>{invoices.map((invoice) => { const metadata = MANAGEMENT_INVOICE_STATUS_METADATA[invoice.status]; const canIssue = invoice.status === "DRAFT"; const canCancel = ["DRAFT", "ISSUED", "OVERDUE"].includes(invoice.status); return <li key={invoice.id} className={styles.row}>
                <div className={styles.rowMain}><strong>{invoice.title}</strong><small>{invoice.studentName}{invoice.parentName ? ` · ${invoice.parentName}` : ""}</small><small>{formatInvoiceAmount(invoice.totalAmount)} · 납기 {formatInvoiceDate(invoice.dueDate)}</small></div>
                <div className={styles.rowSide}><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip>{canIssue && <button type="button" className={buttonStyles.secondary} disabled={isPending} onClick={() => onIssue(invoice.id)}>발행</button>}{canCancel && <button type="button" className={styles.dangerBtn} disabled={isPending} onClick={() => onCancel(invoice.id)}>취소</button>}</div>
            </li>; })}</ul>}
        </article>
    );
}
