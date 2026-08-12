export type InvoiceStatus =
    | "DRAFT"
    | "ISSUED"
    | "PAID"
    | "OVERDUE"
    | "CANCELLED";

export type BillingStudentOption = {
    id: string;
    name: string;
    parentName: string | null;
    parentUserId: string | null;
    className: string | null;
};

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
