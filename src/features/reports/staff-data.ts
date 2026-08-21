import "server-only"; // 초안 vs 잠긴 제출. 학부모 SENT 목록이 아니다.

/**
 * 스태프 스코프 안 학생마다 편집 가능한 초안과 잠긴 리포트를 묶는다.
 *
 * 호출: `(teacher)/teacher/reports/page.tsx`가 `getStaffScope` 후 넘긴다.
 * 한 학생에 초안(UNWRITTEN/DRAFTING/REJECTED)과 잠긴 제출(PENDING/SENT/FAILED)을
 * 같이 보여, 승인 대기 중에도 다음 기간 초안을 이어 쓰게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 SENT 목록 → `parent-data.ts`.
 * - 원장 최신 1건 큐 → `director-data.ts`.
 *
 * 관련: `types.ts`의 `StaffReportStudent`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma.
import { // 담당 반 vs 전교.
    enrollmentScopeWhere, // 활성 수강 스코프.
    studentUserScopeWhere, // User where.
    type StaffScope, // viewAllStudents.
} from "@/lib/staff-scope"; // 원장 큐 스코프가 아니다.
import type { // 교사 행.
    ReportStatus, // 초안/잠긴 집합.
    StaffReportItem, // 한 건.
    StaffReportStudent, // 학생 행.
} from "@/features/reports/types"; // parent-types 아님.

const EDITABLE_STATUSES = new Set<ReportStatus>([ // 교사가 본문을 저장할 수 있는 상태.
    "UNWRITTEN", // DB 행이 없을 때도 화면이 쓰는 가상 상태.
    "DRAFTING", // 작성 중.
    "REJECTED", // 원장 반려. 교사가 다시 저장·승인요청 가능.
]);

/** 승인 요청 이후. 교사가 본문을 덮어쓰지 못하게 staff-actions가 막는 상태와 같다. */
const LOCKED_STATUSES = new Set<ReportStatus>([ // 제출 후.
    "PENDING_APPROVAL", // 원장 큐. Message는 아직 없다.
    "SENT", // 원장 승인 후 학부모 받은편지.
    "FAILED", // 발송 실패.
]);

/** Prisma 행을 화면용 ISO 문자열·키워드 배열로 옮긴다. */
function toStaffReportItem(report: { // Date → ISO.
    id: string; // AiReport PK.
    status: ReportStatus; // 초안 또는 잠긴.
    content: string; // 본문.
    keywords: unknown; // Json.
    rejectionReason: string | null; // REJECTED만.
    periodStart: Date; // 기간.
    periodEnd: Date; // 기간.
    updatedAt: Date; // 정렬.
    author: { name: string }; // 작성 교사.
}): StaffReportItem { // 화면 행.
    const keywords = Array.isArray(report.keywords) // Json 배열만.
        ? report.keywords.filter( // string만.
              (keyword): keyword is string => typeof keyword === "string", // 비문자열 버림.
          )
        : []; // 비배열.

    return { // StaffReportItem.
        id: report.id, // PK.
        status: report.status, // 상태.
        content: report.content, // 본문.
        keywords, // string[].
        rejectionReason: report.rejectionReason, // 반려 시에만. SENT에는 비움.
        teacherName: report.author.name, // 작성 교사.
        periodStart: report.periodStart.toISOString(), // ISO 문자열. 화면이 Date 객체를 직접 다루지 않게 한다.
        periodEnd: report.periodEnd.toISOString(), // ISO.
        updatedAt: report.updatedAt.toISOString(), // ISO.
    };
}

/**
 * 스코프 안 ACTIVE 학생마다 초안·잠긴 제출을 분리해 반환한다.
 * 방금 저장한 초안이 오래된 SENT보다 위에 오도록 updatedAt 내림차순으로 12건을 읽는다.
 */
export async function getStaffReportsData( // 원장 최신 1건 큐가 아니다.
    staffScope: StaffScope, // 담당 반 또는 전교.
): Promise<StaffReportStudent[]> { // 학생 행.
    const studentUsers = await prisma.user.findMany({ // 스코프 안 ACTIVE 학생. 초안과 잠긴 제출을 같이 보여 다음 기간을 이어 쓰게 한다.
        where: { // ACTIVE STUDENT.
            role: "STUDENT", // 학부모 계정 아님.
            status: "ACTIVE", // BLOCKED 제외.
            ...studentUserScopeWhere(staffScope), // viewAllStudents면 전원, 아니면 담당반.
        },
        select: { // 초안+잠긴.
            id: true, // User id.
            name: true, // 이름.
            email: true, // 목록 식별.
            schoolName: true, // 학교.
            grade: true, // 학년.
            studentProfile: { // Student.
                select: { // 수강+리포트 12건.
                    id: true, // Student PK.
                    enrollments: { // 스코프 반.
                        where: enrollmentScopeWhere(staffScope), // 담당 반 필터.
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
                    reports: { // 최근 12건.
                        orderBy: { updatedAt: "desc" }, // 방금 저장한 초안이 오래된 SENT보다 앞에 오게 12건.
                        take: 12, // 이력 상한.
                        select: { // 편집기 필드.
                            id: true, // PK.
                            status: true, // 초안/잠긴 분류.
                            content: true, // 본문.
                            keywords: true, // Json.
                            rejectionReason: true, // 반려 사유.
                            periodStart: true, // 기간.
                            periodEnd: true, // 기간.
                            updatedAt: true, // 정렬.
                            author: { select: { name: true } }, // 작성 교사.
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" }, // 이름순.
    });

    return studentUsers.map((studentUser) => { // 편집 가능 vs 잠긴(PENDING/SENT/FAILED)을 나눈다.
        const enrollment = studentUser.studentProfile?.enrollments[0]; // 반·담임.
        const reports = studentUser.studentProfile?.reports ?? []; // 최대 12건.
        const editableReport = reports.find((report) => // 초안.
            EDITABLE_STATUSES.has(report.status), // UNWRITTEN·DRAFTING·REJECTED.
        );
        const lockedReports = reports.filter((report) => // 잠긴.
            LOCKED_STATUSES.has(report.status), // PENDING·SENT·FAILED.
        );
        const draftItem = editableReport // 있으면 편집기.
            ? toStaffReportItem(editableReport) // ISO 변환.
            : null; // 초안 없음.
        const submittedReports = lockedReports.map(toStaffReportItem); // 이력.
        const submittedItem = submittedReports[0] ?? null; // 최신 잠긴.
        const report = draftItem ?? submittedItem; // 초안이 있으면 편집기, 없으면 최신 잠긴 본문을 보여 빈 화면을 피한다.

        return { // StaffReportStudent.
            id: studentUser.id, // User id. Student PK는 studentProfileId.
            studentProfileId: studentUser.studentProfile?.id ?? null, // Student PK.
            name: studentUser.name, // 이름.
            email: studentUser.email, // 이메일.
            schoolName: studentUser.schoolName, // 학교.
            grade: studentUser.grade, // 학년.
            className: enrollment?.class.name ?? null, // 반.
            teacherName: enrollment?.class.teacher?.name ?? null, // 담임.
            report, // 편집기 본문.
            submittedReport: submittedItem, // 승인 큐 배지.
            submittedReports, // 잠긴 이력.
        };
    });
}
