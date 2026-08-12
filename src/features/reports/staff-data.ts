import "server-only";

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

const LOCKED_STATUSES = new Set<ReportStatus>([
    "PENDING_APPROVAL",
    "SENT",
    "FAILED",
]);

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
                        // Prefer most recently touched so a just-approved draft
                        // wins over an older pending/sent row.
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
