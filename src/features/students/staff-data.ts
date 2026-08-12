import "server-only";

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    StaffClassOption,
    StaffStudentRow,
} from "@/features/students/types";

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
