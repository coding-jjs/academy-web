import StatusChip from "@/components/ui/StatusChip";
import {
    formatInvoiceAmount,
    formatInvoiceDate,
    MANAGEMENT_INVOICE_STATUS_METADATA,
} from "@/features/billing/presentation";
import type { BillingInvoiceRow } from "@/features/billing/types";
import styles from "../BillingManagementScreen.module.css";

export default function InvoiceListPanel({ invoices, isPending, onIssue, onCancel }: { invoices: BillingInvoiceRow[]; isPending: boolean; onIssue: (invoiceId: string) => void; onCancel: (invoiceId: string) => void }) {
    return (
        <article className={styles.panel}>
            <div className={styles.panelHead}><h2>청구 목록</h2><StatusChip>{invoices.length}건</StatusChip></div>
            {invoices.length === 0 ? <p className={styles.hint}>아직 청구서가 없습니다.</p> : <ul className={styles.list}>{invoices.map((invoice) => { const metadata = MANAGEMENT_INVOICE_STATUS_METADATA[invoice.status]; const canIssue = invoice.status === "DRAFT"; const canCancel = ["DRAFT", "ISSUED", "OVERDUE"].includes(invoice.status); return <li key={invoice.id} className={styles.row}>
                <div className={styles.rowMain}><strong>{invoice.title}</strong><small>{invoice.studentName}{invoice.parentName ? ` · ${invoice.parentName}` : ""}</small><small>{formatInvoiceAmount(invoice.totalAmount)} · 납기 {formatInvoiceDate(invoice.dueDate)}</small></div>
                <div className={styles.rowSide}><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip>{canIssue && <button type="button" className={styles.secondaryBtn} disabled={isPending} onClick={() => onIssue(invoice.id)}>발행</button>}{canCancel && <button type="button" className={styles.dangerBtn} disabled={isPending} onClick={() => onCancel(invoice.id)}>취소</button>}</div>
            </li>; })}</ul>}
        </article>
    );
}
