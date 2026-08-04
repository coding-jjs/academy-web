import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import ParentAttendanceScreen from "@/app/(parent)/parent/attendance/ParentAttendanceScreen";
import type {
    AttendanceStatus,
    ParentAttendanceChild,
} from "@/app/(parent)/parent/attendance/ParentAttendanceScreen";

export const dynamic = "force-dynamic";

function getKstRanges(now = new Date()) {
    const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    const startOfToday = new Date(`${day}T00:00:00+09:00`);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfMonth = new Date(`${day.slice(0, 8)}01T00:00:00+09:00`);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return { startOfToday, endOfToday, startOfMonth, endOfWeek };
}

function formatTime(date: Date) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

export default async function ParentAttendancePage() {
    const session = await requireRole("PARENT");

    const { startOfToday, endOfToday, startOfMonth, endOfWeek } =
        getKstRanges();

    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId: session.user.id, endedAt: null },
        orderBy: { linkedAt: "asc" },
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
                                    id: true,
                                    name: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const studentIds = links.map(({ student }) => student.id);
    const classIds = [
        ...new Set(
            links.flatMap(({ student }) =>
                student.enrollments.map((enrollment) => enrollment.class.id),
            ),
        ),
    ];

    const [allSessions, allMonthAttendance] = await Promise.all([
        classIds.length === 0
            ? Promise.resolve([])
            : prisma.classSession.findMany({
                  where: {
                      classId: { in: classIds },
                      startsAt: { gte: startOfToday, lt: endOfWeek },
                      status: { in: ["SCHEDULED", "COMPLETED"] },
                  },
                  orderBy: { startsAt: "asc" },
                  select: {
                      id: true,
                      classId: true,
                      startsAt: true,
                      endsAt: true,
                      classroom: true,
                      class: {
                          select: {
                              name: true,
                              subject: true,
                              teacher: { select: { name: true } },
                          },
                      },
                      attendance: {
                          where: { studentId: { in: studentIds } },
                          select: {
                              studentId: true,
                              status: true,
                              checkInAt: true,
                              checkOutAt: true,
                          },
                      },
                      absenceRequests: {
                          where: {
                              studentId: { in: studentIds },
                              cancelledAt: null,
                          },
                          select: {
                              id: true,
                              studentId: true,
                              reason: true,
                              requestedAt: true,
                          },
                      },
                  },
              }),
        prisma.attendanceRecord.findMany({
            where: {
                studentId: { in: studentIds },
                session: {
                    startsAt: { gte: startOfMonth, lt: endOfToday },
                },
            },
            select: { studentId: true, status: true },
        }),
    ]);
    const monthAttendanceByStudent = Map.groupBy(
        allMonthAttendance,
        (row) => row.studentId,
    );

    const children: ParentAttendanceChild[] = links.map(({ student }) => {
        const enrolledClassIds = new Set(
            student.enrollments.map((enrollment) => enrollment.class.id),
        );
        const sessions = allSessions.filter((classSession) =>
            enrolledClassIds.has(classSession.classId),
        );
        const enrollment = student.enrollments[0];
        const monthAttendance =
            monthAttendanceByStudent.get(student.id) ?? [];

        const counts = { present: 0, late: 0, absent: 0, earlyLeave: 0 };
        for (const row of monthAttendance) {
            if (row.status === "PRESENT") counts.present += 1;
            else if (row.status === "LATE") counts.late += 1;
            else if (row.status === "EARLY_LEAVE") counts.earlyLeave += 1;
            else counts.absent += 1;
        }

        const today = sessions.find(
            (classSession) =>
                classSession.startsAt >= startOfToday &&
                classSession.startsAt < endOfToday,
        );
        const todayAttendance = today?.attendance.find(
            (row) => row.studentId === student.id,
        );

        return {
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            monthCounts: counts,
            todayHighlight: today
                ? {
                      className: today.class.name,
                      timeLabel: `${formatTime(today.startsAt)}~${formatTime(today.endsAt)}`,
                      classroom: today.classroom,
                      status:
                          (todayAttendance?.status as AttendanceStatus | null) ??
                          null,
                  }
                : null,
            sessions: sessions.map((classSession) => {
                const attendance = classSession.attendance.find(
                    (row) => row.studentId === student.id,
                );
                const absenceRequest = classSession.absenceRequests.find(
                    (row) => row.studentId === student.id,
                );

                return {
                    id: classSession.id,
                    className: classSession.class.name,
                    subject: classSession.class.subject,
                    teacherName: classSession.class.teacher?.name ?? null,
                    classroom: classSession.classroom,
                    startsAt: classSession.startsAt.toISOString(),
                    endsAt: classSession.endsAt.toISOString(),
                    timeLabel: `${formatTime(classSession.startsAt)}~${formatTime(classSession.endsAt)}`,
                    isToday:
                        classSession.startsAt >= startOfToday &&
                        classSession.startsAt < endOfToday,
                    attendanceStatus:
                        (attendance?.status as AttendanceStatus | null) ?? null,
                    checkInAt: attendance?.checkInAt?.toISOString() ?? null,
                    checkOutAt: attendance?.checkOutAt?.toISOString() ?? null,
                    absenceRequest: absenceRequest
                        ? {
                              id: absenceRequest.id,
                              reason: absenceRequest.reason,
                              requestedAt:
                                  absenceRequest.requestedAt.toISOString(),
                          }
                        : null,
                };
            }),
        };
    });

    return <ParentAttendanceScreen childList={children} />;
}
