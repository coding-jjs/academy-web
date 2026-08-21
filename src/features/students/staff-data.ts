import "server-only";

/**
 * 교사·직원 원생 화면용으로 스코프 안 학생과 최근 출석·성적·학습기록을 읽는다.
 *
 * 호출: `(teacher)/teacher/students/page.tsx`, `(employee)/employee/students/page.tsx`,
 * `features/chatbot/context.ts`.
 *
 * where 절은 페이지가 넘긴 `studentWhere`/`classWhere`를 그대로 쓰므로
 * 권한 범위(`viewAllStudents` vs 담당반)는 호출 측 `staff-scope` 책임이다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한 키를 여기서 해석하지 않는다.
 * - 학습기록을 쓰지 않는다 → `staff-actions.createLearningRecord`.
 *
 * 관련: `lib/staff-scope.ts`, `features/students/types.ts`.
 */

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    StaffClassOption,
    StaffStudentRow,
} from "@/features/students/types";

/**
 * 스코프된 원생 목록과 학습기록 폼용 반 옵션.
 *
 * @param studentWhere 호출 측이 만든 Student where. 보통 ENROLLED + scope.
 * @param classWhere 활성 반 + scope.
 * @param recentAttendanceStart 이 시각 이후 출석만. 페이지가 최근 N일을 계산해 넘긴다.
 * @returns 이름순 학생, 이름순 반.
 * @auth 호출 페이지가 TEACHER/STAFF. 이 함수는 세션을 보지 않는다.
 * @sideEffects 없음.
 */
export async function getStaffStudentsData({
    studentWhere,
    classWhere,
    recentAttendanceStart,
}: {
    studentWhere: Prisma.StudentWhereInput;
    classWhere: Prisma.ClassWhereInput;
    recentAttendanceStart: Date;
}): Promise<{
    students: StaffStudentRow[];
    classes: StaffClassOption[];
}> {
    const [studentRecords, classRecords] = await Promise.all([
        prisma.student.findMany({
            where: studentWhere,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
                user: { select: { id: true, email: true } },
                enrollments: {
                    where: { status: "ACTIVE", endedAt: null },
                    orderBy: { class: { name: "asc" } },
                    select: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                teacher: { select: { name: true } },
                            },
                        },
                    },
                },
                parentLinks: {
                    where: { endedAt: null },
                    select: {
                        relationship: true,
                        parent: { select: { name: true } },
                    },
                },
                attendance: {
                    where: {
                        session: { startsAt: { gte: recentAttendanceStart } },
                    },
                    orderBy: { session: { startsAt: "desc" } },
                    take: 5,
                    select: {
                        status: true,
                        checkInAt: true,
                        session: {
                            select: {
                                startsAt: true,
                                class: { select: { name: true } },
                            },
                        },
                    },
                },
                gradeRecords: {
                    orderBy: { assessedAt: "desc" },
                    take: 3,
                    select: {
                        id: true,
                        title: true,
                        subject: true,
                        score: true,
                        maxScore: true,
                        assessedAt: true,
                    },
                },
                learningRecords: {
                    orderBy: { recordDate: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        content: true,
                        recordDate: true,
                        author: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.class.findMany({
            where: classWhere,
            orderBy: { name: "asc" },
            select: { id: true, name: true, subject: true },
        }),
    ]);

    const students = studentRecords.map((student) => ({
        id: student.id,
        name: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        status: student.status,
        googleLinked: Boolean(student.user),
        email: student.user?.email ?? null,
        classes: student.enrollments.map((enrollment) => ({
            id: enrollment.class.id,
            name: enrollment.class.name,
            subject: enrollment.class.subject,
            teacherName: enrollment.class.teacher?.name ?? null,
        })),
        parents: student.parentLinks.map((parentLink) => ({
            name: parentLink.parent.name,
            relationship: parentLink.relationship,
        })),
        recentAttendance: student.attendance.map((attendance) => ({
            status: attendance.status,
            className: attendance.session.class.name,
            startsAt: attendance.session.startsAt.toISOString(),
            checkInAt: attendance.checkInAt?.toISOString() ?? null,
        })),
        recentGrades: student.gradeRecords.map((grade) => ({
            id: grade.id,
            title: grade.title,
            subject: grade.subject,
            score: Number(grade.score),
            maxScore: Number(grade.maxScore),
            assessedAt: grade.assessedAt.toISOString(),
        })),
        recentRecords: student.learningRecords.map((record) => ({
            id: record.id,
            type: record.type,
            title: record.title,
            content: record.content,
            recordDate: record.recordDate.toISOString(),
            authorName: record.author.name,
        })),
    }));

    return { students, classes: classRecords };
}
