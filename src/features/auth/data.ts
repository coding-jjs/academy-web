import "server-only";

import { prisma } from "@/lib/db";
import {
    DEV_LOGIN_ROLES,
    isDevLoginEnabled,
} from "@/lib/dev-login";
import type { DevelopmentTestUser } from "@/features/auth/types";

export async function getDevelopmentTestUsers(): Promise<
    DevelopmentTestUser[]
> {
    if (!isDevLoginEnabled()) return [];
    return prisma.user.findMany({
        where: {
            status: "ACTIVE",
            email: { endsWith: "@test.local" },
            role: { in: [...DEV_LOGIN_ROLES] },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: { email: true, name: true, role: true },
    });
}
