import "server-only"; // 오늘 할 일. 출결 저장 액션 아님.

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

import { prisma } from "@/lib/db"; // server-only Prisma.
import { formatKstTime } from "@/lib/date-kst"; // 세션 시각 라벨.
import { // 담당 반 스코프.
    classSessionScopeWhere, // 오늘 세션.
    studentScopeWhere, // 재원 수.
    type StaffScope, // viewAllStudents.
} from "@/lib/staff-scope"; // 원장 전교가 아님.
import type { // 홈 카드.
    StaffDashboardMetrics, // 숫자.
    StaffDashboardSession, // 오늘 칸.
} from "@/features/dashboard/types"; // 마케팅 홈 아님.

/**
 * 오늘 스코프 세션 + 담당 학생 수 + (사무면) 열린 문의.
 * pendingReports는 작성중·승인대기·반려. 전교 조회면 전원, 아니면 내가 쓴 건만.
 */
export async function getStaffDashboardData({ // 출결 저장이 아니다.
    staffScope, // 담당 반 또는 전교.
    staffUserId, // 내 리포트 필터.
    isOfficeStaff, // 교사면 문의 0.
    startOfDay, // KST 하루.
    endOfDay, // exclusive.
}: { // 인자.
    staffScope: StaffScope; // 세션·학생 스코프.
    staffUserId: string; // authorUserId.
    isOfficeStaff: boolean; // NEW·IN_PROGRESS.
    startOfDay: Date; // 오늘 시작.
    endOfDay: Date; // 오늘 끝.
}): Promise<{ // 세션+지표.
    metrics: StaffDashboardMetrics; // 카드.
    sessions: StaffDashboardSession[]; // 오늘 칸.
}> { // 조회.
    const [sessionRecords, pendingReports, studentCount, openInquiries] = // 병렬.
        await Promise.all([ // 오늘 스코프 세션 + 대기 리포트 + 담당 재원 수 + (사무면) 열린 문의.
            prisma.classSession.findMany({ // 오늘 수업.
                where: { // 취소 세션 제외.
                    startsAt: { gte: startOfDay, lt: endOfDay }, // 오늘 구간.
                    status: { in: ["SCHEDULED", "COMPLETED"] }, // CANCELLED 제외.
                    ...classSessionScopeWhere(staffScope), // 담당 반.
                },
                orderBy: { startsAt: "asc" }, // 시간순.
                select: { // 미체크 계산용.
                    id: true, // Session PK.
                    startsAt: true, // 시작.
                    endsAt: true, // 끝.
                    classroom: true, // 교실.
                    class: { // 반·재원.
                        select: { // 수강.
                            id: true, // Class PK.
                            name: true, // 반 이름.
                            subject: true, // 과목.
                            enrollments: { // 재원.
                                where: { status: "ACTIVE", endedAt: null }, // 취소 수강 제외.
                                select: { studentId: true }, // 미체크 분모.
                            },
                        },
                    },
                    attendance: { select: { studentId: true } }, // 출결 행 있는 학생.
                },
            }),
            prisma.aiReport.count({ // 할 일 리포트.
                where: { // SENT 제외.
                    status: { in: ["DRAFTING", "PENDING_APPROVAL", "REJECTED"] }, // SENT는 할 일에서 뺀다.
                    ...(staffScope.viewAllStudents // 전교면 전원.
                        ? {} // 필터 없음.
                        : { authorUserId: staffUserId }), // 전교 조회가 아니면 내가 작성한 초안·대기·반려만.
                },
            }),
            prisma.student.count({ // 내 학생 수.
                where: { // 재원만.
                    status: "ENROLLED", // 담당 범위 재원만. 퇴원생은 내 학생 수에 넣지 않는다.
                    ...studentScopeWhere(staffScope), // 담당 반.
                },
            }),
            isOfficeStaff // 교사면 0.
                ? prisma.inquiry.count({ // 열린 문의.
                      where: { status: { in: ["NEW", "IN_PROGRESS"] } }, // 완료 제외.
                  })
                : Promise.resolve(0), // 교사 홈에서는 0. 사무 직원만 NEW·IN_PROGRESS.
        ]);

    const sessions = sessionRecords.map((classSession) => { // 오늘 수업 한 칸. 출결 미체크 재원 수를 세어 홈 할 일에 쓴다.
        const enrolledStudentIds = classSession.class.enrollments.map( // 재원.
            (enrollment) => enrollment.studentId, // Student PK.
        );
        const attendedStudentIds = new Set( // 출결 행.
            classSession.attendance.map((attendance) => attendance.studentId), // 체크된 학생.
        );
        const uncheckedCount = enrolledStudentIds.filter( // 미체크.
            (studentId) => !attendedStudentIds.has(studentId), // 출결 행이 없는 재원만. 결석으로 찍힌 건 체크된 것으로 본다.
        ).length; // 미체크 수.

        return { // StaffDashboardSession.
            id: classSession.id, // Session PK.
            classId: classSession.class.id, // Class PK.
            className: classSession.class.name, // 반.
            subject: classSession.class.subject, // 과목.
            classroom: classSession.classroom, // 교실.
            timeLabel: `${formatKstTime(classSession.startsAt)}~${formatKstTime(classSession.endsAt)}`, // KST.
            startsAt: classSession.startsAt.toISOString(), // ISO.
            studentCount: enrolledStudentIds.length, // 재원 수.
            uncheckedCount, // 미체크.
        };
    });

    return { // 카드용 숫자만. 출결 저장 액션은 이 파일이 아니다.
        sessions, // 오늘 칸.
        metrics: { // 홈 카드.
            todayClassCount: sessions.length, // 수업 수.
            firstClassTime: sessions[0]?.timeLabel.split("~")[0] ?? null, // 첫 시각.
            uncheckedSessions: sessions.filter( // 미체크 있는 세션.
                (session) => session.uncheckedCount > 0, // 할 일.
            ).length, // 세션 수.
            pendingReports, // 작성중·대기·반려.
            myStudentCount: studentCount, // 담당 재원.
            openInquiries, // 교사면 0.
        },
    };
}
