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

import { timingSafeEqual } from "node:crypto"; // 시크릿 비교. JWT 가드가 아니라 헤더가 인증이다.
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit"; // IP·UA. 시크릿은 로그에 안 남긴다.
import { prisma } from "@/lib/db"; // server-only. 첫 DIRECTOR만. assignUserRole과 별개.

/** 시크릿 검사 후 GUEST를 첫 원장으로 승격한다. */
export async function POST(request: Request) { // proxy matcher 밖. 세션 로그인으로 호출하지 않는다.
    const bootstrapSecret = request.headers.get("x-bootstrap-secret"); // JWT 가드 없음. 헤더가 BOOTSTRAP_SECRET과 timing-safe로 같을 때만.

    if (!secretMatches(bootstrapSecret, process.env.BOOTSTRAP_SECRET)) { // 시크릿 불일치. 세션 로그인으로 호출하지 않는다.
        return Response.json({ error: "FORBIDDEN" }, { status: 403 }); // 403. 원장 목록을 노출하지 않는다.
    } // 블록 끝.

    const body = await request.json().catch(() => null); // ACTIVE GUEST 이메일만. 이미 TEACHER 등은 덮지 않는다.
    const email = readEmail(body); // 소문자 trim. 형식이 아니면 null.
    if (!email) { // 대상 없음. Google 가입 전이면 404 쪽에서 안내.
        return Response.json( // 400. 이메일 형식.
            { error: "INVALID_EMAIL", message: "대상 이메일이 필요합니다." }, // 폼 signup email이 아니다.
            { status: 400 }, // 잘못된 본문.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    const metadata = await getAuditRequestMetadata(); // IP·UA. 시크릿은 로그에 안 남긴다.
    const result = await prisma.$transaction(async (tx) => { // advisory lock으로 동시 부트스트랩을 한 건만. 원장이 있으면 409.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('academy_bootstrap_director'))`; // 동시 POST를 한 건만 성공.

        const existingDirector = await tx.user.findFirst({ // 이미 원장이 있으면 승격하지 않는다.
            where: { role: "DIRECTOR" }, // 첫 DIRECTOR만.
            select: { id: true, email: true }, // 409에 이메일을 돌려준다.
        }); // 객체/호출 끝.
        if (existingDirector) { // 첫 DIRECTOR만. assignUserRole과 별개.
            return { status: "DIRECTOR_EXISTS" as const, existingDirector }; // 409 분기.
        } // 블록 끝.

        const target = await tx.user.findUnique({ // 이메일로 대상. TEACHER 등을 덮지 않는다.
            where: { email }, // 소문자 이메일.
            select: { id: true, email: true, role: true, status: true }, // 역할·상태 검사.
        }); // 객체/호출 끝.
        if (!target) return { status: "USER_NOT_FOUND" as const }; // Google 로그인 전.
        if (target.status !== "ACTIVE" || target.role !== "GUEST") { // BLOCKED·이미 역할 있음. 덮지 않는다.
            return { status: "INVALID_TARGET" as const, target }; // 409. TEACHER를 DIRECTOR로 덮지 않는다.
        } // 블록 끝.

        await tx.user.update({ // ACTIVE GUEST만 DIRECTOR. JWT는 다음 요청이 DB를 다시 읽는다.
            where: { id: target.id }, // 대상 User.
            data: { role: "DIRECTOR" }, // 역할만. 온보딩 completeSignup과 별개.
        }); // 객체/호출 끝.
        await writeAuditLog(tx, { // 부트스트랩 승격. 시크릿 값은 남기지 않는다.
            actorUserId: target.id, // 승격된 본인.
            action: "BOOTSTRAP_DIRECTOR", // 감사 액션.
            targetType: "USER", // User 행.
            targetId: target.id, // 같은 사람.
            details: { email: target.email, previousRole: target.role }, // 이전 역할 GUEST.
            metadata, // IP·UA. 시크릿 없음.
        }); // 객체/호출 끝.

        return { status: "SUCCESS" as const, target }; // 첫 원장 생성. 온보딩 completeSignup과 별개.
    }); // 객체/호출 끝.

    if (result.status === "DIRECTOR_EXISTS") { // 이미 원장. 두 번째 부트스트랩 거부.
        return Response.json( // 409.
            { error: result.status, directorEmail: result.existingDirector.email }, // 기존 원장 이메일.
            { status: 409 }, // 충돌.
        ); // 호출/그룹 끝.
    } // 블록 끝.
    if (result.status === "USER_NOT_FOUND") { // Google 가입부터.
        return Response.json( // 404.
            { error: result.status, message: "먼저 Google 로그인을 완료해 주세요." }, // 가입 전.
            { status: 404 }, // 대상 없음.
        ); // 호출/그룹 끝.
    } // 블록 끝.
    if (result.status === "INVALID_TARGET") { // GUEST·ACTIVE가 아님.
        return Response.json( // 409.
            { error: result.status, role: result.target.role, userStatus: result.target.status }, // 덮지 않은 이유.
            { status: 409 }, // 잘못된 대상.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    return Response.json({ // 성공만 ok. 세션 쿠키를 여기서 안 만든다.
        ok: true, // 승격 성공.
        user: { id: result.target.id, email: result.target.email, role: "DIRECTOR" }, // JWT는 다음 요청이 DB를 다시 읽는다.
    }); // 객체/호출 끝.
} // 블록 끝.

/** 길이까지 같은지 본 뒤 timingSafeEqual. 한쪽이 비면 실패. */
function secretMatches(actual: string | null, expected: string | undefined) { // JWT가 아니라 헤더 시크릿.
    if (!actual || !expected) return false; // 한쪽이 비면 실패. 길이 먼저 비교.
    const actualBytes = Buffer.from(actual); // 헤더 값.
    const expectedBytes = Buffer.from(expected); // env BOOTSTRAP_SECRET.
    return ( // 길이까지 같은지 본 뒤 timingSafeEqual.
        actualBytes.length === expectedBytes.length && // 길이 다르면 Equal을 부르지 않는다.
        timingSafeEqual(actualBytes, expectedBytes) // 타이밍 안전 비교.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** JSON body의 email을 소문자 trim. 형식이 아니면 null. */
function readEmail(body: unknown) { // JSON email만. 폼 signup email이 아니다.
    if (!body || typeof body !== "object" || !("email" in body)) return null; // JSON email만.
    const email = String(body.email).trim().toLowerCase(); // 소문자. 폼 signup email이 아니다.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null; // 형식이 아니면 null.
} // 블록 끝.
