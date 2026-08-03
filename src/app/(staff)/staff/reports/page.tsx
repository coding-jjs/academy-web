import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    enrollmentScopeWhere,
    getStaffScope,
    studentUserScopeWhere,
} from "@/lib/staff-scope";
import StaffReportsScreen from "@/app/(staff)/staff/reports/StaffReportsScreen";
import type { StaffReportStudent } from "@/app/(staff)/staff/reports/StaffReportsScreen";

export const dynamic = "force-dynamic";

export default async function StaffReportsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "TEACHER" && session.user.role !== "STAFF") {
        redirect("/post-login");
    }

    const scope = await getStaffScope(session.user.id);

    const users = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            status: "ACTIVE",
            ...studentUserScopeWhere(scope),
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
                        where: enrollmentScopeWhere(scope),
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

    const students: StaffReportStudent[] = users.map((user) => {
        const enrollment = user.studentProfile?.enrollments[0];
        const latestReport = user.studentProfile?.reports[0];
        const keywords = latestReport?.keywords;

        return {
            id: user.id,
            studentProfileId: user.studentProfile?.id ?? null,
            name: user.name,
            email: user.email,
            schoolName: user.schoolName,
            grade: user.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            report: latestReport
                ? {
                      id: latestReport.id,
                      status: latestReport.status,
                      content: latestReport.content,
                      keywords: Array.isArray(keywords)
                          ? keywords.filter(
                                (item): item is string =>
                                    typeof item === "string",
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

    return <StaffReportsScreen students={students} />;
}