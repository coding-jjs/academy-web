import "server-only";

import { prisma } from "@/lib/db";
import type { ParentReportChild } from "@/features/reports/parent-types";

export async function getParentReportChildren(
    parentUserId: string,
): Promise<ParentReportChild[]> {
    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId, endedAt: null },
        select: {
            student: {
                select: {
                    id: true,
                    name: true,
                    schoolName: true,
                    grade: true,
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        select: {
                            class: {
                                select: {
                                    name: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                        take: 1,
                    },
                    reports: {
                        where: { status: "SENT" },
                        orderBy: { periodEnd: "desc" },
                        select: {
                            id: true,
                            content: true,
                            keywords: true,
                            periodStart: true,
                            periodEnd: true,
                            sentAt: true,
                            parentReadAt: true,
                            author: { select: { name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { linkedAt: "asc" },
    });

    return links.map(({ student }) => {
        const enrollment = student.enrollments[0];

        return {
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            reports: student.reports.map((report) => ({
                id: report.id,
                content: report.content,
                keywords: getStringKeywords(report.keywords),
                teacherName: report.author.name,
                periodStart: report.periodStart.toISOString(),
                periodEnd: report.periodEnd.toISOString(),
                sentAt: report.sentAt?.toISOString() ?? null,
                parentReadAt: report.parentReadAt?.toISOString() ?? null,
            })),
        };
    });
}

function getStringKeywords(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}
