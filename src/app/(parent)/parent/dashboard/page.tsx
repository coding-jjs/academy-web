import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { formatKstTime, getKstDayRange } from "@/lib/date-kst";
import ParentDashboardScreen from "@/app/(parent)/parent/dashboard/ParentDashboardScreen";
import type {
    AttendanceStatus,
    ParentDashboardChild,
} from "@/app/(parent)/parent/dashboard/ParentDashboardScreen";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
    const session = await requireRole("PARENT");

    const { startOfToday, endOfToday } = getKstDayRange();

    const [links, unreadMessages, newsItems] = await Promise.all([
        prisma.parentStudentLink.findMany({
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
                        reports: {
                            where: { status: "SENT" },
                            orderBy: { sentAt: "desc" },
                            take: 3,
                            select: {
                                id: true,
                                content: true,
                                sentAt: true,
                                parentReadAt: true,
                                author: { select: { name: true } },
                                periodStart: true,
                                periodEnd: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.messageRecipient.count({
            where: {
                recipientUserId: session.user.id,
                readAt: null,
            },
        }),
        prisma.newsItem.findMany({
            where: {
                published: true,
                audience: { in: ["PARENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
                AND: [
                    {
                        OR: [
                            { endsAt: null },
                            { endsAt: { gte: new Date() } },
                        ],
                    },
                ],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 3,
            select: {
                id: true,
                title: true,
                createdAt: true,
            },
        }),
    ]);

    const studentIds = links.map(({ student }) => student.id);
    const classIds = [
        ...new Set(
            links.flatMap(({ student }) =>
                student.enrollments.map((enrollment) => enrollment.class.id),
            ),
        ),
    ];
    const allSessions =
        classIds.length === 0
            ? []
            : await prisma.classSession.findMany({
                  where: {
                      classId: { in: classIds },
                      startsAt: { gte: startOfToday, lt: endOfToday },
                      status: { in: ["SCHEDULED", "COMPLETED"] },
                  },
                  orderBy: { startsAt: "asc" },
                  select: {
                      id: true,
                      classId: true,
                      startsAt: true,
                      endsAt: true,
                      classroom: true,
                      class: { select: { name: true, subject: true } },
                      attendance: {
                          where: { studentId: { in: studentIds } },
                          select: {
                              studentId: true,
                              status: true,
                              checkInAt: true,
                              checkOutAt: true,
                          },
                      },
                  },
              });

    const children: ParentDashboardChild[] = links.map(({ student }) => {
            const enrolledClassIds = new Set(
                student.enrollments.map((enrollment) => enrollment.class.id),
            );
            const enrollment = student.enrollments[0];
            const sessions = allSessions.filter((classSession) =>
                enrolledClassIds.has(classSession.classId),
            );

            const first = sessions[0];
            const att = first?.attendance.find(
                (row) => row.studentId === student.id,
            );

            return {
                id: student.id,
                name: student.name,
                schoolName: student.schoolName,
                grade: student.grade,
                className: enrollment?.class.name ?? null,
                teacherName: enrollment?.class.teacher?.name ?? null,
                todaySessions: sessions.map((s) => ({
                    id: s.id,
                    className: s.class.name,
                    subject: s.class.subject,
                    timeLabel: `${formatKstTime(s.startsAt)}~${formatKstTime(s.endsAt)}`,
                    classroom: s.classroom,
                    attendanceStatus: (s.attendance.find(
                        (row) => row.studentId === student.id,
                    )?.status as
                        | AttendanceStatus
                        | null) ?? null,
                })),
                arrivalSummary: first
                    ? {
                          title: first.class.name,
                          detail: `${formatKstTime(first.startsAt)}~${formatKstTime(first.endsAt)}${
                              first.classroom
                                  ? ` · ${first.classroom}`
                                  : ""
                          }`,
                          status:
                              (att?.status as AttendanceStatus | null) ?? null,
                          checkInAt: att?.checkInAt?.toISOString() ?? null,
                      }
                    : null,
                reports: student.reports.map((r) => ({
                    id: r.id,
                    content: r.content,
                    teacherName: r.author.name,
                    sentAt: r.sentAt?.toISOString() ?? null,
                    parentReadAt: r.parentReadAt?.toISOString() ?? null,
                    periodStart: r.periodStart.toISOString(),
                    periodEnd: r.periodEnd.toISOString(),
                })),
            };
        });

    return (
        <ParentDashboardScreen
            childList={children}
            unreadCount={unreadMessages}
            news={newsItems.map((item) => ({
                id: item.id,
                title: item.title,
                createdAt: item.createdAt.toISOString(),
            }))}
        />
    );
}
