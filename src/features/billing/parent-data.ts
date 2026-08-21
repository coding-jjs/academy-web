import "server-only"; // 조회만. 토스 웹훅 없음.

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

import type { Prisma } from "@/generate/prisma/client"; // select 타입.
import { prisma } from "@/lib/db"; // server-only Prisma.
import type { // 학부모 DTO.
    InvoiceStatus, // 코드 재export.
    ParentInvoice, // 한 건.
    ParentPaymentsData, // payable/history.
} from "@/features/billing/parent-types"; // DRAFT 제외.

const parentInvoiceSelection = { // 목록+최근 결제 1건.
    id: true, // Invoice PK.
    title: true, // 제목.
    items: true, // Json. name·amount만 살린다.
    totalAmount: true, // 합계.
    status: true, // ISSUED·OVERDUE·PAID·CANCELLED.
    dueDate: true, // 납기.
    issuedAt: true, // 발행 시각.
    paidAt: true, // 완납 시각.
    student: { select: { id: true, name: true } }, // 자녀.
    payments: { // 최근 1건.
        orderBy: { createdAt: "desc" }, // 최신 결제.
        take: 1, // 최근 결제 1건. 실패 메시지를 화면에 붙인다.
        select: { // 토스 필드.
            id: true, // Payment PK.
            orderId: true, // 주문 id.
            status: true, // 결제 상태.
            method: true, // 수단.
            approvedAt: true, // 승인 시각.
            failureMessage: true, // 실패 안내.
        },
    },
} satisfies Prisma.InvoiceSelect; // 타입 맞춤.

type ParentInvoiceRecord = Prisma.InvoiceGetPayload<{ // map 입력.
    select: typeof parentInvoiceSelection; // 위 select.
}>; // ParentInvoiceRecord 끝.

/**
 * parentUserId 청구서를 payable(ISSUED·OVERDUE) / history(PAID·CANCELLED)로 나눈다.
 * DRAFT는 where에서 제외해 작성 중인 원장 초안이 가정에 안 보이게 한다.
 */
export async function getParentPaymentsData( // 웹훅이 아니다.
    parentUserId: string, // 본인만.
): Promise<ParentPaymentsData> { // payable/history.
    const invoices = await prisma.invoice.findMany({ // DRAFT 제외.
        where: { // 본인·발행된 상태만.
            parentUserId, // 본인 청구만. 원장 초안 목록이 아니다.
            status: { in: ["ISSUED", "OVERDUE", "PAID", "CANCELLED"] }, // DRAFT 제외. 원장 초안이 가정에 안 보이게.
        },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }], // 납기·생성.
        select: parentInvoiceSelection, // 항목+최근 결제.
    });
    const list = invoices.map(mapParentInvoice); // DTO.
    return { // 화면이 탭처럼 나눔.
        payable: list.filter( // 결제 대기. 토스 웹훅은 이 파일이 아니다.
            (invoice) => // ISSUED·OVERDUE.
                invoice.status === "ISSUED" || invoice.status === "OVERDUE", // 결제 대기.
        ),
        history: list.filter( // 이력.
            (invoice) => // PAID·CANCELLED.
                invoice.status === "PAID" || invoice.status === "CANCELLED", // 완료·취소.
        ),
    };
}

/** Prisma 행 + 최근 결제 1건을 ParentInvoice로. items JSON은 이름·금액만 살린다. */
function mapParentInvoice(invoice: ParentInvoiceRecord): ParentInvoice { // 웹훅 처리 아님.
    const latestPayment = invoice.payments[0]; // 실패 메시지를 화면에 붙인다.
    return { // ParentInvoice.
        id: invoice.id, // Invoice PK.
        title: invoice.title, // 제목.
        items: parseInvoiceItems(invoice.items), // name·amount만.
        totalAmount: invoice.totalAmount, // 합계.
        status: invoice.status as InvoiceStatus, // DRAFT는 where에서 이미 제외.
        dueDate: invoice.dueDate.toISOString(), // ISO.
        issuedAt: invoice.issuedAt?.toISOString() ?? null, // 발행 시각.
        paidAt: invoice.paidAt?.toISOString() ?? null, // 완납 시각.
        studentId: invoice.student.id, // 자녀 PK.
        studentName: invoice.student.name, // 자녀 이름.
        latestPayment: latestPayment // 없으면 null.
            ? { // 최근 결제.
                  id: latestPayment.id, // Payment PK.
                  orderId: latestPayment.orderId, // 주문 id.
                  status: latestPayment.status, // 상태.
                  method: latestPayment.method, // 수단.
                  approvedAt: latestPayment.approvedAt?.toISOString() ?? null, // 승인 시각.
                  failureMessage: latestPayment.failureMessage, // 토스 실패 안내. 웹훅 처리는 이 타입이 아니다.
              }
            : null, // 미결제.
    };
}

/** Invoice.items Json이 배열이 아니거나 name이 없으면 버린다. amount 비숫자는 0. */
function parseInvoiceItems(value: unknown) { // 화면용. 스키마 마이그레이션 아님.
    if (!Array.isArray(value)) return []; // 배열이 아니면 버린다.
    return value // 항목.
        .map((item) => { // name·amount만.
            if (!item || typeof item !== "object") return null; // 객체 아니면 버림.
            const row = item as { name?: unknown; amount?: unknown }; // Json.
            if (typeof row.name !== "string") return null; // name이 없으면 버린다.
            return { // 화면 항목.
                name: row.name, // 항목명.
                amount: typeof row.amount === "number" ? row.amount : 0, // 비숫자는 0.
            };
        })
        .filter( // null 제거.
            (item): item is { name: string; amount: number } => Boolean(item), // 타입 가드.
        );
}
