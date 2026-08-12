import "server-only";

import { prisma } from "@/lib/db";
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst";
import type { AttendanceStatus } from "@/features/attendance/types";
import type { StudentDashboardData } from "@/features/dashboard/types";

export async function getStudentDashboardData(
    studentUserId: string,
    fallbackStudentName: string,
): Promise<StudentDashboardData> {
    const { startOfToday, endOfToday } = getKstDayRange();
    const now = new Date();
    const student = await getStudentProfile(studentUserId);
    if (!student) return createUnlinkedDashboard(fallbackStudentName);

    const classIds = student.enrollments.map(
        (enrollment) => enrollment.class.id,
    );
    const [sessions, unreadCount, newsRows, homework] = await Promise.all([
        classIds.length === 0
            ? Promise.resolve([])
            : prisma.classSession.findMany({
                  where: {
                      classId: { in: classIds },
                      startsAt: { gte: startOfToday, lt: endOfToday },
                      status: { in: ["SCHEDULED", "COMPLETED"] },
                  },
                  orderBy: { startsAt: "asc" },
                  select: {
                      id: true,
                      startsAt: true,
                      endsAt: true,
                      classroom: true,
                      class: { select: { name: true, subject: true } },
                      attendance: {
                          where: { studentId: student.id },
                          take: 1,
                          select: { status: true, checkInAt: true },
                      },
                  },
              }),
        prisma.messageRecipient.count({
            where: { recipientUserId: studentUserId, readAt: null },
        }),
        prisma.newsItem.findMany({
            where: {
                published: true,
                audience: { in: ["STUDENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 3,
            select: { id: true, title: true, createdAt: true },
        }),
        prisma.learningRecord.findMany({
            where: { studentId: student.id, type: "HOMEWORK" },
            orderBy: { recordDate: "desc" },
            take: 3,
            select: { id: true, title: true, content: true, recordDate: true },
        }),
    ]);

    const upcomingSession =
        sessions.find((session) => session.startsAt >= now) ??
        sessions[0] ??
        null;
    const latestGrade = student.gradeRecords[0];

    return {
        studentName: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        linked: true,
        todaySessions: sessions.map((session) => ({
            id: session.id,
            className: session.class.name,
            subject: session.class.subject,
            timeLabel: formatKstSessionTime(session),
            classroom: session.classroom,
            startsAt: session.startsAt.toISOString(),
            attendanceStatus:
                (session.attendance[0]?.status as AttendanceStatus | null) ??
                null,
        })),
        nextSession: upcomingSession
            ? {
                  className: upcomingSession.class.name,
                  timeLabel: formatKstSessionTime(upcomingSession),
                  classroom: upcomingSession.classroom,
              }
            : null,
        todayAttendanceLabel:
            (sessions[0]?.attendance[0]?.status as AttendanceStatus | null) ??
            null,
        latestGrade: latestGrade
            ? {
                  subject: latestGrade.subject,
                  title: latestGrade.title,
                  score: Number(latestGrade.score),
                  maxScore: Number(latestGrade.maxScore),
                  assessedAt: latestGrade.assessedAt.toISOString(),
              }
            : null,
        openWrongCount: student.wrongNotes.length,
        unreadCount,
        news: newsRows.map((newsItem) => ({
            id: newsItem.id,
            title: newsItem.title,
            createdAt: newsItem.createdAt.toISOString(),
        })),
        homework: homework.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            recordDate: item.recordDate.toISOString(),
        })),
    };
}

function getStudentProfile(studentUserId: string) {
    return prisma.student.findFirst({
        where: { userId: studentUserId },
        select: {
            id: true,
            name: true,
            schoolName: true,
            grade: true,
            enrollments: {
                where: { status: "ACTIVE", endedAt: null },
                select: { class: { select: { id: true } } },
            },
            gradeRecords: {
                orderBy: { assessedAt: "desc" },
                take: 1,
                select: {
                    subject: true,
                    score: true,
                    maxScore: true,
                    title: true,
                    assessedAt: true,
                },
            },
            wrongNotes: { where: { status: "OPEN" }, select: { id: true } },
        },
    });
}

function createUnlinkedDashboard(studentName: string): StudentDashboardData {
    return {
        studentName,
        schoolName: null,
        grade: null,
        linked: false,
        todaySessions: [],
        nextSession: null,
        todayAttendanceLabel: null,
        latestGrade: null,
        openWrongCount: 0,
        unreadCount: 0,
        news: [],
        homework: [],
    };
}
