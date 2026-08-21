/**
 * NextAuth 인스턴스 진입점. 설정 객체는 `auth.config.ts`에 두고,
 * 앱은 이 파일이 re-export하는 `auth` / `signIn` / `signOut` / `handlers`만 쓴다.
 *
 * 호출:
 * - `app/api/auth/[...nextauth]/route.ts` → `handlers` (Google 콜백 URL)
 * - `proxy.ts`, `auth-guard.ts`, 레이아웃·페이지 → `auth()` (세션 읽기)
 * - `features/auth/actions.ts` → `signIn` (로그인/가입 버튼)
 * - `app/(auth)/logout/action.ts` → `signOut`
 *
 * 서버 전용. 클라이언트가 NextAuth 설정을 import하지 않게 이 파일만 공개한다.
 * 쓰기는 signIn/signOut이 쿠키·JWT를 만들고, `auth()`는 읽기만 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 제공자·콜백 로직을 여기 두지 않는다 → `auth.config.ts`.
 * - User 행을 만들지 않는다 → signIn 콜백.
 * - 역할 URL 가드를 하지 않는다 → `proxy.ts` / `requireRole`.
 *
 * 관련: `auth.config.ts`, `oauth-intent.ts`, `account-access.ts`, `types/next-auth.d.ts`.
 */

import NextAuth from "next-auth";
import authConfig from "./auth.config";

/** Auth.js 핸들러·세션 헬퍼. 설정은 authConfig, 앱은 이 네 이름만 import한다. */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
