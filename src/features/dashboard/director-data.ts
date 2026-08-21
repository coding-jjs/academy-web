import "server-only";

/**
 * 원장 홈에 쓸 오늘 지표를 집계한다.
 *
 * 호출: `(director)/director/dashboard/page.tsx`가 KST 하루 범위를 넘긴다.
 * 상세 목록이 아니라 카드용 숫자만 반환한다.
 *
 * 의도적으로 하지 않는 일:
 * - 리포트 승인·이탈 감지 실행. 카운트만.
 * - 공개 마케팅 홈(`/`) → `features/home`.
 *
 * 관련: `types.ts`의 `DirectorDashboardMetrics`.
 */

import { OPEN_CHURN_STATUSES } from "@/features/churn/types";
import { prisma } from "@/lib/db";
import type { DirectorDashboardMetrics } from "@/features/dashboard/types";

/**
 * 오늘 구간으로 승인 대기 리포트·열린 이탈·연체·신규 문의·재원·대기 GUEST·출석률을 센다.
 */
export async function getDirectorDashboardMetrics({
    startOfDay,
    endOfDay,
}: {
    startOfDay: Date;
    endOfDay: Date;
}): Promise<DirectorDashboardMetrics> {
    const [
        pendingReports,
        openChurn,
        overdueInvoices,
        newInquiries,
        enrolledStudents,
        guestUsers,
        presentAttendance,
        totalAttendance,
        todaySessionCount,
    ] = await Promise.all([
        prisma.aiReport.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.churnCase.count({
            where: { status: { in: [...OPEN_CHURN_STATUSES] } },
        }),
        prisma.invoice.count({ where: { status: "OVERDUE" } }),
        prisma.inquiry.count({ where: { status: "NEW" } }),
        prisma.student.count({ where: { status: "ENROLLED" } }),
        prisma.user.count({
            where: {
                role: "GUEST",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
        }),
        prisma.attendanceRecord.count({
            where: {
                status: { in: ["PRESENT", "LATE"] },
                session: { startsAt: { gte: startOfDay, lt: endOfDay } },
            },
        }),
        prisma.attendanceRecord.count({
            where: {
                session: { startsAt: { gte: startOfDay, lt: endOfDay } },
            },
        }),
        prisma.classSession.count({
            where: { startsAt: { gte: startOfDay, lt: endOfDay } },
        }),
    ]);

    return {
        pendingReports,
        openChurn,
        overdueInvoices,
        newInquiries,
        enrolledStudents,
        guestUsers,
        todayAttendanceRate:
            totalAttendance > 0
                ? Math.round((presentAttendance / totalAttendance) * 100)
                : null,
        todaySessionCount,
    };
}
