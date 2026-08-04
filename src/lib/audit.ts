import { isIP } from "node:net";
import { headers } from "next/headers";
import type { Prisma } from "@/generate/prisma/client";

export type AuditRequestMetadata = {
    ipAddress: string | null;
    userAgent: string | null;
};

export async function getAuditRequestMetadata(): Promise<AuditRequestMetadata> {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0];
    const candidateIp = (
        forwardedFor ??
        requestHeaders.get("x-real-ip") ??
        ""
    ).trim();

    return {
        ipAddress: isIP(candidateIp) ? candidateIp : null,
        userAgent: requestHeaders.get("user-agent")?.slice(0, 512) ?? null,
    };
}

export async function writeAuditLog(
    tx: Prisma.TransactionClient,
    input: {
        actorUserId: string;
        action: string;
        targetType: string;
        targetId?: string | null;
        details?: Prisma.InputJsonValue;
        metadata: AuditRequestMetadata;
    },
) {
    await tx.auditLog.create({
        data: {
            actorUserId: input.actorUserId,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId ?? null,
            details: input.details ?? {},
            ipAddress: input.metadata.ipAddress,
            userAgent: input.metadata.userAgent,
        },
    });
}
