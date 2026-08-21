import "server-only"; // SENT만. 초안은 가정에 안 보인다.

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

import { prisma } from "@/lib/db"; // server-only Prisma.
import type { ParentReportChild } from "@/features/reports/parent-types"; // SENT DTO.

/**
 * 종료되지 않은 자녀 링크만. 리포트 where는 status=SENT.
 */
export async function getParentReportChildren( // 승인 전 본문은 안 준다.
    parentUserId: string, // 본인 링크만.
): Promise<ParentReportChild[]> { // 자녀+SENT 목록.
    const links = await prisma.parentStudentLink.findMany({ // 종료 링크 제외.
        where: { parentUserId, endedAt: null }, // 종료된 링크의 초안·발송본은 가정에 안 보인다.
        select: { // 자녀+SENT.
            student: { // User가 아니라 Student.
                select: { // 표시+리포트.
                    id: true, // Student PK.
                    name: true, // 이름.
                    schoolName: true, // 학교.
                    grade: true, // 학년.
                    enrollments: { // 활성 반 1건.
                        where: { status: "ACTIVE", endedAt: null }, // 취소 수강 제외.
                        select: { // 반·담임.
                            class: { // 담당.
                                select: { // 이름.
                                    name: true, // 반 이름.
                                    teacher: { select: { name: true } }, // 담임.
                                },
                            },
                        },
                        take: 1, // 활성 수강 1건으로 반·담임.
                    },
                    reports: { // SENT만.
                        where: { status: "SENT" }, // 원장 승인 후 SENT만. DRAFTING·PENDING·REJECTED는 노출하지 않는다.
                        orderBy: { periodEnd: "desc" }, // 기간 최신.
                        select: { // 학부모 필드.
                            id: true, // AiReport PK.
                            content: true, // 승인 때 Message와 같은 본문.
                            keywords: true, // Json.
                            periodStart: true, // 기간 시작.
                            periodEnd: true, // 기간 끝.
                            sentAt: true, // 승인 시각.
                            parentReadAt: true, // 읽음은 이 파일이 아니라 화면/인박스 액션.
                            author: { select: { name: true } }, // 작성 교사.
                        },
                    },
                },
            },
        },
        orderBy: { linkedAt: "asc" }, // 연결 순.
    });

    return links.map(({ student }) => { // 활성 수강 1건으로 반·담임. keywords는 string[]만.
        const enrollment = student.enrollments[0]; // 반·담임.

        return { // ParentReportChild.
            id: student.id, // Student PK.
            name: student.name, // 이름.
            schoolName: student.schoolName, // 학교.
            grade: student.grade, // 학년.
            className: enrollment?.class.name ?? null, // 반.
            teacherName: enrollment?.class.teacher?.name ?? null, // 담임.
            reports: student.reports.map((report) => ({ // SENT만.
                id: report.id, // AiReport PK.
                content: report.content, // 원장 승인 때 Message와 같은 본문.
                keywords: getStringKeywords(report.keywords), // string[]만.
                teacherName: report.author.name, // 작성 교사.
                periodStart: report.periodStart.toISOString(), // ISO.
                periodEnd: report.periodEnd.toISOString(), // ISO.
                sentAt: report.sentAt?.toISOString() ?? null, // 발송 시각.
                parentReadAt: report.parentReadAt?.toISOString() ?? null, // 읽음 시각.
            })),
        };
    });
}

/** Prisma Json 키워드를 string[]로. 배열이 아니면 빈 목록. */
function getStringKeywords(value: unknown): string[] { // 자유 객체를 안 넘긴다.
    return Array.isArray(value) // Json 배열만.
        ? value.filter((item): item is string => typeof item === "string") // 배열이 아니면 빈 목록.
        : []; // 비배열.
}
