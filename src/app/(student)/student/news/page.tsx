/**
 * `/student/news` 학생 뉴스 피드.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getPublishedNews("STUDENT")` → features `NewsScreen`.
 *
 * 공개 `/notices`와 별개다. 학생 대상 게시만 넘긴다.
 */

import { requireRole } from "@/lib/auth-guard";
import NewsScreen from "@/features/news/NewsScreen";
import { getPublishedNews } from "@/features/news/data";

export const dynamic = "force-dynamic";

/** STUDENT 대상 게시만 뉴스 Screen에 넘긴다. */
export default async function StudentNewsPage() {
    await requireRole("STUDENT");
    const items = await getPublishedNews("STUDENT");

    return <NewsScreen items={items} audience="student" />;
}
