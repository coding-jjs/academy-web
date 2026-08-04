import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { resolvePermissions } from "@/lib/permissions";
import PermissionManagementScreen from "./PermissionManagementScreen";
import type { PermissionMember } from "./PermissionManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorPermissionsPage() {
    await requireRole("DIRECTOR");

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

    const members: PermissionMember[] = users.map((user) => {
        const role = user.role as "TEACHER" | "STAFF";
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role,
            permissions: resolvePermissions(role, user.permissionGrant),
        };
    });

    return <PermissionManagementScreen members={members} />;
}
