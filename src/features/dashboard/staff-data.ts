import "server-only";

/**
 * 교사·직원 홈용 오늘 세션과 담당 범위 지표를 묶는다.
 *
 * 호출: `(teacher)/teacher/dashboard/page.tsx`.
 * 출결 미체크·작성 중 리포트 등 오늘 할 일을 세션 목록과 함께 보여 주기 위함이다.
 *
 * 의도적으로 하지 않는 일:
 * - 원장 전교 집계 → `director-data.ts`.
 * - 출결 저장 액션. 미체크 수만 센다.
 *
 * 관련: `staff-scope`, `types.ts`.
 */

import { prisma } from "@/lib/db";
import { formatKstTime } from "@/lib/date-kst";
import {
    classSessionScopeWhere,
    studentScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type {
    StaffDashboardMetrics,
    StaffDashboardSession,
} from "@/features/dashboard/types";

/**
 * 오늘 스코프 세션 + 담당 학생 수 + (사무면) 열린 문의.
 * pendingReports는 작성중·승인대기·반려. 전교 조회면 전원, 아니면 내가 쓴 건만.
 */
export async function getStaffDashboardData({
    staffScope,
    staffUserId,
    isOfficeStaff,
    startOfDay,
    endOfDay,
}: {
    staffScope: StaffScope;
    staffUserId: string;
    isOfficeStaff: boolean;
    startOfDay: Date;
    endOfDay: Date;
}): Promise<{
    metrics: StaffDashboardMetrics;
    sessions: StaffDashboardSession[];
}> {
    const [sessionRecords, pendingReports, studentCount, openInquiries, pendingChurnCare] =
        await Promise.all([
            prisma.classSession.findMany({
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
                            enrollments: {
                                where: { status: "ACTIVE", endedAt: null },
                                select: { studentId: true },
                            },
                        },
                    },
                    attendance: { select: { studentId: true } },
                },
            }),
            prisma.aiReport.count({
                where: {
                    status: { in: ["DRAFTING", "PENDING_APPROVAL", "REJECTED"] },
                    ...(staffScope.viewAllStudents
                        ? {}
                        : { authorUserId: staffUserId }),
                },
            }),
            prisma.student.count({
                where: {
                    status: "ENROLLED",
                    ...studentScopeWhere(staffScope),
                },
            }),
            isOfficeStaff
                ? prisma.inquiry.count({
                      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
                  })
                : Promise.resolve(0),
            prisma.churnCase.count({
                where: {
                    assignedUserId: staffUserId,
                    status: "COUNSELING",
                },
            }),
        ]);

    const sessions = sessionRecords.map((classSession) => {
        const enrolledStudentIds = classSession.class.enrollments.map(
            (enrollment) => enrollment.studentId,
        );
        const attendedStudentIds = new Set(
            classSession.attendance.map((attendance) => attendance.studentId),
        );
        const uncheckedCount = enrolledStudentIds.filter(
            (studentId) => !attendedStudentIds.has(studentId),
        ).length;

        return {
            id: classSession.id,
            classId: classSession.class.id,
            className: classSession.class.name,
            subject: classSession.class.subject,
            classroom: classSession.classroom,
            timeLabel: `${formatKstTime(classSession.startsAt)}~${formatKstTime(classSession.endsAt)}`,
            startsAt: classSession.startsAt.toISOString(),
            studentCount: enrolledStudentIds.length,
            uncheckedCount,
        };
    });

    return {
        sessions,
        metrics: {
            todayClassCount: sessions.length,
            firstClassTime: sessions[0]?.timeLabel.split("~")[0] ?? null,
            uncheckedSessions: sessions.filter(
                (session) => session.uncheckedCount > 0,
            ).length,
            pendingReports,
            myStudentCount: studentCount,
            openInquiries,
            pendingChurnCare,
        },
    };
}
