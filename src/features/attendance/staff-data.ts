import "server-only";

import { prisma } from "@/lib/db";
import { formatKstTime } from "@/lib/date-kst";
import {
    classSessionScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type { StaffAttendanceSession } from "@/features/attendance/staff-types";

export async function getStaffAttendanceSessions({
    staffScope,
    startOfDay,
    endOfDay,
}: {
    staffScope: StaffScope;
    startOfDay: Date;
    endOfDay: Date;
}): Promise<StaffAttendanceSession[]> {
    const sessionRecords = await prisma.classSession.findMany({
        where: {
            startsAt: { gte: startOfDay, lt: endOfDay },
            status: { in: ["SCHEDULED", "COMPLETED"] },
            ...classSessionScopeWhere(staffScope),
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
                select: { studentId: true, reason: true },
            },
        },
    });

    return sessionRecords.map((classSession) => {
        const attendanceByStudent = new Map(
            classSession.attendance.map((attendance) => [
                attendance.studentId,
                attendance,
            ]),
        );
        const absenceByStudent = new Map(
            classSession.absenceRequests.map((absenceRequest) => [
                absenceRequest.studentId,
                absenceRequest,
            ]),
        );

        return {
            id: classSession.id,
            classId: classSession.class.id,
            className: classSession.class.name,
            subject: classSession.class.subject,
            teacherName: classSession.class.teacher?.name ?? null,
            classroom: classSession.classroom,
            startsAt: classSession.startsAt.toISOString(),
            endsAt: classSession.endsAt.toISOString(),
            timeLabel: `${formatKstTime(classSession.startsAt)}~${formatKstTime(classSession.endsAt)}`,
            students: classSession.class.enrollments.map(({ student }) => {
                const attendance = attendanceByStudent.get(student.id);
                const absenceRequest = absenceByStudent.get(student.id);

                return {
                    id: student.id,
                    name: student.name,
                    schoolName: student.schoolName,
                    grade: student.grade,
                    status: attendance?.status ?? null,
                    checkInAt: attendance?.checkInAt?.toISOString() ?? null,
                    checkOutAt: attendance?.checkOutAt?.toISOString() ?? null,
                    note: attendance?.note ?? null,
                    absenceRequest: absenceRequest
                        ? { reason: absenceRequest.reason }
                        : null,
                };
            }),
        };
    });
}
