import type { AppRole } from "@/types/roles";
import type { UserRole, UserStatus } from "@/generate/prisma/client";
import { getAuditRequestMetadata } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { finalizeExpiredWithdrawalsForUser } from "@/lib/student-lifecycle";

export type UsableAccount = {
    id: string;
    role: AppRole;
    onboardingCompleted: boolean;
};

async function readAuditMetadata() {
    try {
        return await getAuditRequestMetadata();
    } catch {
        return { ipAddress: null, userAgent: null };
    }
}

function toUsable(user: {
    id: string;
    role: UserRole;
    onboardingCompleteAt: Date | null;
}): UsableAccount {
    return {
        id: user.id,
        role: user.role,
        onboardingCompleted: user.onboardingCompleteAt !== null,
    };
}

function isClosedStatus(status: UserStatus) {
    return status === "BLOCKED" || status === "WITHDRAWN";
}

export async function getUsableAccount(
    userId: string,
): Promise<UsableAccount | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            status: true,
            onboardingCompleteAt: true,
        },
    });

    if (!user || isClosedStatus(user.status)) return null;

    if (
        user.role === "STUDENT" ||
        user.role === "PARENT" ||
        user.role === "GUEST"
    ) {
        const finalized = await finalizeExpiredWithdrawalsForUser(
            userId,
            new Date(),
            await readAuditMetadata(),
        );
        if (finalized) {
            const fresh = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    role: true,
                    status: true,
                    onboardingCompleteAt: true,
                },
            });
            if (!fresh || isClosedStatus(fresh.status)) return null;
            return toUsable(fresh);
        }
    }

    return toUsable(user);
}

export async function getUsableAccountByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });
    if (!user) return null;
    return getUsableAccount(user.id);
}
