import "server-only";

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    BillingInvoiceRow,
    BillingStudentOption,
} from "@/features/billing/types";

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
