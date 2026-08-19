import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { JWT } from "@auth/core/jwt";
import { getUsableAccount, getUsableAccountByEmail } from "@/lib/account-access";
import { prisma } from "@/lib/db";
import {
    DEV_LOGIN_PROVIDER_ID,
    DEV_LOGIN_ROLES,
    isDevLoginEnabled,
    parseDevTestEmail,
} from "@/lib/dev-login";
import { clearOAuthIntent, readOAuthIntent } from "@/lib/oauth-intent";

function clearAccessToken(token: JWT) {
    token.userId = undefined;
    token.role = "GUEST";
    token.onboardingCompleted = false;
    token.email = undefined;
    token.name = undefined;
    token.picture = undefined;
    return token;
}

const authConfig = {
    trustHost: true,
    providers: [
        Google({
            authorization: {
                params: {
                    prompt: "select_account",
                },
            },
        }),
        ...(isDevLoginEnabled()
            ? [
                  Credentials({
                      id: DEV_LOGIN_PROVIDER_ID,
                      name: "개발 테스트 계정",
                      credentials: {
                          email: { label: "테스트 계정", type: "email" },
                      },
                      async authorize(credentials) {
                          if (!isDevLoginEnabled()) return null;

                          const email = parseDevTestEmail(credentials.email);
                          if (!email) return null;

                          const user = await prisma.user.findFirst({
                              where: {
                                  email,
                                  role: { in: [...DEV_LOGIN_ROLES] },
                              },
                              select: {
                                  id: true,
                                  email: true,
                                  name: true,
                                  imageUrl: true,
                              },
                          });

                          if (!user) return null;

                          const usable = await getUsableAccount(user.id);
                          if (!usable) return null;

                          await prisma.user.update({
                              where: { id: user.id },
                              data: { lastLoginAt: new Date() },
                          });

                          return {
                              id: user.id,
                              email: user.email,
                              name: user.name,
                              image: user.imageUrl,
                          };
                      },
                  }),
              ]
            : []),
    ],

    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 8,
        updateAge: 0,
    },

    pages: {
        signIn: "/login",
    },

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === DEV_LOGIN_PROVIDER_ID) {
                return (
                    isDevLoginEnabled() &&
                    parseDevTestEmail(user.email) !== null
                );
            }

            if (
                !user.email ||
                !account ||
                account.provider !== "google" ||
                !account.providerAccountId
            ) {
                return false;
            }

            const email = user.email.trim().toLowerCase();
            const intent = await readOAuthIntent();
            await clearOAuthIntent();

            const existing = await prisma.user.findUnique({
                where: { email },
                select: { id: true },
            });

            if (existing) {
                const usable = await getUsableAccount(existing.id);
                if (!usable) return "/login?error=Blocked";
            } else if (intent !== "signup") {
                return "/login?error=Unregistered";
            }

            const dbUser = existing
                ? await prisma.user.update({
                      where: { id: existing.id },
                      data: {
                          imageUrl: user.image,
                          lastLoginAt: new Date(),
                      },
                  })
                : await prisma.user.create({
                      data: {
                          email,
                          name: user.name?.trim() || email.split("@")[0],
                          imageUrl: user.image,
                          lastLoginAt: new Date(),
                      },
                  });

            const accountKey = {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
            };

            const existingAccount = await prisma.oAuthAccount.findUnique({
                where: {
                    provider_providerAccountId: accountKey,
                },
            });

            if (existingAccount && existingAccount.userId !== dbUser.id) {
                return false;
            }

            await prisma.oAuthAccount.upsert({
                where: {
                    provider_providerAccountId: accountKey,
                },
                create: {
                    userId: dbUser.id,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                },
                update: {
                    updatedAt: new Date(),
                },
            });

            return true;
        },
        async jwt({ token }) {
            const email = token.email?.trim().toLowerCase();

            if (!email) {
                return clearAccessToken(token);
            }

            const dbUser = await getUsableAccountByEmail(email);

            if (!dbUser) {
                return clearAccessToken(token);
            }

            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.onboardingCompleted = dbUser.onboardingCompleted;
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId ?? "";
                session.user.role = token.role ?? "GUEST";
                session.user.onboardingCompleted =
                    token.onboardingCompleted ?? false;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;

export default authConfig;
