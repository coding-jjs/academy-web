import "server-only";

/**
 * 오늘 스코프 안 회차와 수강생 출결·결석 신청을 읽는다.
 *
 * 호출: `(teacher)/teacher/attendance/page.tsx`, `features/chatbot/context.ts`.
 * `classSessionScopeWhere`가 `viewAllStudents` vs 담당반을 가른다.
 * 학부모 결석 신청은 출석 행이 아니라 `absenceRequest`로만 붙어 화면에 힌트를 준다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한 키 own/other Teacher Attendance를 여기서 쓰지 않는다. 저장 액션이 검사.
 * - CANCELLED 회차는 오늘 명단에 올리지 않는다.
 *
 * 관련: `lib/staff-scope.ts`, `staff-types.ts`, `staff-actions.ts`.
 */

import { prisma } from "@/lib/db";
import { formatKstTime } from "@/lib/date-kst";
import {
    classSessionScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type { StaffAttendanceSession } from "@/features/attendance/staff-types";

/**
 * 오늘(호출 측이 넘긴 KST 구간)의 출결 입력용 회차 목록.
 *
 * @param staffScope `getStaffScope` 결과. viewAllStudents면 전체 반.
 * @param startOfDay / endOfDay 페이지가 `getKstDayRange`로 계산한 Instant.
 * @returns 시작 시각 오름차순. 수강생은 이름순.
 * @auth 페이지가 TEACHER/STAFF. 이 함수는 세션을 보지 않는다.
 * @sideEffects 없음.
 */
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
