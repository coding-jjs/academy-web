/**
 * 개발 로그인 목록에만 쓰는 얇은 사용자 타입.
 *
 * 호출: `features/auth/data.ts`의 `getDevelopmentTestUsers`가 Prisma select 결과를
 * 이 형태로 돌려주고, `(auth)/login/page.tsx`가 테스트 계정 select에 넘긴다.
 *
 * 의도적으로 하지 않는 일:
 * - Prisma User 전체(주소·전화·온보딩 시각 등)를 노출하지 않는다.
 * - 운영 로그인 UI의 세션 사용자 타입을 대체하지 않는다 → NextAuth `session.user`.
 *
 * 관련: `features/auth/data.ts`, `lib/dev-login.ts`, `features/auth/actions.ts`(테스트 로그인).
 */

import type { AppRole } from "@/types/roles"; // select 라벨용. JWT session.user.role을 대체하지 않는다.

/**
 * 개발 환경 로그인 화면에 그리는 한 줄.
 * 이메일은 Credentials 개발 프로바이더가 그대로 받고, 역할은 버튼 라벨용이다.
 */
export type DevelopmentTestUser = { // 개발 select 한 줄. Prisma User 전체가 아니다.
    email: string; // Credentials `signInAsTestUser`가 그대로 받는 @test.local.
    name: string; // 로그인 select 라벨. 온보딩 이름과 같다.
    role: AppRole; // 버튼 옆 역할 표시. JWT를 대체하지 않는다.
};
