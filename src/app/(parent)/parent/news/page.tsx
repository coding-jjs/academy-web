/**
 * `/parent/news` 학부모 뉴스/공지 피드.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getPublishedNews("PARENT")` → features `NewsScreen`.
 *
 * 공개 `/notices`와 별개다. 학부모 대상 게시만 넘긴다.
 */

import { requireRole } from "@/lib/auth-guard";
import NewsScreen from "@/features/news/NewsScreen";
import { getPublishedNews } from "@/features/news/data";

export const dynamic = "force-dynamic";

/** PARENT 대상 게시만 뉴스 Screen에 넘긴다. */
export default async function ParentNewsPage() {
    await requireRole("PARENT");
    const items = await getPublishedNews("PARENT");

    return <NewsScreen items={items} audience="parent" />;
}
