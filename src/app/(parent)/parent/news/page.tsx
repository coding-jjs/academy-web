/**
 * `/parent/news` 학부모 뉴스/공지 피드.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getPublishedNews("PARENT")` → features `NewsScreen`.
 *
 * 공개 `/notices`와 별개다. 학부모 대상 게시만 넘긴다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학부모만.
import NewsScreen from "@/features/news/NewsScreen"; // features Screen. 원장 작성 UI는 /notices.
import { getPublishedNews } from "@/features/news/data"; // PARENT 대상 게시만. 공개 /notices와 별개.

export const dynamic = "force-dynamic"; // 게시가 캐시에 안 남게.

/** PARENT 대상 게시만 뉴스 Screen에 넘긴다. */
export default async function ParentNewsPage() { // proxy→layout→page. 공개 /notices와 별개.
    await requireRole("PARENT"); // 학부모만.
    const items = await getPublishedNews("PARENT"); // PARENT 대상 게시만. 공개 /notices와 별개.

    return <NewsScreen items={items} audience="parent" />; // features NewsScreen. 원장 작성 UI는 /notices.
} // 블록 끝.
