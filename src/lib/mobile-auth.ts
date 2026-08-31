import "server-only";

/**
 * 앱(Flutter)용 Bearer JWT. Auth.js 쿠키 세션과 섞지 않는다.
 *
 * 호출:
 * - `app/api/mobile/auth/dev-login` → `signMobileToken`
 * - `app/api/mobile/me` 및 이후 `/api/mobile/*` → `readMobileUser`
 *
 * 매 요청 `getUsableAccount`를 다시 본다. 웹 jwt 콜백과 같이
 * 원장이 역할을 바꾸거나 차단하면 다음 호출부터 막힌다.
 *
 * 의도적으로 하지 않는 일:
 * - 페이지 `requireRole`을 쓰지 않는다 → `/login` 리다이렉트가 난다.
 * - Google 네이티브 로그인을 여기서 처리하지 않는다.
 * - Auth.js 쿠키 JWT를 Bearer로 받지 않는다 → `typ: "mobile"`만 통과.
 *
 * 관련: `account-access.ts`, `auth.config.ts` 세션 maxAge 8시간.
 */

import { SignJWT, jwtVerify } from "jose";
import { getUsableAccount } from "@/lib/account-access";
import { prisma } from "@/lib/db";
import type { AppRole } from "@/types/roles";

const TOKEN_TYP = "mobile";
const TOKEN_MAX_AGE_SEC = 60 * 60 * 8;

/** `/me`와 로그인 응답에 실리는 최소 신원. 역할은 DB 기준이다. */
export type MobileUser = {
    id: string;
    email: string;
    name: string;
    role: AppRole;
    onboardingCompleted: boolean;
};

/**
 * 개발 로그인 성공 시 앱이 들고 다닐 토큰.
 *
 * @auth 호출 측이 이미 `getUsableAccount`를 통과한 User여야 한다.
 * @sideEffects 없음. 쿠키를 심지 않는다.
 */
export async function signMobileToken(user: {
    id: string;
    email: string;
}): Promise<string> {
    return new SignJWT({ email: user.email, typ: TOKEN_TYP })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_MAX_AGE_SEC}s`)
        .sign(getAuthSecret());
}

/**
 * Bearer를 검증하고 사용 가능 계정을 돌려준다. 실패면 `null`.
 *
 * 토큰의 role/email을 신뢰하지 않는다. 신원은 `sub` + DB만 본다.
 * GUEST도 통과시킨다 — `/me`가 대기 화면을 그릴 수 있게.
 */
export async function readMobileUser(
    request: Request,
): Promise<MobileUser | null> {
    const token = readBearerToken(request);
    if (!token) return null;

    const payload = await verifyMobileToken(token);
    if (!payload?.sub || payload.typ !== TOKEN_TYP) return null;

    const usable = await getUsableAccount(payload.sub);
    if (!usable) return null;

    const row = await prisma.user.findUnique({
        where: { id: usable.id },
        select: { email: true, name: true },
    });
    if (!row) return null;

    return {
        id: usable.id,
        email: row.email,
        name: row.name,
        role: usable.role,
        onboardingCompleted: usable.onboardingCompleted,
    };
}

/** 로그인 필요. `/api/chat`과 같은 코드. */
export function unauthorizedJson() {
    return Response.json(
        { error: "UNAUTHORIZED", message: "로그인이 필요합니다." },
        { status: 401 },
    );
}

/**
 * 이후 학부모/학생 라우트용. 이번 `/me`는 쓰지 않는다.
 * 역할이 아니면 403이지 401이 아니다 — 토큰은 유효하다.
 */
export async function requireMobileRole<T extends AppRole>(
    request: Request,
    ...roles: T[]
) {
    const user = await readMobileUser(request);
    if (!user) {
        return { ok: false as const, response: unauthorizedJson() };
    }
    if (!roles.includes(user.role as T)) {
        return {
            ok: false as const,
            response: Response.json(
                { error: "FORBIDDEN", message: "접근 권한이 없습니다." },
                { status: 403 },
            ),
        };
    }
    return {
        ok: true as const,
        user: { ...user, role: user.role as T },
    };
}

function readBearerToken(request: Request) {
    const header = request.headers.get("authorization");
    if (!header?.toLowerCase().startsWith("bearer ")) return null;
    const token = header.slice("bearer ".length).trim();
    return token.length > 0 ? token : null;
}

async function verifyMobileToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getAuthSecret());
        return payload as { sub?: string; typ?: string };
    } catch {
        return null;
    }
}

function getAuthSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("AUTH_SECRET이 필요합니다.");
    }
    return new TextEncoder().encode(secret);
}
