import { prisma } from "@/lib/db";
import DirectorStudentsScreen from "./DirectorStudentsScreen";
import type {
    DirectorClassOption,
    DirectorStudent,
} from "./DirectorStudentsScreen";

export const dynamic = "force-dynamic";

export default async function DirectorStudentsPage() {
    const [students, classes] = await Promise.all([
        prisma.student.findMany({
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
                enrolledAt: true,
                user: {
                    select: {
                        email: true,
                    },
                },
                enrollments: {
                    where: {
                        status: "ACTIVE",
                        endedAt: null,
                    },
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
                        parent: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: [{ status: "asc" }, { name: "asc" }],
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
            studentId: { in: students.map((student) => student.id) },
            endedAt: { not: null },
        },
        select: {
            id: true,
            studentId: true,
            endedAt: true,
            class: { select: { name: true } },
        },
        orderBy: { endedAt: "desc" },
    });

    const recentChangesByStudent = new Map<
        string,
        typeof endedEnrollments
    >();

    for (const enrollment of endedEnrollments) {
        const changes =
            recentChangesByStudent.get(enrollment.studentId) ?? [];
        if (changes.length < 5) {
            changes.push(enrollment);
            recentChangesByStudent.set(enrollment.studentId, changes);
        }
    }

    const rows: DirectorStudent[] = students.map((student) => ({
        id: student.id,
        name: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        status: student.status,
        enrolledAt: student.enrolledAt.toISOString(),
        googleLinked: Boolean(student.user),
        email: student.user?.email ?? null,
        parentNames: student.parentLinks.map((link) =>
            link.relationship
                ? `${link.parent.name} (${link.relationship})`
                : link.parent.name,
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
        })),
    }));

    const classOptions: DirectorClassOption[] = classes.map((item) => ({
        id: item.id,
        name: item.name,
        teacherName: item.teacher?.name ?? null,
    }));

    return (
        <DirectorStudentsScreen
            students={rows}
            classOptions={classOptions}
        />
    );
}
