/**
 * `GET /api/mobile/parent/news`. 학부모 소식 피드.
 *
 * audience는 PARENT로 고정. 클라이언트가 바꾸지 못한다.
 *
 * 관련: `features/news/data.ts`.
 */

import { getPublishedNews } from "@/features/news/data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const items = await getPublishedNews("PARENT");
    return Response.json({ items });
}
