import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import ClassesManagementScreen from "@/features/classes/ClassesManagementScreen";
import type {
    ClassRow,
    ClassSessionStatus,
    TeacherOption,
} from "@/features/classes/ClassesManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorClassesPage() {
    await requireRole("DIRECTOR");

    const [classesRaw, teachersRaw] = await Promise.all([
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

    const classes: ClassRow[] = classesRaw.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        teacherUserId: c.teacherUserId,
        teacherName: c.teacher?.name ?? null,
        active: c.active,
        enrollmentCount: c._count.enrollments,
        sessions: c.sessions.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
            classroom: s.classroom,
            status: s.status as ClassSessionStatus,
        })),
    }));

    const teachers: TeacherOption[] = teachersRaw.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role as "TEACHER" | "STAFF",
    }));

    return (
        <ClassesManagementScreen classes={classes} teachers={teachers} />
    );
}
