import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getKstRecentRange } from "@/lib/date-kst";
import {
    classScopeWhere,
    enrollmentScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import StaffStudentsScreen from "./StaffStudentsScreen";
import type {
    AttendanceStatus,
    StaffClassOption,
    StaffStudentRow,
} from "./StaffStudentsScreen";

export const dynamic = "force-dynamic";

export default async function StaffStudentsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "TEACHER" && session.user.role !== "STAFF") {
        redirect("/post-login");
    }

    const scope = await getStaffScope(session.user.id);
    const { startRecent } = getKstRecentRange(14);

    const [students, classes] = await Promise.all([
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                ...studentScopeWhere(scope),
            },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
                user: { select: { id: true, email: true } },
                enrollments: {
                    where: enrollmentScopeWhere(scope),
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
                        session: { startsAt: { gte: startRecent } },
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
            where: {
                active: true,
                ...classScopeWhere(scope),
            },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                subject: true,
            },
        }),
    ]);

    const rows: StaffStudentRow[] = students.map((s) => ({
        id: s.id,
        name: s.name,
        schoolName: s.schoolName,
        grade: s.grade,
        status: s.status,
        googleLinked: Boolean(s.user),
        email: s.user?.email ?? null,
        classes: s.enrollments.map((e) => ({
            id: e.class.id,
            name: e.class.name,
            subject: e.class.subject,
            teacherName: e.class.teacher?.name ?? null,
        })),
        parents: s.parentLinks.map((link) => ({
            name: link.parent.name,
            relationship: link.relationship,
        })),
        recentAttendance: s.attendance.map((row) => ({
            status: row.status as AttendanceStatus,
            className: row.session.class.name,
            startsAt: row.session.startsAt.toISOString(),
            checkInAt: row.checkInAt?.toISOString() ?? null,
        })),
        recentGrades: s.gradeRecords.map((g) => ({
            id: g.id,
            title: g.title,
            subject: g.subject,
            score: Number(g.score),
            maxScore: Number(g.maxScore),
            assessedAt: g.assessedAt.toISOString(),
        })),
        recentRecords: s.learningRecords.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            content: r.content,
            recordDate: r.recordDate.toISOString(),
            authorName: r.author.name,
        })),
    }));

    const classOptions: StaffClassOption[] = classes.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
    }));

    return (
        <StaffStudentsScreen
            viewAllStudents={scope.viewAllStudents}
            students={rows}
            classes={classOptions}
        />
    );
}