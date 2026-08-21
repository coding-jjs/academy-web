/**
 * NextAuth Session/JWT 모듈 보강.
 * `id`·`role`·`onboardingCompleted`를 세션에 실어 layout/page가 매번 User 테이블을
 * 치지 않게 한다. 값은 `auth.config.ts` jwt 콜백이 DB에서 채운다.
 *
 * 호출: 타입만. `auth()` 반환값과 JWT 콜백 인자에 붙는다.
 * 런타임 코드 없음. 클라이언트 컴포넌트의 `useSession` 타입에도 같은 필드가 보인다.
 *
 * JWT 필드는 optional이다. `clearAccessToken`이 신원만 지울 때 undefined가 되고,
 * session 콜백이 빈 문자열/GUEST/false로 내려 준다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한 키 맵을 세션에 넣지 않는다. grant는 요청마다 `userHasPermission`이 DB를 본다
 *   (원장이 방금 끈 billing이 JWT maxAge 동안 남는 것을 막기 위함).
 * - BLOCKED 플래그를 세션에 두지 않는다. 사용 불가면 jwt가 신원을 비운다.
 *
 * 관련: `auth.config.ts`, `types/roles.ts`, `account-access.ts`.
 */

import type { DefaultSession } from "next-auth";
import type { AppRole } from "./roles";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: AppRole;
            onboardingCompleted: boolean;
        } & DefaultSession["user"];
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        userId?: string;
        role?: AppRole;
        onboardingCompleted?: boolean;
    }
}
