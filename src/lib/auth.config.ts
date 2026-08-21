/**
 * NextAuth 제공자·세션·콜백 설정. `lib/auth.ts`가 이 객체를 받아 인스턴스를 만든다.
 *
 * 호출: `auth.ts`만 import한다. 페이지는 `signIn()`/`auth()`만 쓰고 이 파일을 직접 열지 않는다.
 *
 * 제공자: Google(항상) + ENABLE_DEV_LOGIN이면 @test.local Credentials.
 * 세션: JWT 8시간. `updateAge: 0`이라 슬라이딩 연장 없이 매 요청 `jwt` 콜백이 DB를 다시 본다.
 *       그래서 원장이 역할을 바꾸거나 차단하면 다음 요청부터 반영된다.
 *       JWT를 쓰는 이유: DB 세션 테이블 없이 쿠키만으로 버티되, 매 요청 DB 재조회로 무효화를 맞춘다.
 *
 * signIn 콜백이 User/OAuthAccount를 만든다. actions.ts는 signIn()만 호출한다.
 * intent 쿠키(login vs signup)로 "기존 회원만" vs "없으면 GUEST 생성"을 가른다.
 *
 * 서버 전용. 읽기(jwt/session)와 쓰기(signIn에서 User·OAuthAccount upsert)가 섞여 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 비밀번호 Credentials를 프로덕션에 두지 않는다 → Google 전제, 개발만 @test.local.
 * - BLOCKED를 여기서 삭제하지 않는다 → 로그인만 거절, 행은 남긴다.
 * - 역할 홈으로 보내지 않는다 → `/post-login` + `getRoleHomePath`.
 * - 온보딩 폼을 받지 않는다 → `signup/actions.ts`.
 *
 * 관련: `auth.ts`, `oauth-intent.ts`, `dev-login.ts`, `account-access.ts`.
 */

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

/**
 * JWT에서 신원만 지워 GUEST로 되돌린다. 쿠키 자체는 maxAge까지 남는다.
 * 쿠키를 즉시 삭제하지 않는 이유: jwt 콜백은 토큰만 고칠 수 있고 Set-Cookie로
 * 세션을 끊는 건 signOut의 일이다. 신원을 비우면 proxy/requireRole이 미로그인으로 본다.
 */
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
                      /**
                       * 개발 Credentials 검증. 비밀번호가 아니라 @test.local 이메일만 받는다.
                       * 모듈 로드 때가 아니라 콜백 시점에도 플래그를 다시 본다.
                       * 빌드 후 env가 꺼졌는데 제공자 배열에 남아 authorize만 타는 경우를 막음.
                       *
                       * @returns 세션에 실을 최소 User. null이면 CredentialsSignin.
                       */
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
        /**
         * 세션 쿠키를 만들기 직전. false/에러 URL이면 JWT를 발급하지 않는다.
         * Google 경로에서 User·OAuthAccount를 여기서 만든다 — actions.ts는 signIn()만 호출한다.
         */
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
        /**
         * 매 요청 토큰 재작성. updateAge:0 이라 여기로 온다.
         * 이메일을 키로 DB를 보고, 사용 불가면 신원만 비운다 (쿠키 삭제는 하지 않음).
         */
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
        /**
         * 클라이언트가 받는 session.user. JWT에 심은 id/role/onboarding만 복사한다.
         * 여기서 DB를 치지 않는 이유: jwt 콜백이 방금 재검사했고, session은 매 렌더마다 불린다.
         */
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
