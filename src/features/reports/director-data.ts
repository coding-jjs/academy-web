import "server-only";

/**
 * 원장 승인 큐에 쓸 재원 학생별 최신 리포트 한 건을 불러온다.
 *
 * 호출: `(director)/director/reports/page.tsx`.
 * ACTIVE STUDENT User를 기준으로 최신 `aiReport` 1건을 붙여 대기·반려·발송을 한눈에 본다.
 *
 * 의도적으로 하지 않는 일:
 * - 초안/잠긴 행을 나누지 않는다 → 교사 화면은 `staff-data.ts`.
 * - 상태 전이 → `director-actions.ts`.
 *
 * 관련: `types.ts`의 `DirectorReportStudent`.
 */

import { prisma } from "@/lib/db";
import type { DirectorReportStudent } from "@/features/reports/types";

/**
 * ACTIVE 학생 User마다 최신 리포트 1건을 붙인다.
 * enrollment는 활성 1건만 가져와 반·담임 표시에 쓴다.
 */
export async function getDirectorReportStudents(): Promise<
    DirectorReportStudent[]
> {
    const studentUsers = await prisma.user.findMany({
        where: { role: "STUDENT", status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            email: true,
            schoolName: true,
            grade: true,
            studentProfile: {
                select: {
                    id: true,
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        select: {
                            class: {
                                select: {
                                    name: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                        take: 1,
                    },
                    reports: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: {
                            id: true,
                            status: true,
                            content: true,
                            periodStart: true,
                            periodEnd: true,
                            author: { select: { name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });

    return studentUsers.map((studentUser) => {
        const enrollment = studentUser.studentProfile?.enrollments[0];
        const latestReport = studentUser.studentProfile?.reports[0];

        return {
            id: studentUser.id,
            studentProfileId: studentUser.studentProfile?.id ?? null,
            name: studentUser.name,
            email: studentUser.email,
            schoolName: studentUser.schoolName,
            grade: studentUser.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            report: latestReport
                ? {
                      id: latestReport.id,
                      status: latestReport.status,
                      content: latestReport.content,
                      teacherName: latestReport.author.name,
                      periodStart: latestReport.periodStart.toISOString(),
                      periodEnd: latestReport.periodEnd.toISOString(),
                  }
                : null,
        };
    });
}
