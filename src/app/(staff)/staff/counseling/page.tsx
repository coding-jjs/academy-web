import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    enrollmentScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import StaffCounselingScreen from "./StaffCounselingScreen";
import type {
    CounselingStudentOption,
    InquiryStatus,
    StaffCounselingMemo,
    StaffInquiryItem,
} from "./StaffCounselingScreen";

export const dynamic = "force-dynamic";

export default async function StaffCounselingPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "TEACHER" && session.user.role !== "STAFF") {
        redirect("/post-login");
    }

    const scope = await getStaffScope(session.user.id);
    const isStaff = session.user.role === "STAFF";

    const [students, memos, inquiries] = await Promise.all([
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                ...studentScopeWhere(scope),
            },
            orderBy: { name: "asc" },
            take: 200,
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                enrollments: {
                    where: enrollmentScopeWhere(scope),
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
            where: scope.viewAllStudents
                ? undefined
                : {
                      student: {
                          ...studentScopeWhere(scope),
                      },
                  },
            orderBy: { counseledAt: "desc" },
            take: 50,
            select: {
                id: true,
                content: true,
                counseledAt: true,
                createdAt: true,
                student: {
                    select: {
                        id: true,
                        name: true,
                        grade: true,
                    },
                },
                author: { select: { name: true } },
            },
        }),
        isStaff
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

    const studentOptions: CounselingStudentOption[] = students.map((s) => ({
        id: s.id,
        name: s.name,
        schoolName: s.schoolName,
        grade: s.grade,
        className: s.enrollments[0]?.class.name ?? null,
        teacherName: s.enrollments[0]?.class.teacher?.name ?? null,
    }));

    const memoList: StaffCounselingMemo[] = memos.map((m) => ({
        id: m.id,
        content: m.content,
        counseledAt: m.counseledAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
        studentId: m.student.id,
        studentName: m.student.name,
        studentGrade: m.student.grade,
        authorName: m.author.name,
    }));

    const inquiryList: StaffInquiryItem[] = inquiries.map((row) => ({
        id: row.id,
        guardianName: row.guardianName,
        phone: row.phone,
        studentGrade: row.studentGrade,
        interestedSubject: row.interestedSubject,
        preferredTime: row.preferredTime,
        message: row.message,
        status: row.status as InquiryStatus,
        createdAt: row.createdAt.toISOString(),
        assigneeName: row.assignee?.name ?? null,
    }));

    return (
        <StaffCounselingScreen
            role={session.user.role as "TEACHER" | "STAFF"}
            students={studentOptions}
            memos={memoList}
            inquiries={inquiryList}
        />
    );
}