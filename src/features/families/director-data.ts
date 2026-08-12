import "server-only";

import { prisma } from "@/lib/db";
import type {
    ActiveFamilyLink,
    LinkableParent,
    LinkableStudent,
} from "@/features/families/types";

export async function getDirectorFamilyLinksData(): Promise<{
    parents: LinkableParent[];
    students: LinkableStudent[];
    activeLinks: ActiveFamilyLink[];
}> {
    const [parents, students, linkRecords] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "PARENT",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
        }),
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                user: { is: { role: "STUDENT", status: "ACTIVE" } },
                parentLinks: { none: { endedAt: null } },
            },
            select: { id: true, name: true, schoolName: true, grade: true },
            orderBy: { name: "asc" },
        }),
        prisma.parentStudentLink.findMany({
            where: { endedAt: null },
            select: {
                id: true,
                relationship: true,
                linkedAt: true,
                parent: {
                    select: { name: true, email: true, phone: true },
                },
                student: {
                    select: {
                        name: true,
                        schoolName: true,
                        grade: true,
                        user: { select: { email: true } },
                    },
                },
            },
            orderBy: { linkedAt: "desc" },
        }),
    ]);

    const activeLinks = linkRecords.map((link) => ({
        id: link.id,
        relationship: link.relationship,
        linkedAt: link.linkedAt.toISOString(),
        parent: link.parent,
        student: {
            name: link.student.name,
            schoolName: link.student.schoolName,
            grade: link.student.grade,
            email: link.student.user?.email ?? null,
        },
    }));

    return { parents, students, activeLinks };
}
