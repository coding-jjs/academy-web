import "server-only";

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

import { prisma } from "@/lib/db";
import {
    enrollmentScopeWhere,
    studentUserScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type {
    ReportStatus,
    StaffReportItem,
    StaffReportStudent,
} from "@/features/reports/types";

const EDITABLE_STATUSES = new Set<ReportStatus>([
    "UNWRITTEN",
    "DRAFTING",
    "REJECTED",
]);

/** 승인 요청 이후. 교사가 본문을 덮어쓰지 못하게 staff-actions가 막는 상태와 같다. */
const LOCKED_STATUSES = new Set<ReportStatus>([
    "PENDING_APPROVAL",
    "SENT",
    "FAILED",
]);

/** Prisma 행을 화면용 ISO 문자열·키워드 배열로 옮긴다. */
function toStaffReportItem(report: {
    id: string;
    status: ReportStatus;
    content: string;
    keywords: unknown;
    rejectionReason: string | null;
    periodStart: Date;
    periodEnd: Date;
    updatedAt: Date;
    author: { name: string };
}): StaffReportItem {
    const keywords = Array.isArray(report.keywords)
        ? report.keywords.filter(
              (keyword): keyword is string => typeof keyword === "string",
          )
        : [];

    return {
        id: report.id,
        status: report.status,
        content: report.content,
        keywords,
        rejectionReason: report.rejectionReason,
        teacherName: report.author.name,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
    };
}

/**
 * 스코프 안 ACTIVE 학생마다 초안·잠긴 제출을 분리해 반환한다.
 * 방금 저장한 초안이 오래된 SENT보다 위에 오도록 updatedAt 내림차순으로 12건을 읽는다.
 */
export async function getStaffReportsData(
    staffScope: StaffScope,
): Promise<StaffReportStudent[]> {
    const studentUsers = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            status: "ACTIVE",
            ...studentUserScopeWhere(staffScope),
        },
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
                        where: enrollmentScopeWhere(staffScope),
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
                        orderBy: { updatedAt: "desc" },
                        take: 12,
                        select: {
                            id: true,
                            status: true,
                            content: true,
                            keywords: true,
                            rejectionReason: true,
                            periodStart: true,
                            periodEnd: true,
                            updatedAt: true,
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
        const reports = studentUser.studentProfile?.reports ?? [];
        const editableReport = reports.find((report) =>
            EDITABLE_STATUSES.has(report.status),
        );
        const lockedReports = reports.filter((report) =>
            LOCKED_STATUSES.has(report.status),
        );
        const draftItem = editableReport
            ? toStaffReportItem(editableReport)
            : null;
        const submittedReports = lockedReports.map(toStaffReportItem);
        const submittedItem = submittedReports[0] ?? null;
        const report = draftItem ?? submittedItem;

        return {
            id: studentUser.id,
            studentProfileId: studentUser.studentProfile?.id ?? null,
            name: studentUser.name,
            email: studentUser.email,
            schoolName: studentUser.schoolName,
            grade: studentUser.grade,
            className: enrollment?.class.name ?? null,
            teacherName: enrollment?.class.teacher?.name ?? null,
            report,
            submittedReport: submittedItem,
            submittedReports,
        };
    });
}
