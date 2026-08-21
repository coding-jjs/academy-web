import "server-only";

/**
 * 학생 본인 홈: 오늘 수업, 다음 세션, 최근 성적·오답·숙제·뉴스를 묶는다.
 *
 * 호출: `(student)/student/dashboard/page.tsx`.
 * 프로필이 없으면 linked=false 빈 홈을 돌려, 연결 전에도 화면이 깨지지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 마케팅 홈 → `features/home`.
 * - 출결 체크인 액션. 오늘 라벨만 읽는다.
 *
 * 관련: `types.ts`의 `StudentDashboardData`.
 */

import { prisma } from "@/lib/db";
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst";
import type { AttendanceStatus } from "@/features/attendance/types";
import type { StudentDashboardData } from "@/features/dashboard/types";

/**
 * Student 프로필이 있으면 오늘 세션·숙제·뉴스를 채우고, 없으면 빈 대시보드.
 */
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

/** userId로 Student 프로필·오늘 반·최근 성적 1건·미해결 오답을 읽는다. */
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

/** Student 행이 없을 때 홈이 깨지지 않게 빈 값. linked=false. */
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
