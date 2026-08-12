import "server-only";

import { prisma } from "@/lib/db";
import { resolvePermissions } from "@/lib/permissions";
import type { PermissionMember } from "@/features/permissions/types";

export async function getPermissionMembers(): Promise<PermissionMember[]> {
    const users = await prisma.user.findMany({
        where: {
            role: { in: ["TEACHER", "STAFF"] },
            status: "ACTIVE",
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissionGrant: {
                select: {
                    viewAllStudents: true,
                    viewParentContact: true,
                    editLifeCounseling: true,
                    writeAiReport: true,
                    aiDirectSend: true,
                    ownClassAttendanceGrade: true,
                    otherTeacherAttendanceGrade: true,
                    sendMessage: true,
                    billing: true,
                    linkParentStudent: true,
                },
            },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return users.map((user) => {
        const role = user.role as PermissionMember["role"];
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role,
            permissions: resolvePermissions(role, user.permissionGrant),
        };
    });
}
