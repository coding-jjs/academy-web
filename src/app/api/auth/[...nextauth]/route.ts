/**
 * Auth.js App Router 핸들러. `/api/auth/*` (signin, callback, session, csrf).
 *
 * `handlers`만 재export해 NextAuth가 콜백 URL을 이 경로에 붙이게 한다.
 * Google OAuth·세션 쿠키 로직은 `@/lib/auth`에 있다.
 *
 * proxy matcher에 `/api/auth`는 없다. 로그인 콜백이 막히지 않게 공개로 둔다.
 * 시크릿(AUTH_SECRET, Google client secret)은 env에만 두고 이 파일에 하드코딩하지 않는다.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
