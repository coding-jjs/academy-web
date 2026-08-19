import "server-only"; // 카드 숫자만. 공개 홈이 아니다.

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

import { prisma } from "@/lib/db"; // server-only Prisma.
import type { DirectorDashboardMetrics } from "@/features/dashboard/types"; // 카드 DTO.

/**
 * 오늘 구간으로 승인 대기 리포트·열린 이탈·연체·신규 문의·재원·대기 GUEST·출석률을 센다.
 */
export async function getDirectorDashboardMetrics({ // 마케팅 홈이 아니다.
    startOfDay, // KST 하루 시작. page가 넘긴다.
    endOfDay, // KST 하루 끝.
}: { // 오늘 구간.
    startOfDay: Date; // 출결·세션 분모.
    endOfDay: Date; // exclusive.
}): Promise<DirectorDashboardMetrics> { // 카드 숫자.
    const [ // 병렬 집계.
        pendingReports, // PENDING_APPROVAL.
        openChurn, // DETECTED·COUNSELING.
        overdueInvoices, // OVERDUE.
        newInquiries, // NEW.
        enrolledStudents, // ENROLLED.
        guestUsers, // 온보딩 끝난 GUEST.
        presentAttendance, // 출석+지각.
        totalAttendance, // 오늘 출결 분모.
        todaySessionCount, // 오늘 세션.
    ] = await Promise.all([ // 오늘 구간으로 카드용 숫자를 센다. 공개 마케팅 홈이 아니다.
        prisma.aiReport.count({ where: { status: "PENDING_APPROVAL" } }), // 승인 큐. 승인 액션 아님.
        prisma.churnCase.count({ // 열린 이탈.
            where: { status: { in: ["DETECTED", "COUNSELING"] } }, // 개선·퇴원은 열린 이탈이 아니다.
        }),
        prisma.invoice.count({ where: { status: "OVERDUE" } }), // 카드용 건수. 발행·상담 액션은 이 파일이 아니다.
        prisma.inquiry.count({ where: { status: "NEW" } }), // 신규 문의.
        prisma.student.count({ where: { status: "ENROLLED" } }), // 재원.
        prisma.user.count({ // 역할 부여 대기.
            where: { // 온보딩 끝난 GUEST만.
                role: "GUEST", // 업무 역할 아님.
                status: "ACTIVE", // BLOCKED 제외.
                onboardingCompleteAt: { not: null }, // 온보딩까지 끝난 GUEST. 역할 부여 대기 인원.
            },
        }),
        prisma.attendanceRecord.count({ // 출석률 분자.
            where: { // 오늘 세션.
                status: { in: ["PRESENT", "LATE"] }, // 출석+지각. 조퇴는 리포트 근거 출석률과 달리 여기에 넣지 않는다.
                session: { startsAt: { gte: startOfDay, lt: endOfDay } }, // 오늘 구간.
            },
        }),
        prisma.attendanceRecord.count({ // 출석률 분모.
            where: { // 상태 무관.
                session: { startsAt: { gte: startOfDay, lt: endOfDay } }, // 오늘 세션 출결 전체. 0이면 출석률은 null.
            },
        }),
        prisma.classSession.count({ // 오늘 수업 수.
            where: { startsAt: { gte: startOfDay, lt: endOfDay } }, // 상태 무관 건수. 상세 목록은 스태프 홈이 담당.
        }),
    ]);

    return { // 카드 props.
        pendingReports, // 승인 대기.
        openChurn, // 열린 이탈.
        overdueInvoices, // 연체.
        newInquiries, // 신규 문의.
        enrolledStudents, // 재원.
        guestUsers, // 대기 GUEST.
        todayAttendanceRate: // 분모 0이면 null.
            totalAttendance > 0 // 출결이 있을 때만 %.
                ? Math.round((presentAttendance / totalAttendance) * 100) // 반올림 %.
                : null, // 오늘 출결이 없으면 0%가 아니라 null. 카드가 '—'로 비우게 한다.
        todaySessionCount, // 오늘 세션 수.
    };
}
