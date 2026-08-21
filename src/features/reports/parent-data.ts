import "server-only";

/**
 * 학부모에게 링크된 자녀의 SENT 리포트만 모아 조회한다.
 *
 * 호출: `(parent)/parent/reports/page.tsx`.
 * 미발송·초안은 노출하지 않아, 가정에는 원장 승인 후 발송된 본문만 보이게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - DRAFTING·PENDING_APPROVAL·REJECTED 조회 안 함.
 * - 읽음 처리 액션은 이 파일이 아니라 받은편지/리포트 화면 쪽.
 *
 * 관련: `parent-types.ts`, `director-actions.approveAndSendReport`.
 */

import { prisma } from "@/lib/db";
import type { ParentReportChild } from "@/features/reports/parent-types";

/**
 * 종료되지 않은 자녀 링크만. 리포트 where는 status=SENT.
 */
export async function getParentReportChildren(
    parentUserId: string,
): Promise<ParentReportChild[]> {
    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId, endedAt: null },
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
                                    name: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                        take: 1,
                    },
                    reports: {
                        where: { status: "SENT" },
                        orderBy: { periodEnd: "desc" },
                        select: {
                            id: true,
                            content: true,
                            keywords: true,
                            periodStart: true,
                            periodEnd: true,
                            sentAt: true,
                            parentReadAt: true,
                            author: { select: { name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { linkedAt: "asc" },
    });

    return links.map(({ student }) => {
        const enrollment = student.enrollments[0];

        return {
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            reports: student.reports.map((report) => ({
                id: report.id,
                content: report.content,
                keywords: getStringKeywords(report.keywords),
                teacherName: report.author.name,
                periodStart: report.periodStart.toISOString(),
                periodEnd: report.periodEnd.toISOString(),
                sentAt: report.sentAt?.toISOString() ?? null,
                parentReadAt: report.parentReadAt?.toISOString() ?? null,
            })),
        };
    });
}

/** Prisma Json 키워드를 string[]로. 배열이 아니면 빈 목록. */
function getStringKeywords(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}
