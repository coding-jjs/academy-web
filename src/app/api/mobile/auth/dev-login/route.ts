/**
 * `POST /api/mobile/auth/dev-login`. 로컬 전용 앱 로그인.
 *
 * 웹 Credentials(`ENABLE_DEV_LOGIN` + `@test.local`)와 같은 문이다.
 * 쿠키 세션 대신 Bearer JWT를 발급한다.
 * `src/proxy.ts` matcher에 `/api/mobile`은 없다 — 핸들러가 플래그·이메일을 직접 검사한다.
 *
 * 프로덕션에서는 404로 존재를 숨긴다. 웹 `signInAsTestUser`가 `/login`으로
 * 돌려보내는 것과 같은 이유.
 *
 * 의도적으로 하지 않는 일:
 * - 비밀번호를 받지 않는다.
 * - Gmail을 이 경로로 받지 않는다.
 * - Google 네이티브 토큰을 검증하지 않는다.
 *
 * 관련: `lib/dev-login.ts`, `lib/mobile-auth.ts`, `auth.config.ts` authorize.
 */

import { getUsableAccount } from "@/lib/account-access";
import {
    DEV_LOGIN_ROLES,
    isDevLoginEnabled,
    parseDevTestEmail,
} from "@/lib/dev-login";
import { prisma } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile-auth";

export async function POST(request: Request) {
    if (!isDevLoginEnabled()) {
        return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const email = parseDevTestEmail(
        body && typeof body === "object" && "email" in body ? body.email : null,
    );
    if (!email) {
        return Response.json(
            { error: "INVALID_REQUEST", message: "테스트 계정이 필요합니다." },
            { status: 400 },
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            email,
            role: { in: [...DEV_LOGIN_ROLES] },
        },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });
    if (!user) {
        return Response.json(
            { error: "UNAUTHORIZED", message: "로그인이 필요합니다." },
            { status: 401 },
        );
    }

    const usable = await getUsableAccount(user.id);
    if (!usable) {
        return Response.json(
            { error: "UNAUTHORIZED", message: "로그인이 필요합니다." },
            { status: 401 },
        );
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    const token = await signMobileToken(user);

    return Response.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: usable.role,
            onboardingCompleted: usable.onboardingCompleted,
        },
    });
}
