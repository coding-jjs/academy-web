import "server-only"; // 읽기 전용. 로그인 쓰기는 actions.signInAsTestUser.

/**
 * 개발 로그인 화면에 보여줄 @test.local ACTIVE 사용자 목록을 읽는다.
 *
 * 호출: `(auth)/login/page.tsx`가 서버 컴포넌트에서 불러 select options를 만든다.
 * 전제: `isDevLoginEnabled()`가 켜진 로컬/스테이징에서만 의미가 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 운영에서 테스트 계정을 노출하지 않는다 → 플래그가 꺼지면 빈 배열.
 * - BLOCKED/INACTIVE 계정은 고르지 않는다 → 로그인해도 막히는 행을 보여 주지 않기 위함.
 * - 비밀번호를 읽거나 만들지 않는다 → 개발 프로바이더가 이메일만 받는다.
 *
 * 관련: `features/auth/types.ts`, `lib/dev-login.ts`, `features/auth/actions.ts`.
 */

import { prisma } from "@/lib/db"; // select만. Credentials 로그인은 actions가 친다.
import { // 플래그·역할 집합. 운영에서 목록을 숨기는 기준.
    DEV_LOGIN_ROLES, // 개발 프로바이더가 허용하는 역할만 목록에 올린다.
    isDevLoginEnabled, // 꺼져 있으면 Prisma를 치지 않는다.
} from "@/lib/dev-login"; // actions.parseDevTestEmail과 같은 허용 집합.
import type { DevelopmentTestUser } from "@/features/auth/types"; // 이메일·이름·역할만. User 전체가 아니다.

/**
 * 개발 로그인용 테스트 계정 목록.
 *
 * @returns 이메일·이름·역할만. 운영이거나 플래그 off면 `[]`.
 * @sideEffects 없음. 읽기 전용.
 */
export async function getDevelopmentTestUsers(): Promise< // 화면 select용. 쓰기는 signInAsTestUser.
    DevelopmentTestUser[] // 비밀번호·주소는 없다. Credentials는 이메일만 받는다.
> { // 플래그 off면 빈 배열. Prisma를 치지 않아 테스트 계정을 숨긴다.
    if (!isDevLoginEnabled()) return []; // 운영·플래그 off면 Prisma를 치지 않아 테스트 계정을 숨긴다.

    return prisma.user.findMany({ // 읽기만. BLOCKED 행을 골라 로그인 실패를 보여 주지 않는다.
        where: { // ACTIVE + @test.local + 허용 역할. 실제 Google 이메일은 섞지 않는다.
            status: "ACTIVE", // BLOCKED/INACTIVE는 골라도 로그인에서 막히므로 목록에 안 올린다.
            email: { endsWith: "@test.local" }, // 실제 Google 이메일은 개발 select에 섞지 않는다.
            role: { in: [...DEV_LOGIN_ROLES] }, // 개발 프로바이더가 허용하는 역할만.
        },
        orderBy: [{ role: "asc" }, { name: "asc" }], // 역할 묶음 뒤 이름순. 화면 select와 맞춘다.
        select: { email: true, name: true, role: true }, // 비밀번호·주소는 안 내린다. Credentials는 이메일만.
    });
}
