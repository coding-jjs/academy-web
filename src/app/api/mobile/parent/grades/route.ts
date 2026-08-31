/**
 * `GET /api/mobile/parent/grades`. 자녀 성적·오답 열람.
 *
 * 웹 `/parent/grades`와 같다. 쓰기는 없다. 학부모는 오답 이미지 URL이 아니라 imageCount만.
 *
 * 관련: `features/grades/viewer-data.ts`.
 */

import { getParentGradesChildren } from "@/features/grades/viewer-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const children = await getParentGradesChildren(auth.user.id);
    return Response.json({ children });
}
