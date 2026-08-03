import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatKstTime, getKstDayRange } from "@/lib/date-kst";
import StudentDashboardScreen from "./StudentDashboardScreen";
import type {
    AttendanceStatus,
    StudentDashboardData,
} from "./StudentDashboardScreen";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "STUDENT") redirect("/post-login");

    const { startOfToday, endOfToday } = getKstDayRange();
    const now = new Date();

    const student = await prisma.student.findFirst({
        where: { userId: session.user.id },
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
                            subject: true,
                        },
                    },
                },
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
            wrongNotes: {
                where: { status: "OPEN" },
                select: { id: true },
            },
        },
    });

    if (!student) {
        return (
            <StudentDashboardScreen
                data={{
                    studentName: session.user.name ?? "학생",
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
                }}
            />
        );
    }

    const classIds = student.enrollments.map((e) => e.class.id);

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
                      class: {
                          select: { name: true, subject: true },
                      },
                      attendance: {
                          where: { studentId: student.id },
                          take: 1,
                          select: {
                              status: true,
                              checkInAt: true,
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
                audience: { in: ["STUDENT", "ALL"] },
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [
                    {
                        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
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
        prisma.learningRecord.findMany({
            where: {
                studentId: student.id,
                type: "HOMEWORK",
            },
            orderBy: { recordDate: "desc" },
            take: 3,
            select: {
                id: true,
                title: true,
                content: true,
                recordDate: true,
            },
        }),
    ]);

    const todaySessions = sessions.map((s) => ({
        id: s.id,
        className: s.class.name,
        subject: s.class.subject,
        timeLabel: `${formatKstTime(s.startsAt)}~${formatKstTime(s.endsAt)}`,
        classroom: s.classroom,
        startsAt: s.startsAt.toISOString(),
        attendanceStatus: (s.attendance[0]?.status as
            | AttendanceStatus
            | null) ?? null,
    }));

    const upcoming =
        sessions.find((s) => s.startsAt >= now) ?? sessions[0] ?? null;
    const firstAtt = sessions[0]?.attendance[0];

    const latest = student.gradeRecords[0];
    const data: StudentDashboardData = {
        studentName: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        linked: true,
        todaySessions,
        nextSession: upcoming
            ? {
                  className: upcoming.class.name,
                  timeLabel: `${formatKstTime(upcoming.startsAt)}~${formatKstTime(upcoming.endsAt)}`,
                  classroom: upcoming.classroom,
              }
            : null,
        todayAttendanceLabel: firstAtt
            ? (firstAtt.status as AttendanceStatus)
            : null,
        latestGrade: latest
            ? {
                  subject: latest.subject,
                  title: latest.title,
                  score: Number(latest.score),
                  maxScore: Number(latest.maxScore),
                  assessedAt: latest.assessedAt.toISOString(),
              }
            : null,
        openWrongCount: student.wrongNotes.length,
        unreadCount,
        news: newsRows.map((n) => ({
            id: n.id,
            title: n.title,
            createdAt: n.createdAt.toISOString(),
        })),
        homework: homework.map((h) => ({
            id: h.id,
            title: h.title,
            content: h.content,
            recordDate: h.recordDate.toISOString(),
        })),
    };

    return <StudentDashboardScreen data={data} />;
}