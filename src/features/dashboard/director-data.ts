import "server-only";

import { OPEN_CHURN_STATUSES } from "@/features/churn/types";
import { prisma } from "@/lib/db";
import type { DirectorDashboardMetrics } from "@/features/dashboard/types";

export async function getDirectorDashboardMetrics({
    startOfDay,
    endOfDay,
}: {
    startOfDay: Date;
    endOfDay: Date;
}): Promise<DirectorDashboardMetrics> {
    const [
        pendingReports,
        openChurn,
        overdueInvoices,
        newInquiries,
        enrolledStudents,
        guestUsers,
        presentAttendance,
        totalAttendance,
        todaySessionCount,
    ] = await Promise.all([
        prisma.aiReport.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.churnCase.count({
            where: { status: { in: [...OPEN_CHURN_STATUSES] } },
        }),
        prisma.invoice.count({ where: { status: "OVERDUE" } }),
        prisma.inquiry.count({ where: { status: "NEW" } }),
        prisma.student.count({ where: { status: "ENROLLED" } }),
        prisma.user.count({
            where: {
                role: "GUEST",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
        }),
        prisma.attendanceRecord.count({
            where: {
                status: { in: ["PRESENT", "LATE"] },
                session: { startsAt: { gte: startOfDay, lt: endOfDay } },
            },
        }),
        prisma.attendanceRecord.count({
            where: {
                session: { startsAt: { gte: startOfDay, lt: endOfDay } },
            },
        }),
        prisma.classSession.count({
            where: { startsAt: { gte: startOfDay, lt: endOfDay } },
        }),
    ]);

    return {
        pendingReports,
        openChurn,
        overdueInvoices,
        newInquiries,
        enrolledStudents,
        guestUsers,
        todayAttendanceRate:
            totalAttendance > 0
                ? Math.round((presentAttendance / totalAttendance) * 100)
                : null,
        todaySessionCount,
    };
}
