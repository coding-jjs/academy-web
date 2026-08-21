import "server-only";

/**
 * 직원 상담 화면용 조회. 스코프 안 재원생 메모와, 선택적으로 미완료 문의를 묶는다.
 *
 * 호출: `/teacher/counseling`(onlyOwnMemos, 문의 없음),
 * `/employee/counseling`(전체 메모, includeInquiries).
 * 교사와 사무가 같은 StaffCounselingScreen을 쓰되 데이터 범위만 다르게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 완료·스팸 문의를 넣지 않음. NEW/IN_PROGRESS만.
 * - 쓰기 → `actions.ts`.
 *
 * 관련: `types.ts`, `@/lib/staff-scope`.
 */

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

/**
 * 상담 대상 학생·메모·문의 묶음.
 *
 * @param includeInquiries 직원 화면만 true. 교사는 문의 큐를 보지 않는다.
 * @param onlyOwnMemos 교사는 true(본인 작성). 직원은 false(스코프 안 전체).
 */
export async function getStaffCounselingData({
    staffScope,
    includeInquiries,
    onlyOwnMemos = false,
}: {
    staffScope: StaffScope;
    includeInquiries: boolean;
    onlyOwnMemos: boolean;
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
            where: {
                ...(onlyOwnMemos ? { authorUserId: staffScope.userId } : {}),
                ...(staffScope.viewAllStudents
                    ? {}
                    : { student: studentScopeWhere(staffScope) }),
            },
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
            teacherName: student.enrollments[0]?.class.teacher?.name ?? null,
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
