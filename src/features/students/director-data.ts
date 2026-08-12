import "server-only";

import { prisma } from "@/lib/db";
import type {
    DirectorClassOption,
    DirectorStudent,
} from "@/features/students/types";

export async function getDirectorStudentsData(): Promise<{
    students: DirectorStudent[];
    classOptions: DirectorClassOption[];
}> {
    const [studentRecords, classRecords] = await Promise.all([
        prisma.student.findMany({
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
                user: { select: { id: true, email: true } },
                enrollments: {
                    where: { status: "ACTIVE", endedAt: null },
                    select: {
                        id: true,
                        enrolledAt: true,
                        class: {
                            select: {
                                id: true,
                                name: true,
                                teacher: { select: { name: true } },
                            },
                        },
                    },
                    orderBy: { enrolledAt: "asc" },
                },
                parentLinks: {
                    where: { endedAt: null },
                    select: {
                        relationship: true,
                        parent: { select: { name: true } },
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
        prisma.class.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                teacher: { select: { name: true } },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    const endedEnrollments = await prisma.classEnrollment.findMany({
        where: {
            studentId: { in: studentRecords.map((student) => student.id) },
            endedAt: { not: null },
        },
        select: {
            id: true,
            studentId: true,
            endedAt: true,
            status: true,
            class: { select: { name: true } },
        },
        orderBy: { endedAt: "desc" },
    });

    const recentChangesByStudent = new Map<
        string,
        typeof endedEnrollments
    >();
    for (const enrollment of endedEnrollments) {
        const studentChanges =
            recentChangesByStudent.get(enrollment.studentId) ?? [];
        if (studentChanges.length < 5) {
            studentChanges.push(enrollment);
            recentChangesByStudent.set(enrollment.studentId, studentChanges);
        }
    }

    const students = studentRecords.map((student) => ({
        id: student.id,
        name: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        status: student.status,
        googleLinked: Boolean(student.user),
        email: student.user?.email ?? null,
        parentCount: student.parentLinks.length,
        parentNames: student.parentLinks.map(
            (parentLink) =>
                `${parentLink.parent.name}${parentLink.relationship ? ` (${parentLink.relationship})` : ""}`,
        ),
        classes: student.enrollments.map((enrollment) => ({
            enrollmentId: enrollment.id,
            classId: enrollment.class.id,
            className: enrollment.class.name,
            teacherName: enrollment.class.teacher?.name ?? null,
            enrolledAt: enrollment.enrolledAt.toISOString(),
        })),
        recentChanges: (
            recentChangesByStudent.get(student.id) ?? []
        ).map((enrollment) => ({
            id: enrollment.id,
            className: enrollment.class.name,
            endedAt: enrollment.endedAt!.toISOString(),
            status: enrollment.status,
        })),
    }));

    const classOptions = classRecords.map((academyClass) => ({
        id: academyClass.id,
        name: academyClass.name,
        teacherName: academyClass.teacher?.name ?? null,
    }));

    return { students, classOptions };
}
