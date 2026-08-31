import "server-only";

/**
 * Google 프로필로 User·OAuthAccount를 맞춘다. 세션/Bearer는 호출 측이 만든다.
 *
 * 호출:
 * - `auth.config.ts` signIn (웹 쿠키)
 * - `app/api/mobile/auth/google` (앱 JWT)
 *
 * login이면 기존 회원만. signup이고 없으면 GUEST 생성.
 * BLOCKED/WITHDRAWN은 갱신하지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - intent 쿠키를 읽지 않는다. 호출 측이 login/signup을 넘긴다.
 * - 역할을 가입자가 고르게 하지 않는다.
 *
 * 관련: `oauth-intent.ts`, `account-access.ts`.
 */

import { getUsableAccount } from "@/lib/account-access";
import { prisma } from "@/lib/db";
import type { OAuthIntent } from "@/lib/oauth-intent";
import type { MobileUser } from "@/lib/mobile-auth";

export type GoogleAccountResult =
    | { ok: true; user: MobileUser }
    | {
          ok: false;
          code: "BLOCKED" | "UNREGISTERED" | "ACCOUNT_MISMATCH";
      };

export async function completeGoogleAccount(input: {
    email: string;
    name: string | null;
    imageUrl: string | null;
    providerAccountId: string;
    intent: OAuthIntent | null;
}): Promise<GoogleAccountResult> {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) {
        const usable = await getUsableAccount(existing.id);
        if (!usable) return { ok: false, code: "BLOCKED" };
    } else if (input.intent !== "signup") {
        return { ok: false, code: "UNREGISTERED" };
    }

    const dbUser = existing
        ? await prisma.user.update({
              where: { id: existing.id },
              data: {
                  imageUrl: input.imageUrl,
                  lastLoginAt: new Date(),
              },
          })
        : await prisma.user.create({
              data: {
                  email,
                  name: input.name?.trim() || email.split("@")[0],
                  imageUrl: input.imageUrl,
                  lastLoginAt: new Date(),
              },
          });

    const accountKey = {
        provider: "google",
        providerAccountId: input.providerAccountId,
    };

    const existingAccount = await prisma.oAuthAccount.findUnique({
        where: { provider_providerAccountId: accountKey },
    });

    if (existingAccount && existingAccount.userId !== dbUser.id) {
        return { ok: false, code: "ACCOUNT_MISMATCH" };
    }

    await prisma.oAuthAccount.upsert({
        where: { provider_providerAccountId: accountKey },
        create: {
            userId: dbUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId: input.providerAccountId,
        },
        update: { updatedAt: new Date() },
    });

    const usable = await getUsableAccount(dbUser.id);
    if (!usable) return { ok: false, code: "BLOCKED" };

    return {
        ok: true,
        user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: usable.role,
            onboardingCompleted: usable.onboardingCompleted,
        },
    };
}
