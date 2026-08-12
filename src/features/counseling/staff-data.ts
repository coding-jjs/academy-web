import "server-only";

import { prisma } from "@/lib/db";
import {
    enrollmentScopeWhere,
    studentScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";
import type {
    CounselingStudentOption,
    StaffCounselingMemo,
    StaffInquiryItem,
} from "@/features/counseling/types";

export async function getStaffCounselingData({
    staffScope,
    includeInquiries,
}: {
    staffScope: StaffScope;
    includeInquiries: boolean;
}): Promise<{
    students: CounselingStudentOption[];
    memos: StaffCounselingMemo[];
    inquiries: StaffInquiryItem[];
}> {
    const [studentRecords, memoRecords, inquiryRecords] = await Promise.all([
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                ...studentScopeWhere(staffScope),
            },
            orderBy: { name: "asc" },
            take: 200,
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                enrollments: {
                    where: enrollmentScopeWhere(staffScope),
                    take: 1,
                    select: {
                        class: {
                            select: {
                                name: true,
                                teacher: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.counselingMemo.findMany({
            where: staffScope.viewAllStudents
                ? undefined
                : { student: studentScopeWhere(staffScope) },
            orderBy: { counseledAt: "desc" },
            take: 50,
            select: {
                id: true,
                content: true,
                counseledAt: true,
                createdAt: true,
                student: { select: { id: true, name: true, grade: true } },
                author: { select: { name: true } },
            },
        }),
        includeInquiries
            ? prisma.inquiry.findMany({
                  where: { status: { in: ["NEW", "IN_PROGRESS"] } },
                  orderBy: { createdAt: "desc" },
                  take: 30,
                  select: {
                      id: true,
                      guardianName: true,
                      phone: true,
                      studentGrade: true,
                      interestedSubject: true,
                      preferredTime: true,
                      message: true,
                      status: true,
                      createdAt: true,
                      assignee: { select: { name: true } },
                  },
              })
            : Promise.resolve([]),
    ]);

    return {
        students: studentRecords.map((student) => ({
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: student.enrollments[0]?.class.name ?? null,
            teacherName:
                student.enrollments[0]?.class.teacher?.name ?? null,
        })),
        memos: memoRecords.map((memo) => ({
            id: memo.id,
            content: memo.content,
            counseledAt: memo.counseledAt.toISOString(),
            createdAt: memo.createdAt.toISOString(),
            studentId: memo.student.id,
            studentName: memo.student.name,
            studentGrade: memo.student.grade,
            authorName: memo.author.name,
        })),
        inquiries: inquiryRecords.map((inquiry) => ({
            id: inquiry.id,
            guardianName: inquiry.guardianName,
            phone: inquiry.phone,
            studentGrade: inquiry.studentGrade,
            interestedSubject: inquiry.interestedSubject,
            preferredTime: inquiry.preferredTime,
            message: inquiry.message,
            status: inquiry.status,
            createdAt: inquiry.createdAt.toISOString(),
            assigneeName: inquiry.assignee?.name ?? null,
        })),
    };
}
