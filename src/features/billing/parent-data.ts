import "server-only";

/**
 * 학부모 본인 Invoice를 결제 대기와 이력으로 나눠 조회한다.
 *
 * 호출: `(parent)/parent/payments/page.tsx`.
 * DRAFT는 빼고 발행된 건만 보여, 가정 결제 화면이 청구서와 최근 결제 상태를 쓰게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 토스 결제 승인 웹훅 처리. 이 파일은 조회만.
 * - 원장 초안 목록 → `data.ts`.
 *
 * 관련: `parent-types.ts`, `presentation.ts`의 학부모 라벨.
 */

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    InvoiceStatus,
    ParentInvoice,
    ParentPaymentsData,
} from "@/features/billing/parent-types";

const parentInvoiceSelection = {
    id: true,
    title: true,
    items: true,
    totalAmount: true,
    status: true,
    dueDate: true,
    issuedAt: true,
    paidAt: true,
    student: { select: { id: true, name: true } },
    payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
            id: true,
            orderId: true,
            status: true,
            method: true,
            approvedAt: true,
            failureMessage: true,
        },
    },
} satisfies Prisma.InvoiceSelect;

type ParentInvoiceRecord = Prisma.InvoiceGetPayload<{
    select: typeof parentInvoiceSelection;
}>;

/**
 * parentUserId 청구서를 payable(ISSUED·OVERDUE) / history(PAID·CANCELLED)로 나눈다.
 * DRAFT는 where에서 제외해 작성 중인 원장 초안이 가정에 안 보이게 한다.
 */
export async function getParentPaymentsData(
    parentUserId: string,
): Promise<ParentPaymentsData> {
    const invoices = await prisma.invoice.findMany({
        where: {
            parentUserId,
            status: { in: ["ISSUED", "OVERDUE", "PAID", "CANCELLED"] },
        },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        select: parentInvoiceSelection,
    });
    const list = invoices.map(mapParentInvoice);
    return {
        payable: list.filter(
            (invoice) =>
                invoice.status === "ISSUED" || invoice.status === "OVERDUE",
        ),
        history: list.filter(
            (invoice) =>
                invoice.status === "PAID" || invoice.status === "CANCELLED",
        ),
    };
}

/** Prisma 행 + 최근 결제 1건을 ParentInvoice로. items JSON은 이름·금액만 살린다. */
function mapParentInvoice(invoice: ParentInvoiceRecord): ParentInvoice {
    const latestPayment = invoice.payments[0];
    return {
        id: invoice.id,
        title: invoice.title,
        items: parseInvoiceItems(invoice.items),
        totalAmount: invoice.totalAmount,
        status: invoice.status as InvoiceStatus,
        dueDate: invoice.dueDate.toISOString(),
        issuedAt: invoice.issuedAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        studentId: invoice.student.id,
        studentName: invoice.student.name,
        latestPayment: latestPayment
            ? {
                  id: latestPayment.id,
                  orderId: latestPayment.orderId,
                  status: latestPayment.status,
                  method: latestPayment.method,
                  approvedAt: latestPayment.approvedAt?.toISOString() ?? null,
                  failureMessage: latestPayment.failureMessage,
              }
            : null,
    };
}

/** Invoice.items Json이 배열이 아니거나 name이 없으면 버린다. amount 비숫자는 0. */
function parseInvoiceItems(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as { name?: unknown; amount?: unknown };
            if (typeof row.name !== "string") return null;
            return {
                name: row.name,
                amount: typeof row.amount === "number" ? row.amount : 0,
            };
        })
        .filter(
            (item): item is { name: string; amount: number } => Boolean(item),
        );
}
