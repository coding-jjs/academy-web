import { prisma } from "@/lib/db";
import {
    PERMISSION_KEYS,
    resolvePermissions,
    roleHasAllPermissions,
} from "@/lib/permissions";
import type { AppRole, PermissionKey } from "@/types/roles";

const grantSelect = Object.fromEntries(
    PERMISSION_KEYS.map((key) => [key, true]),
) as Record<PermissionKey, true>;

export async function userHasPermission(
    userId: string,
    key: PermissionKey,
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            permissionGrant: { select: grantSelect },
        },
    });

    if (!user) return false;
    if (roleHasAllPermissions(user.role as AppRole)) return true;
    if (user.role !== "TEACHER" && user.role !== "STAFF") return false;

    return resolvePermissions(user.role, user.permissionGrant)[key];
}