import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

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

    const children: ParentAttendanceChild[] = await Promise.all(
        links.map(async ({ student }) => {
            const classIds = student.enrollments.map((e) => e.class.id);
            const enrollment = student.enrollments[0];

            const [sessions, monthAttendance] = await Promise.all([
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
                                  where: { studentId: student.id },
                                  take: 1,
                                  select: {
                                      status: true,
                                      checkInAt: true,
                                      checkOutAt: true,
                                  },
                              },
                              absenceRequests: {
                                  where: {
                                      studentId: student.id,
                                      cancelledAt: null,
                                  },
                                  take: 1,
                                  select: {
                                      id: true,
                                      reason: true,
                                      requestedAt: true,
                                  },
                              },
                          },
                      }),
                prisma.attendanceRecord.findMany({
                    where: {
                        studentId: student.id,
                        session: {
                            startsAt: { gte: startOfMonth, lt: endOfToday },
                        },
                    },
                    select: { status: true },
                }),
            ]);

            const counts = { present: 0, late: 0, absent: 0, earlyLeave: 0 };
            for (const row of monthAttendance) {
                if (row.status === "PRESENT") counts.present += 1;
                else if (row.status === "LATE") counts.late += 1;
                else if (row.status === "EARLY_LEAVE") counts.earlyLeave += 1;
                else counts.absent += 1;
            }

            const today = sessions.find(
                (s) => s.startsAt >= startOfToday && s.startsAt < endOfToday,
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
                          status: (today.attendance[0]?.status as
                              | AttendanceStatus
                              | null) ?? null,
                      }
                    : null,
                sessions: sessions.map((s) => ({
                    id: s.id,
                    className: s.class.name,
                    subject: s.class.subject,
                    teacherName: s.class.teacher?.name ?? null,
                    classroom: s.classroom,
                    startsAt: s.startsAt.toISOString(),
                    endsAt: s.endsAt.toISOString(),
                    timeLabel: `${formatTime(s.startsAt)}~${formatTime(s.endsAt)}`,
                    isToday:
                        s.startsAt >= startOfToday && s.startsAt < endOfToday,
                    attendanceStatus: (s.attendance[0]?.status as
                        | AttendanceStatus
                        | null) ?? null,
                    checkInAt: s.attendance[0]?.checkInAt?.toISOString() ?? null,
                    checkOutAt:
                        s.attendance[0]?.checkOutAt?.toISOString() ?? null,
                    absenceRequest: s.absenceRequests[0]
                        ? {
                              id: s.absenceRequests[0].id,
                              reason: s.absenceRequests[0].reason,
                              requestedAt:
                                  s.absenceRequests[0].requestedAt.toISOString(),
                          }
                        : null,
                })),
            };
        }),
    );

    return <ParentAttendanceScreen childList={children} />;
}