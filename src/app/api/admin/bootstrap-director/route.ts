/**
 * 첫 DIRECTOR 생성 API. `POST /api/admin/bootstrap-director`.
 *
 * 공개 가입으로 원장이 생기지 않게, `x-bootstrap-secret` 헤더가
 * `BOOTSTRAP_SECRET`과 timing-safe로 같을 때만 통과한다.
 * proxy matcher 밖이라 JWT 역할 가드를 타지 않는다 — 시크릿이 인증이다.
 *
 * 원장이 이미 있으면 409. 대상은 ACTIVE GUEST만 DIRECTOR로 올린다.
 * advisory lock으로 동시 부트스트랩을 한 건만 성공시킨다.
 *
 * 의도적으로 하지 않는 일:
 * - 세션 로그인으로 호출하지 않는다.
 * - 이미 TEACHER 등인 계정을 원장으로 덮지 않는다.
 */

import { timingSafeEqual } from "node:crypto";
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

/** 시크릿 검사 후 GUEST를 첫 원장으로 승격한다. */
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

/** 길이까지 같은지 본 뒤 timingSafeEqual. 한쪽이 비면 실패. */
function secretMatches(actual: string | null, expected: string | undefined) {
    if (!actual || !expected) return false;
    const actualBytes = Buffer.from(actual);
    const expectedBytes = Buffer.from(expected);
    return (
        actualBytes.length === expectedBytes.length &&
        timingSafeEqual(actualBytes, expectedBytes)
    );
}

/** JSON body의 email을 소문자 trim. 형식이 아니면 null. */
function readEmail(body: unknown) {
    if (!body || typeof body !== "object" || !("email" in body)) return null;
    const email = String(body.email).trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
