import "server-only";

/**
 * 원장 청구·수납 화면에 쓸 학생 옵션과 Invoice 목록을 조회한다.
 *
 * 호출: 청구 관리 화면이 학생 선택지·목록을 그릴 때.
 * 생성 액션(`createInvoice`)은 아직 없다. 목록과 학부모 연결 정보만 넘긴다.
 *
 * 의도적으로 하지 않는 일:
 * - 발행·취소·수납 처리. `BillingManagementScreen` 버튼은 준비 중 안내만.
 * - 학부모 결제 대기 분할 → `parent-data.ts`.
 *
 * 관련: `types.ts`, `InvoiceCreationPanel` (UI only).
 */

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    BillingInvoiceRow,
    BillingStudentOption,
} from "@/features/billing/types";

/**
 * 스코프 where를 받아 학생(학부모 링크 1건)과 최근 Invoice 100건을 병렬 조회한다.
 */
export async function getBillingManagementData(
    {
        studentWhere,
        invoiceWhere,
    }: {
        studentWhere: Prisma.StudentWhereInput;
        invoiceWhere?: Prisma.InvoiceWhereInput;
    },
): Promise<{
    students: BillingStudentOption[];
    invoices: BillingInvoiceRow[];
}> {
    const [studentRecords, invoiceRecords] = await Promise.all([
        prisma.student.findMany({
            where: studentWhere,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                parentLinks: {
                    where: { endedAt: null },
                    orderBy: { linkedAt: "desc" },
                    take: 1,
                    select: {
                        parentUserId: true,
                        parent: { select: { name: true } },
                    },
                },
                enrollments: {
                    where: { endedAt: null, status: "ACTIVE" },
                    take: 1,
                    select: { class: { select: { name: true } } },
                },
            },
        }),
        prisma.invoice.findMany({
            where: invoiceWhere,
            orderBy: { createdAt: "desc" },
            take: 100,
            select: {
                id: true,
                title: true,
                totalAmount: true,
                status: true,
                dueDate: true,
                issuedAt: true,
                paidAt: true,
                student: { select: { name: true } },
                parent: { select: { name: true } },
            },
        }),
    ]);

    const students = studentRecords.map((student) => {
        const activeParentLink = student.parentLinks[0];
        const activeEnrollment = student.enrollments[0];

        return {
            id: student.id,
            name: student.name,
            parentUserId: activeParentLink?.parentUserId ?? null,
            parentName: activeParentLink?.parent.name ?? null,
            className: activeEnrollment?.class.name ?? null,
        };
    });

    const invoices = invoiceRecords.map((invoice) => ({
        id: invoice.id,
        title: invoice.title,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        dueDate: invoice.dueDate.toISOString(),
        issuedAt: invoice.issuedAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        studentName: invoice.student.name,
        parentName: invoice.parent.name,
    }));

    return { students, invoices };
}
