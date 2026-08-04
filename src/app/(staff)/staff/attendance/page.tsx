import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatKstTime, getKstDayRange } from "@/lib/date-kst";
import {
    classSessionScopeWhere,
    getStaffScope,
} from "@/lib/staff-scope";
import StaffAttendanceScreen from "./StaffAttendanceScreen";
import type {
    AttendanceStatus,
    StaffAttendanceSession,
} from "./StaffAttendanceScreen";

export const dynamic = "force-dynamic";

export default async function StaffAttendancePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "TEACHER" && session.user.role !== "STAFF") {
        redirect("/post-login");
    }

    const scope = await getStaffScope(session.user.id);
    const { startOfToday, endOfToday } = getKstDayRange();

    const sessions = await prisma.classSession.findMany({
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
            status: true,
            class: {
                select: {
                    id: true,
                    name: true,
                    subject: true,
                    teacher: { select: { name: true } },
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        select: {
                            student: {
                                select: {
                                    id: true,
                                    name: true,
                                    schoolName: true,
                                    grade: true,
                                },
                            },
                        },
                        orderBy: { student: { name: "asc" } },
                    },
                },
            },
            attendance: {
                select: {
                    studentId: true,
                    status: true,
                    checkInAt: true,
                    checkOutAt: true,
                    note: true,
                },
            },
            absenceRequests: {
                where: { cancelledAt: null },
                select: {
                    id: true,
                    studentId: true,
                    reason: true,
                    requestedAt: true,
                },
            },
        },
    });

    const list: StaffAttendanceSession[] = sessions.map((s) => {
        const attendanceByStudent = new Map(
            s.attendance.map((row) => [row.studentId, row]),
        );
        const absenceByStudent = new Map(
            s.absenceRequests.map((row) => [row.studentId, row]),
        );

        return {
            id: s.id,
            classId: s.class.id,
            className: s.class.name,
            subject: s.class.subject,
            teacherName: s.class.teacher?.name ?? null,
            classroom: s.classroom,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
            timeLabel: `${formatKstTime(s.startsAt)}~${formatKstTime(s.endsAt)}`,
            students: s.class.enrollments.map(({ student }) => {
                const att = attendanceByStudent.get(student.id);
                const absence = absenceByStudent.get(student.id);
                return {
                    id: student.id,
                    name: student.name,
                    schoolName: student.schoolName,
                    grade: student.grade,
                    status: (att?.status as AttendanceStatus | null) ?? null,
                    checkInAt: att?.checkInAt?.toISOString() ?? null,
                    checkOutAt: att?.checkOutAt?.toISOString() ?? null,
                    note: att?.note ?? null,
                    absenceRequest: absence
                        ? {
                              id: absence.id,
                              reason: absence.reason,
                              requestedAt: absence.requestedAt.toISOString(),
                          }
                        : null,
                };
            }),
        };
    });

    return (
        <StaffAttendanceScreen
            sessions={list}
            role={session.user.role as "TEACHER" | "STAFF"}
        />
    );
}