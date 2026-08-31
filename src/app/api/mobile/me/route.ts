/**
 * `GET /api/mobile/me`. 앱이 들고 있는 Bearer의 현재 신원.
 *
 * 역할 화이트리스트를 두지 않는다. GUEST도 200으로 돌려
 * 앱이 원장 승인 대기 화면을 그릴 수 있게 한다.
 * 차단·퇴원·위조 토큰만 401.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 홈 데이터를 여기 붙이지 않는다 → 이후 dashboard 라우트.
 * - 쿠키 세션을 읽지 않는다.
 *
 * 관련: `lib/mobile-auth.ts`.
 */

import { readMobileUser, unauthorizedJson } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const user = await readMobileUser(request);
    if (!user) return unauthorizedJson();

    return Response.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
    });
}
