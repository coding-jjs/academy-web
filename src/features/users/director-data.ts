import "server-only";

import { prisma } from "@/lib/db";
import type {
    PendingRoleUser,
    UnlinkedStudentOption,
} from "@/features/users/types";

export async function getPendingRoleUsersData(): Promise<{
    users: PendingRoleUser[];
    unlinkedStudents: UnlinkedStudentOption[];
}> {
    const [userRecords, unlinkedStudents] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "GUEST",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                schoolName: true,
                grade: true,
                createdAt: true,
                studentProfile: { select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.student.findMany({
            where: {
                userId: null,
                status: { in: ["ENROLLED", "PAUSED"] },
            },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return {
        users: userRecords.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            schoolName: user.schoolName,
            grade: user.grade,
            joinedAt: user.createdAt.toISOString(),
            hasStudentProfile: Boolean(user.studentProfile),
        })),
        unlinkedStudents,
    };
}
