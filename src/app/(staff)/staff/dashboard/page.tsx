import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatKstTime, getKstDayRange } from "@/lib/date-kst";
import {
    classSessionScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import StaffDashboardScreen from "./StaffDashboardScreen";
import type { StaffDashboardSession } from "./StaffDashboardScreen";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "TEACHER" && session.user.role !== "STAFF") {
        redirect("/post-login");
    }

    const scope = await getStaffScope(session.user.id);
    const isStaff = session.user.role === "STAFF";
    const { startOfToday, endOfToday } = getKstDayRange();

    const [todaySessions, pendingReports, myStudentCount, openInquiries] =
        await Promise.all([
            prisma.classSession.findMany({
                where: {
                    startsAt: { gte: startOfToday, lt: endOfToday },
                    status: { in: ["SCHEDULED", "COMPLETED"] },
                    ...classSessionScopeWhere(scope),
                },
                orderBy: { startsAt: "asc" },
                select: {
                    id: true,
                    startsAt: true,
                    endsAt: true,
                    classroom: true,
                    class: {
                        select: {
                            id: true,
                            name: true,
                            subject: true,
                            enrollments: {
                                where: { status: "ACTIVE", endedAt: null },
                                select: { studentId: true },
                            },
                        },
                    },
                    attendance: {
                        select: { studentId: true, status: true },
                    },
                },
            }),
            prisma.aiReport.count({
                where: {
                    status: {
                        in: ["DRAFTING", "PENDING_APPROVAL", "REJECTED"],
                    },
                    ...(scope.viewAllStudents
                        ? {}
                        : { authorUserId: session.user.id }),
                },
            }),
            prisma.student.count({
                where: {
                    status: "ENROLLED",
                    ...studentScopeWhere(scope),
                },
            }),
            isStaff
                ? prisma.inquiry.count({
                      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
                  })
                : Promise.resolve(0),
        ]);

    const sessions: StaffDashboardSession[] = todaySessions.map((s) => {
        const enrolledIds = s.class.enrollments.map((e) => e.studentId);
        const checkedIds = new Set(s.attendance.map((a) => a.studentId));
        const unchecked = enrolledIds.filter(
            (id) => !checkedIds.has(id),
        ).length;

        return {
            id: s.id,
            classId: s.class.id,
            className: s.class.name,
            subject: s.class.subject,
            classroom: s.classroom,
            timeLabel: `${formatKstTime(s.startsAt)}~${formatKstTime(s.endsAt)}`,
            startsAt: s.startsAt.toISOString(),
            studentCount: enrolledIds.length,
            uncheckedCount: unchecked,
        };
    });

    const uncheckedSessions = sessions.filter(
        (s) => s.uncheckedCount > 0,
    ).length;
    const firstClassTime = sessions[0]?.timeLabel.split("~")[0] ?? null;

    return (
        <StaffDashboardScreen
            role={session.user.role as "TEACHER" | "STAFF"}
            staffName={session.user.name ?? "교직원"}
            metrics={{
                todayClassCount: sessions.length,
                firstClassTime,
                uncheckedSessions,
                pendingReports,
                myStudentCount,
                openInquiries,
            }}
            sessions={sessions}
        />
    );
}