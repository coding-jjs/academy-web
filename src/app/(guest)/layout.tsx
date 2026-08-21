/**
 * `(guest)` URL 그룹 레이아웃. `/guest/*`를 감싼다.
 *
 * `requireRole("GUEST")` 후 `MemberShell role="guest"`를 씌운다.
 * 역할 부여 전 계정은 문의(`/guest/inquiry`) 등 제한된 멤버 화면만 쓴다.
 *
 * `/guest` 자체는 공개 홈 `/`로 redirect한다. 문의는 `/guest/inquiry`.
 * proxy matcher는 `/guest/:path*`를 커버하므로 미로그인·다른 역할은 여기로 못 들어온다.
 */

import type { ReactNode } from "react"; // children 타입. 세션은 requireRole이 돌려준다.
import MemberShell from "@/components/layout/MemberShell"; // 게스트 내비. 역할 부여 전 멤버 셸.
import { requireRole } from "@/lib/auth-guard"; // proxy가 /guest를 커버. 여기서 DB 계정 재검사.

/** 온보딩 끝난 GUEST만 통과시키고 게스트 내비를 붙인다. */
export default async function GuestLayout({ children }: { children: ReactNode }) { // `/guest/*` 껍데기. /guest 자체는 / 로.
    const session = await requireRole("GUEST"); // GUEST만. 온보딩 끝난 계정은 문의 등 제한 화면만.
    return ( // 게스트 내비. /guest 자체는 page가 / 로 보낸다.
        <MemberShell role="guest" userName={session.user.name}>{/* AdminShell이 아니다. 역할 부여 전 멤버 셸. */}
            {children}{/* 문의 page 등. 게스트 대시보드는 없다. */}
        </MemberShell> // MemberShell 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
