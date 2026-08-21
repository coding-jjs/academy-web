import "server-only";

/**
 * 학부모 출결 화면용으로 링크된 자녀의 오늘·주간 예정 수업과 월간 집계를 읽는다.
 *
 * 호출: `(parent)/parent/attendance/page.tsx`, `features/chatbot/context.ts`.
 * 링크가 없는 원생은 포함하지 않으며, 결석 신청은 출석 상태와 별도 필드로 내려준다.
 * 구간은 KST 달력(`getKstDayRange`, 월초 `+09:00`)을 쓴다.
 *
 * 의도적으로 하지 않는 일:
 * - CANCELLED 회차를 보여 주지 않는다.
 * - AbsenceRequest로 AttendanceRecord를 만들지 않는다.
 *
 * 관련: `parent-types.ts`, `parent-actions.ts`, `lib/date-kst.ts`.
 */

import { prisma } from "@/lib/db";
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst";
import type { AttendanceStatus } from "@/features/attendance/types";
import type { ParentAttendanceChild } from "@/features/attendance/parent-types";

/**
 * 현재 학부모의 활성 링크 자녀별 출결 카드.
 *
 * @param parentUserId 세션 User.id. 페이지가 PARENT인지 이미 확인한 뒤 넘긴다.
 * @returns 연결 순(linkedAt asc). 자녀가 없으면 `[]`.
 * @auth 이 함수는 역할을 재검사하지 않는다. 링크 where만 본다.
 * @sideEffects 없음.
 */
export async function getParentAttendanceChildren(
    parentUserId: string,
): Promise<ParentAttendanceChild[]> {
    const ranges = getAttendanceRanges();
    const links = await getParentStudentLinks(parentUserId);
    const studentIds = links.map(({ student }) => student.id);
    const classIds = [
        ...new Set(
            links.flatMap(({ student }) =>
                student.enrollments.map((enrollment) => enrollment.class.id),
            ),
        ),
    ];
    const [sessions, monthAttendance] = await Promise.all([
        getUpcomingSessions(classIds, studentIds, ranges),
        prisma.attendanceRecord.findMany({
            where: {
                studentId: { in: studentIds },
                session: {
                    startsAt: {
                        gte: ranges.startOfMonth,
                        lt: ranges.endOfToday,
                    },
                },
            },
            select: { studentId: true, status: true },
        }),
    ]);
    const attendanceByStudent = Map.groupBy(
        monthAttendance,
        (attendance) => attendance.studentId,
    );

    return links.map(({ student }) => {
        const enrolledClassIds = new Set(
            student.enrollments.map((enrollment) => enrollment.class.id),
        );
        const studentSessions = sessions.filter((session) =>
            enrolledClassIds.has(session.classId),
        );
        const todaySession = studentSessions.find(
            (session) =>
                session.startsAt >= ranges.startOfToday &&
                session.startsAt < ranges.endOfToday,
        );
        const todayAttendance = todaySession?.attendance.find(
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
            monthCounts: countMonthlyAttendance(
                attendanceByStudent.get(student.id) ?? [],
            ),
            todayHighlight: todaySession
                ? {
                      className: todaySession.class.name,
                      timeLabel: formatKstSessionTime(todaySession),
                      classroom: todaySession.classroom,
                      status:
                          (todayAttendance?.status as AttendanceStatus | null) ??
                          null,
                  }
                : null,
            sessions: studentSessions.map((session) => {
                const attendance = session.attendance.find(
                    (row) => row.studentId === student.id,
                );
                const absenceRequest = session.absenceRequests.find(
                    (request) => request.studentId === student.id,
                );
                return {
                    id: session.id,
                    className: session.class.name,
                    subject: session.class.subject,
                    teacherName: session.class.teacher?.name ?? null,
                    classroom: session.classroom,
                    startsAt: session.startsAt.toISOString(),
                    endsAt: session.endsAt.toISOString(),
                    timeLabel: formatKstSessionTime(session),
                    isToday:
                        session.startsAt >= ranges.startOfToday &&
                        session.startsAt < ranges.endOfToday,
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
}

function getAttendanceRanges() {
    const { day, startOfToday, endOfToday } = getKstDayRange();
    const startOfMonth = new Date(`${day.slice(0, 8)}01T00:00:00+09:00`);
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    return { startOfToday, endOfToday, startOfMonth, endOfWeek };
}

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
                },
            },
        },
    });
}

function getUpcomingSessions(
    classIds: string[],
    studentIds: string[],
    ranges: ReturnType<typeof getAttendanceRanges>,
) {
    if (classIds.length === 0) return Promise.resolve([]);
    return prisma.classSession.findMany({
        where: {
            classId: { in: classIds },
            startsAt: { gte: ranges.startOfToday, lt: ranges.endOfWeek },
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
                where: { studentId: { in: studentIds }, cancelledAt: null },
                select: {
                    id: true,
                    studentId: true,
                    reason: true,
                    requestedAt: true,
                },
            },
        },
    });
}

function countMonthlyAttendance(
    attendance: Array<{ status: string }>,
) {
    const counts = { present: 0, late: 0, absent: 0, earlyLeave: 0 };
    for (const record of attendance) {
        if (record.status === "PRESENT") counts.present += 1;
        else if (record.status === "LATE") counts.late += 1;
        else if (record.status === "EARLY_LEAVE") counts.earlyLeave += 1;
        else counts.absent += 1;
    }
    return counts;
}
