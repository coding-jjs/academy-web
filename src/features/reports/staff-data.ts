import "server-only";

import { prisma } from "@/lib/db";
import {
    enrollmentScopeWhere,
    studentUserScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type { StaffReportStudent } from "@/features/reports/types";

export async function getStaffReportsData(
    staffScope: StaffScope,
): Promise<StaffReportStudent[]> {
    const studentUsers = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            status: "ACTIVE",
            ...studentUserScopeWhere(staffScope),
        },
        select: {
            id: true,
            name: true,
            email: true,
            schoolName: true,
            grade: true,
            studentProfile: {
                select: {
                    id: true,
                    enrollments: {
                        where: enrollmentScopeWhere(staffScope),
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
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            content: true,
                            keywords: true,
                            rejectionReason: true,
                            periodStart: true,
                            periodEnd: true,
                            author: { select: { name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });

    return studentUsers.map((studentUser) => {
        const enrollment = studentUser.studentProfile?.enrollments[0];
        const latestReport = studentUser.studentProfile?.reports[0];
        const keywords = latestReport?.keywords;

        return {
            id: studentUser.id,
            studentProfileId: studentUser.studentProfile?.id ?? null,
            name: studentUser.name,
            email: studentUser.email,
            schoolName: studentUser.schoolName,
            grade: studentUser.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            report: latestReport
                ? {
                      id: latestReport.id,
                      status: latestReport.status,
                      content: latestReport.content,
                      keywords: Array.isArray(keywords)
                          ? keywords.filter(
                                (keyword): keyword is string =>
                                    typeof keyword === "string",
                            )
                          : [],
                      rejectionReason: latestReport.rejectionReason,
                      teacherName: latestReport.author.name,
                      periodStart: latestReport.periodStart.toISOString(),
                      periodEnd: latestReport.periodEnd.toISOString(),
                  }
                : null,
        };
    });
}
