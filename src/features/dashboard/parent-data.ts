import "server-only";

/**
 * 학부모 홈에 링크된 자녀별 오늘 수업·도착 요약·최근 SENT 리포트와 쪽지·뉴스를 묶는다.
 *
 * 호출: `(parent)/parent/dashboard/page.tsx`.
 * 여러 화면 쿼리를 한 번에 모아 홈이 한 번의 데이터 로딩으로 그려지게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 마케팅 홈 → `features/home`.
 * - 초안 리포트. SENT만 최대 3건.
 *
 * 관련: `types.ts`의 `ParentDashboardData`.
 */

import { prisma } from "@/lib/db";
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst";
import type { AttendanceStatus } from "@/features/attendance/types";
import type { ParentDashboardData } from "@/features/dashboard/types";

/**
 * 종료되지 않은 자녀 링크 + 오늘 세션 + 안 읽은 쪽지 + PARENT/ALL 뉴스 3건.
 */
export async function getParentDashboardData(
    parentUserId: string,
): Promise<ParentDashboardData> {
    const { startOfToday, endOfToday } = getKstDayRange();
    const now = new Date();
    const [links, unreadCount, newsItems] = await Promise.all([
        getParentStudentLinks(parentUserId),
        prisma.messageRecipient.count({
            where: { recipientUserId: parentUserId, readAt: null },
        }),
        prisma.newsItem.findMany({
            where: {
                published: true,
                audience: { in: ["PARENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 3,
            select: { id: true, title: true, createdAt: true },
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
    const sessions =
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
                          },
                      },
                  },
              });

    return {
        childList: links.map(({ student }) => {
            const enrolledClassIds = new Set(
                student.enrollments.map((enrollment) => enrollment.class.id),
            );
            const studentSessions = sessions.filter((session) =>
                enrolledClassIds.has(session.classId),
            );
            const firstSession = studentSessions[0];
            const firstAttendance = firstSession?.attendance.find(
                (attendance) => attendance.studentId === student.id,
            );

            return {
                id: student.id,
                name: student.name,
                schoolName: student.schoolName,
                grade: student.grade,
                className: student.enrollments[0]?.class.name ?? null,
                teacherName:
                    student.enrollments[0]?.class.teacher?.name ?? null,
                todaySessions: studentSessions.map((session) => ({
                    id: session.id,
                    className: session.class.name,
                    subject: session.class.subject,
                    timeLabel: formatKstSessionTime(session),
                    classroom: session.classroom,
                    attendanceStatus:
                        (session.attendance.find(
                            (attendance) =>
                                attendance.studentId === student.id,
                        )?.status as AttendanceStatus | null) ?? null,
                })),
                arrivalSummary: firstSession
                    ? {
                          title: firstSession.class.name,
                          detail: `${formatKstSessionTime(firstSession)}${
                              firstSession.classroom
                                  ? ` · ${firstSession.classroom}`
                                  : ""
                          }`,
                          status:
                              (firstAttendance?.status as AttendanceStatus | null) ??
                              null,
                          checkInAt:
                              firstAttendance?.checkInAt?.toISOString() ?? null,
                      }
                    : null,
                reports: student.reports.map((report) => ({
                    id: report.id,
                    content: report.content,
                    teacherName: report.author.name,
                    sentAt: report.sentAt?.toISOString() ?? null,
                    parentReadAt: report.parentReadAt?.toISOString() ?? null,
                    periodStart: report.periodStart.toISOString(),
                    periodEnd: report.periodEnd.toISOString(),
                })),
            };
        }),
        unreadCount,
        news: newsItems.map((item) => ({
            id: item.id,
            title: item.title,
            createdAt: item.createdAt.toISOString(),
        })),
    };
}

/** 활성 자녀 링크. 홈 쿼리 전에 반 id·학생 id를 모은다. */
function getParentStudentLinks(parentUserId: string) {
    return prisma.parentStudentLink.findMany({
        where: { parentUserId, endedAt: null },
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
    });
}
