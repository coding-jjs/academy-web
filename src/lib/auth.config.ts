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

import type { NextAuthConfig } from "next-auth"; // lib/auth.ts만 이 객체를 받는다.
import Credentials from "next-auth/providers/credentials"; // 개발 @test.local만. 프로덕션 비밀번호 없음.
import Google from "next-auth/providers/google"; // 항상. Apple 등 다른 제공자는 아직 받지 않는다.
import type { JWT } from "@auth/core/jwt"; // clearAccessToken이 신원만 지운다. 쿠키 삭제는 signOut.
import { getUsableAccount, getUsableAccountByEmail } from "@/lib/account-access"; // BLOCKED/WITHDRAWN이면 JWT를 만들지 않는다.
import { prisma } from "@/lib/db"; // signIn이 User·OAuthAccount를 만든다. jwt는 getUsableAccount.
import { // 이름만 가져온다. 역할 가드는 proxy·requireRole.
    DEV_LOGIN_PROVIDER_ID, // JWT 8h updateAge 0. Google+개발 Credentials.
    DEV_LOGIN_ROLES, // JWT 8h updateAge 0. Google+개발 Credentials.
    isDevLoginEnabled, // JWT 8h updateAge 0. Google+개발 Credentials.
    parseDevTestEmail, // JWT 8h updateAge 0. Google+개발 Credentials.
} from "@/lib/dev-login"; // @test.local만. Gmail을 Credentials로 받지 않는다.
import { clearOAuthIntent, readOAuthIntent } from "@/lib/oauth-intent"; // 로그인 vs 가입. 한 번 읽고 바로 지운다.

/**
 * JWT에서 신원만 지워 GUEST로 되돌린다. 쿠키 자체는 maxAge까지 남는다.
 * 쿠키를 즉시 삭제하지 않는 이유: jwt 콜백은 토큰만 고칠 수 있고 Set-Cookie로
 * 세션을 끊는 건 signOut의 일이다. 신원을 비우면 proxy/requireRole이 미로그인으로 본다.
 */
function clearAccessToken(token: JWT) { // BLOCKED/퇴원 확정. 행은 남긴다. 쿠키 maxAge까지.
    token.userId = undefined; // 쿠키는 maxAge까지 남긴다. jwt 콜백은 Set-Cookie로 끊을 수 없어 신원만 지운다.
    token.role = "GUEST"; // proxy가 업무 URL을 역할 불일치로 본다.
    token.onboardingCompleted = false; // signup 분기를 타지 않게. 미로그인으로 본다.
    token.email = undefined; // 다음 jwt가 이메일을 키로 DB를 못 보게.
    token.name = undefined; // 화면에 옛 이름이 남지 않게.
    token.picture = undefined; // Google 사진도 비운다.
    return token; // 쿠키는 남는다. signOut이 Set-Cookie로 끊는다.
}

const authConfig = { // NextAuthConfig. 페이지는 auth()/signIn()만.
    trustHost: true, // 배포 호스트가 AUTH_URL과 달라도 콜백을 받는다. 학원 내부 도메인·프록시 전제.
    providers: [ // Google 항상 + 개발이면 Credentials.
        Google({ // 항상. 온보딩 폼은 signup/actions.
            authorization: { // 매번 계정 선택. 학원 PC에서 이전 Google 세션이 자동 로그인되는 것을 막는다.
                params: { // select_account. 자동 로그인을 막는다.
                    prompt: "select_account", // 매번 계정 선택. 학원 PC에서 이전 Google 세션이 자동 로그인되는 것을 막는다.
                },
            },
        }),
        ...(isDevLoginEnabled() // 모듈 로드 시점. 프로덕션 빌드에 제공자가 들어가지 않게.
            ? [ // 개발 + 플래그. 비밀번호 없음.
                  Credentials({ // @test.local만. authorize가 한 번 더 플래그를 본다.
                      id: DEV_LOGIN_PROVIDER_ID, // Google과 섞이지 않게. signIn 콜백이 id를 한 번 더 검사한다.
                      name: "개발 테스트 계정", // 로그인 페이지 select.
                      credentials: { // 비밀번호 필드 없음.
                          email: { label: "테스트 계정", type: "email" }, // 비밀번호 없음. 시드된 @test.local 행이면 세션.
                      },
                      /**
                       * 개발 Credentials 검증. 비밀번호가 아니라 @test.local 이메일만 받는다.
                       * 모듈 로드 때가 아니라 콜백 시점에도 플래그를 다시 본다.
                       * 빌드 후 env가 꺼졌는데 제공자 배열에 남아 authorize만 타는 경우를 막음.
                       *
                       * @returns 세션에 실을 최소 User. null이면 CredentialsSignin.
                       */
                      async authorize(credentials) { // 비밀번호 없음. 시드 행이면 세션.
                          if (!isDevLoginEnabled()) return null; // 모듈 로드 때가 아니라 콜백 시점에도 플래그를 다시 본다.

                          const email = parseDevTestEmail(credentials.email); // @test.local만. 실서비스 이메일을 Credentials로 넣지 못하게.
                          if (!email) return null; // Gmail/@학원 도메인은 이 경로로 받지 않는다.

                          const user = await prisma.user.findFirst({ // DEV_LOGIN_ROLES 안의 역할만. 시드에 없거나 역할이 빠진 행은 거절.
                              where: { // @test.local + 역할 in.
                                  email, // parseDevTestEmail을 통과한 값만.
                                  role: { in: [...DEV_LOGIN_ROLES] }, // 역할이 비정상이면 시드 이메일이어도 거절.
                              },
                              select: { // 세션에 실을 최소. 역할은 jwt 콜백이 DB에서 채운다.
                                  id: true, // JWT userId.
                                  email: true, // jwt가 이메일을 키로 재조회.
                                  name: true, // 셸 헤더.
                                  imageUrl: true, // JWT picture.
                              },
                          });

                          if (!user) return null; // 시드에 없거나 역할이 빠짐.

                          const usable = await getUsableAccount(user.id); // BLOCKED/퇴원 확정이면 JWT를 만들지 않는다.
                          if (!usable) return null; // 행은 남긴다. 로그인만 거절.

                          await prisma.user.update({ // 개발 로그인도 lastLoginAt을 찍어 원장 화면의 "마지막 로그인"과 맞춘다.
                              where: { id: user.id }, // 시드 User.
                              data: { lastLoginAt: new Date() }, // Google 경로와 같은 lastLoginAt.
                          });

                          return { // 세션에 실을 최소. 역할은 jwt 콜백이 DB에서 채운다.
                              id: user.id, // JWT userId.
                              email: user.email, // jwt 재조회 키.
                              name: user.name, // 셸.
                              image: user.imageUrl, // JWT picture. 역할은 jwt 콜백이 DB에서 채운다.
                          };
                      },
                  }),
              ] // 개발 제공자 배열.
            : []), // 프로덕션·플래그 끄면 Google만.
    ], // providers 끝.

    session: { // DB 세션 테이블 없이 쿠키. 매 요청 jwt가 User를 다시 본다.
        strategy: "jwt", // DB 세션 테이블 없이 쿠키. 매 요청 jwt가 User를 다시 본다.
        maxAge: 60 * 60 * 8, // 8시간. 학원 근무 하루를 덮되, 무기한 슬라이딩은 하지 않는다.
        updateAge: 0, // 슬라이딩 연장 없이 매 요청 jwt 콜백에서 계정 재검사
    },

    pages: { // Auth.js 기본 /api/auth/signin 대신 학원 로그인 UI.
        signIn: "/login", // Auth.js 기본 /api/auth/signin 대신 학원 로그인 UI.
    },

    callbacks: { // signIn이 User를 만들고, jwt가 매 요청 DB를 다시 본다.
        /**
         * 세션 쿠키를 만들기 직전. false/에러 URL이면 JWT를 발급하지 않는다.
         * Google 경로에서 User·OAuthAccount를 여기서 만든다 — actions.ts는 signIn()만 호출한다.
         */
        async signIn({ user, account }) { // JWT 발급 직전. 역할 홈은 /post-login.
            if (account?.provider === DEV_LOGIN_PROVIDER_ID) { // authorize를 통과했어도 제공자 id를 한 번 더 막아 다른 Credentials 혼입을 차단.
                return ( // 플래그+@test.local만. 아니면 JWT를 만들지 않는다.
                    isDevLoginEnabled() && // JWT 8h updateAge 0. Google+개발 Credentials.
                    parseDevTestEmail(user.email) !== null // Gmail을 Credentials로 받지 않는다.
                );
            }

            if ( // JWT 8h updateAge 0. Google+개발 Credentials.
                !user.email || // 이메일 없는 Google은 거부.
                !account || // 계정 없는 콜백은 거부.
                account.provider !== "google" || // Apple 등 다른 제공자를 아직 받지 않는다.
                !account.providerAccountId // Google이 아니거나 이메일이 없으면 거부. Apple 등 다른 제공자를 아직 받지 않는다.
            ) { // 최소 신원 없음.
                return false; // JWT를 발급하지 않는다.
            }

            const email = user.email.trim().toLowerCase(); // User.email 키. 폼 값이 아니다.

            const intent = await readOAuthIntent(); // 로그인 vs 가입. 쿠키는 한 번 읽고 바로 지워 재사용을 막는다.
            await clearOAuthIntent(); // 남으면 가입 intent가 다음 로그인에 재사용된다.

            const existing = await prisma.user.findUnique({ // 기존 회원. BLOCKED면 아래에서 거절.
                where: { email }, // 소문자 trim.
                select: { id: true }, // getUsableAccount가 나머지를 본다.
            });

            if (existing) { // 기존 회원. 역할/상태는 원장 부여값을 덮지 않는다.
                const usable = await getUsableAccount(existing.id); // BLOCKED/퇴원 확정이면 JWT를 만들지 않고 /login?error=Blocked 로 UI 문구를 붙인다.
                if (!usable) return "/login?error=Blocked"; // 행은 남긴다. 로그인만 거절.
            } else if (intent !== "signup") { // 로그인 버튼만으로 학원 외부인이 GUEST를 열지 못하게.
                return "/login?error=Unregistered"; // 가입 버튼(intent=signup)만 신규 GUEST.
            }

            const dbUser = existing // JWT 8h updateAge 0. Google+개발 Credentials.
                ? await prisma.user.update({ // 기존이면 사진·lastLogin만. 역할/상태는 원장 부여값을 덮지 않는다.
                      where: { id: existing.id }, // 기존 User.
                      data: { // 프로필 사진·로그인 시각만.
                          imageUrl: user.image, // Google 사진.
                          lastLoginAt: new Date(), // 원장 화면 "마지막 로그인".
                      },
                  })
                : await prisma.user.create({ // 가입 intent일 때만 GUEST. 온보딩 폼은 signup/actions.
                      data: { // role 기본 GUEST. 원장이 assignUserRole.
                          email, // 소문자. 폼이 아니다.
                          name: user.name?.trim() || email.split("@")[0], // Google 이름. 없으면 로컬 파트.
                          imageUrl: user.image, // Google 사진.
                          lastLoginAt: new Date(), // 가입 직후 로그인 시각.
                      },
                  });

            const accountKey = { // Google 계정 한 줄. 다른 User에 묶여 있으면 충돌.
                provider: account.provider, // google.
                providerAccountId: account.providerAccountId, // Google 계정 한 줄. 다른 User에 묶여 있으면 충돌.
            };

            const existingAccount = await prisma.oAuthAccount.findUnique({ // 같은 Google이 다른 User에 묶여 있는지.
                where: { // provider + providerAccountId.
                    provider_providerAccountId: accountKey, // unique.
                },
            });

            if (existingAccount && existingAccount.userId !== dbUser.id) { // 같은 Google이 다른 User에 묶여 있으면 세션을 만들지 않는다.
                return false; // JWT를 발급하지 않는다. 이메일을 덮지 않는다.
            }

            await prisma.oAuthAccount.upsert({ // 기존 링크는 updatedAt만. 신규면 이 User에 붙인다.
                where: { // unique 키.
                    provider_providerAccountId: accountKey, // Google 계정 한 줄.
                },
                create: { // 신규 링크. 이 User에 붙인다.
                    userId: dbUser.id, // 방금 upsert한 User.
                    type: account.type, // oauth.
                    provider: account.provider, // google.
                    providerAccountId: account.providerAccountId, // Google sub.
                },
                update: { // 기존 링크는 시각만.
                    updatedAt: new Date(), // 재로그인. userId는 안 바꾼다.
                },
            });

            return true; // JWT 발급. 역할 홈은 /post-login.
        },
        /**
         * 매 요청 토큰 재작성. updateAge:0 이라 여기로 온다.
         * 이메일을 키로 DB를 보고, 사용 불가면 신원만 비운다 (쿠키 삭제는 하지 않음).
         */
        async jwt({ token }) { // 매 요청. 원장 역할 변경·차단이 다음 요청에 반영되게.
            const email = token.email?.trim().toLowerCase(); // jwt 재조회 키. 폼 값이 아니다.

            if (!email) { // 이메일 없는 토큰은 신원만 비운다. 쿠키 삭제는 signOut의 일.
                return clearAccessToken(token); // proxy/requireRole이 미로그인으로 본다.
            }

            const dbUser = await getUsableAccountByEmail(email); // JWT의 옛 role을 믿지 않는다. 원장 역할 변경·차단이 다음 요청에 반영되게.

            if (!dbUser) { // BLOCKED/퇴원 확정. 행은 남긴다.
                return clearAccessToken(token); // BLOCKED/퇴원 확정. 행은 남긴다.
            }

            token.userId = dbUser.id; // requireRole이 한 번 더 DB와 맞춘다.
            token.role = dbUser.role; // requireRole이 한 번 더 DB와 맞춘다.
            token.onboardingCompleted = dbUser.onboardingCompleted; // signup 분기. 역할 부여와는 별개.
            return token; // 권한 키 맵은 JWT에 싣지 않는다. userHasPermission이 요청마다 grant를 본다.
        },
        /**
         * 클라이언트가 받는 session.user. JWT에 심은 id/role/onboarding만 복사한다.
         * 여기서 DB를 치지 않는 이유: jwt 콜백이 방금 재검사했고, session은 매 렌더마다 불린다.
         */
        async session({ session, token }) { // 매 렌더. jwt가 방금 재검사한 값만 복사.
            if (session.user) { // 세션 유저가 있을 때만. 권한 키 맵은 세션에 없다.
                session.user.id = token.userId ?? ""; // jwt가 방금 재검사한 id/role/onboarding만. 여기서 DB를 치지 않는다.
                session.user.role = token.role ?? "GUEST"; // 권한 키 맵은 세션에 없다.
                session.user.onboardingCompleted = // JWT 8h updateAge 0. Google+개발 Credentials.
                    token.onboardingCompleted ?? false; // 없으면 false. GUEST 온보딩 전.
            }
            return session; // layout/page가 이 값을 쓴다. requireRole이 DB로 다시 덮는다.
        },
    },
} satisfies NextAuthConfig; // 타입 검사. 런타임은 lib/auth.ts.

export default authConfig; // lib/auth.ts만 import. 페이지는 auth()/signIn()만.
