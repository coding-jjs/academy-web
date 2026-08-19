/**
 * `/student/news` 학생 뉴스 피드.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getPublishedNews("STUDENT")` → features `NewsScreen`.
 *
 * 공개 `/notices`와 별개다. 학생 대상 게시만 넘긴다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학생만.
import NewsScreen from "@/features/news/NewsScreen"; // features Screen. 원장 작성 UI는 /notices.
import { getPublishedNews } from "@/features/news/data"; // STUDENT 대상 게시만. 공개 /notices와 별개.

export const dynamic = "force-dynamic"; // 게시가 캐시에 안 남게.

/** STUDENT 대상 게시만 뉴스 Screen에 넘긴다. */
export default async function StudentNewsPage() { // proxy→layout→page. 공개 /notices와 별개.
    await requireRole("STUDENT"); // 학생만.
    const items = await getPublishedNews("STUDENT"); // STUDENT 대상 게시만. 공개 /notices와 별개.

    return <NewsScreen items={items} audience="student" />; // features NewsScreen. 원장 작성 UI는 /notices.
} // 블록 끝.
