import { prisma } from "@/lib/db";
import { getKstDayRange } from "@/lib/date-kst";
import DirectorDashboardScreen from "./DirectorDashboardScreen";

export const dynamic = "force-dynamic";

export default async function DirectorDashboardPage() {
    const { startOfToday, endOfToday } = getKstDayRange();

    const [
        pendingReports,
        openChurn,
        overdueInvoices,
        newInquiries,
        enrolledStudents,
        guestUsers,
        todayAttendancePresent,
        todayAttendanceTotal,
        todaySessionCount,
    ] = await Promise.all([
        prisma.aiReport.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.churnCase.count({
            where: { status: { in: ["DETECTED", "COUNSELING"] } },
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
                session: {
                    startsAt: { gte: startOfToday, lt: endOfToday },
                },
            },
        }),
        prisma.attendanceRecord.count({
            where: {
                session: {
                    startsAt: { gte: startOfToday, lt: endOfToday },
                },
            },
        }),
        prisma.classSession.count({
            where: { startsAt: { gte: startOfToday, lt: endOfToday } },
        }),
    ]);

    const todayAttendanceRate =
        todayAttendanceTotal > 0
            ? Math.round((todayAttendancePresent / todayAttendanceTotal) * 100)
            : null;

    return (
        <DirectorDashboardScreen
            metrics={{
                pendingReports,
                openChurn,
                overdueInvoices,
                newInquiries,
                enrolledStudents,
                guestUsers,
                todayAttendanceRate,
                todaySessionCount,
            }}
        />
    );
}