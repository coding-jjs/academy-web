import "server-only"; // 최신 1건. 전이는 director-actions.

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

import { prisma } from "@/lib/db"; // server-only Prisma.
import type { DirectorReportStudent } from "@/features/reports/types"; // 큐 행.

/**
 * ACTIVE 학생 User마다 최신 리포트 1건을 붙인다.
 * enrollment는 활성 1건만 가져와 반·담임 표시에 쓴다.
 */
export async function getDirectorReportStudents(): Promise< // 승인 액션이 아니다.
    DirectorReportStudent[] // 미작성이면 report=null.
> { // 조회.
    const studentUsers = await prisma.user.findMany({ // ACTIVE STUDENT User + 최신 리포트 1건. 승인 큐는 현재 작업본만 보면 된다.
        where: { role: "STUDENT", status: "ACTIVE" }, // BLOCKED 제외.
        select: { // 최신 리포트 1건.
            id: true, // User id.
            name: true, // 이름.
            email: true, // 목록 식별.
            schoolName: true, // 학교.
            grade: true, // 학년.
            studentProfile: { // Student.
                select: { // 수강+리포트.
                    id: true, // Student PK.
                    enrollments: { // 활성 1건.
                        where: { status: "ACTIVE", endedAt: null }, // 취소 제외.
                        select: { // 반·담임.
                            class: { // 담당.
                                select: { // 이름.
                                    name: true, // 반.
                                    teacher: { select: { name: true } }, // 담임.
                                },
                            },
                        },
                        take: 1, // 활성 수강 1건으로 반·담임.
                    },
                    reports: { // 최신 1건.
                        orderBy: { createdAt: "desc" }, // 학생당 최신 1건. 초안/잠긴 행을 나누지 않는다(교사 화면은 staff-data).
                        take: 1, // 큐는 현재 작업본.
                        select: { // 승인 필드.
                            id: true, // AiReport PK.
                            status: true, // PENDING_APPROVAL이면 승인·반려 버튼.
                            content: true, // 승인 시 Message body.
                            periodStart: true, // 기간.
                            periodEnd: true, // 기간.
                            author: { select: { name: true } }, // 작성 교사.
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" }, // 이름순.
    });

    return studentUsers.map((studentUser) => { // 활성 수강 1건으로 반·담임. 리포트 없으면 null.
        const enrollment = studentUser.studentProfile?.enrollments[0]; // 반·담임.
        const latestReport = studentUser.studentProfile?.reports[0]; // 최신 1건.

        return { // DirectorReportStudent.
            id: studentUser.id, // User id.
            studentProfileId: studentUser.studentProfile?.id ?? null, // Student PK.
            name: studentUser.name, // 이름.
            email: studentUser.email, // 이메일.
            schoolName: studentUser.schoolName, // 학교.
            grade: studentUser.grade, // 학년.
            className: enrollment?.class.name ?? null, // 반.
            teacherName: enrollment?.class.teacher?.name ?? null, // 담임.
            report: latestReport // 없으면 빈 행.
                ? { // 최신 리포트.
                      id: latestReport.id, // 승인·반려 키.
                      status: latestReport.status, // PENDING_APPROVAL이면 버튼.
                      content: latestReport.content, // Message로 복사될 본문.
                      teacherName: latestReport.author.name, // 작성 교사.
                      periodStart: latestReport.periodStart.toISOString(), // ISO.
                      periodEnd: latestReport.periodEnd.toISOString(), // ISO.
                  }
                : null, // 미작성이면 큐에 빈 행으로 남긴다.
        };
    });
}
