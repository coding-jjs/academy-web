import "server-only";

import { prisma } from "@/lib/db";
import type { DirectorReportStudent } from "@/features/reports/types";

export async function getDirectorReportStudents(): Promise<
    DirectorReportStudent[]
> {
    const studentUsers = await prisma.user.findMany({
        where: { role: "STUDENT", status: "ACTIVE" },
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
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            content: true,
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
                      teacherName: latestReport.author.name,
                      periodStart: latestReport.periodStart.toISOString(),
                      periodEnd: latestReport.periodEnd.toISOString(),
                  }
                : null,
        };
    });
}
