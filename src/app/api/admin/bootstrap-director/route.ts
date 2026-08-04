import { timingSafeEqual } from "node:crypto";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    const bootstrapSecret = request.headers.get("x-bootstrap-secret");

    if (!secretMatches(bootstrapSecret, process.env.BOOTSTRAP_SECRET)) {
        return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const email = readEmail(body);
    if (!email) {
        return Response.json(
            { error: "INVALID_EMAIL", message: "대상 이메일이 필요합니다." },
            { status: 400 },
        );
    }

    const metadata = await getAuditRequestMetadata();
    const result = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('academy_bootstrap_director'))`;

        const existingDirector = await tx.user.findFirst({
            where: { role: "DIRECTOR" },
            select: { id: true, email: true },
        });
        if (existingDirector) {
            return { status: "DIRECTOR_EXISTS" as const, existingDirector };
        }

        const target = await tx.user.findUnique({
            where: { email },
            select: { id: true, email: true, role: true, status: true },
        });
        if (!target) return { status: "USER_NOT_FOUND" as const };
        if (target.status !== "ACTIVE" || target.role !== "GUEST") {
            return { status: "INVALID_TARGET" as const, target };
        }

        await tx.user.update({
            where: { id: target.id },
            data: { role: "DIRECTOR" },
        });
        await writeAuditLog(tx, {
            actorUserId: target.id,
            action: "BOOTSTRAP_DIRECTOR",
            targetType: "USER",
            targetId: target.id,
            details: { email: target.email, previousRole: target.role },
            metadata,
        });

        return { status: "SUCCESS" as const, target };
    });

    if (result.status === "DIRECTOR_EXISTS") {
        return Response.json(
            { error: result.status, directorEmail: result.existingDirector.email },
            { status: 409 },
        );
    }
    if (result.status === "USER_NOT_FOUND") {
        return Response.json(
            { error: result.status, message: "먼저 Google 로그인을 완료해 주세요." },
            { status: 404 },
        );
    }
    if (result.status === "INVALID_TARGET") {
        return Response.json(
            { error: result.status, role: result.target.role, userStatus: result.target.status },
            { status: 409 },
        );
    }

    return Response.json({
        ok: true,
        user: { id: result.target.id, email: result.target.email, role: "DIRECTOR" },
    });
}

function secretMatches(actual: string | null, expected: string | undefined) {
    if (!actual || !expected) return false;
    const actualBytes = Buffer.from(actual);
    const expectedBytes = Buffer.from(expected);
    return (
        actualBytes.length === expectedBytes.length &&
        timingSafeEqual(actualBytes, expectedBytes)
    );
}

function readEmail(body: unknown) {
    if (!body || typeof body !== "object" || !("email" in body)) return null;
    const email = String(body.email).trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
