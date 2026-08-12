import "server-only";

import { prisma } from "@/lib/db";
import type {
    ClassRow,
    TeacherOption,
} from "@/features/classes/types";

export async function getClassesManagementData(): Promise<{
    classes: ClassRow[];
    teachers: TeacherOption[];
}> {
    const [classRecords, teacherRecords] = await Promise.all([
        prisma.class.findMany({
            orderBy: [{ active: "desc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                subject: true,
                teacherUserId: true,
                active: true,
                teacher: { select: { name: true } },
                _count: {
                    select: {
                        enrollments: {
                            where: { status: "ACTIVE", endedAt: null },
                        },
                    },
                },
                sessions: {
                    orderBy: { startsAt: "desc" },
                    take: 30,
                    select: {
                        id: true,
                        startsAt: true,
                        endsAt: true,
                        classroom: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.user.findMany({
            where: {
                role: { in: ["TEACHER", "STAFF"] },
                status: "ACTIVE",
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true, role: true },
        }),
    ]);

    const classes = classRecords.map((academyClass) => ({
        id: academyClass.id,
        name: academyClass.name,
        subject: academyClass.subject,
        teacherUserId: academyClass.teacherUserId,
        teacherName: academyClass.teacher?.name ?? null,
        active: academyClass.active,
        enrollmentCount: academyClass._count.enrollments,
        sessions: academyClass.sessions.map((classSession) => ({
            id: classSession.id,
            startsAt: classSession.startsAt.toISOString(),
            endsAt: classSession.endsAt.toISOString(),
            classroom: classSession.classroom,
            status: classSession.status,
        })),
    }));

    const teachers = teacherRecords.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        role: teacher.role as TeacherOption["role"],
    }));

    return { classes, teachers };
}
