/**
 * `GET /api/mobile/student/news`. 학생 소식 피드.
 *
 * 학부모 입학·모집 카테고리는 `getPublishedNews("STUDENT")`가 이미 뺀다.
 *
 * 관련: `features/news/data.ts`.
 */

import { getPublishedNews } from "@/features/news/data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "STUDENT");
    if (!auth.ok) return auth.response;

    const items = await getPublishedNews("STUDENT");
    return Response.json({ items });
}
