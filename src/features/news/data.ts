import "server-only";

/**
 * 학부모·학생 피드용 게시 NewsItem 조회.
 *
 * 호출: `/parent/news`, `/student/news`가 audience를 넘겨 NewsScreen에 넣는다.
 * audience는 본인+ALL이고 게시 기간(startsAt/endsAt) 안만 돌려준다.
 *
 * 학생은 STUDENT_YOUTH·GENERAL만 남겨 학부모용 입학·모집 공지(PARENT_ADMISSION 등)가
 * 학생 피드에 안 뜨게 한다. 필터 칩(`presentation.ts`)과 같은 카테고리 집합이다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 /notices 목록 → `notices/data.ts` (kind=NOTICE, audience=ALL).
 * - 원장 작성 UI. 이 모듈은 읽기만.
 *
 * 관련: `NewsScreen.tsx`, `types.ts`.
 */

import { prisma } from "@/lib/db";
import type { NewsItem } from "@/features/news/types";

/**
 * 역할별 체험 소식 피드.
 * STUDENT면 학부모 입학 카테고리를 where에서 빼 클라이언트 필터만으로 숨기지 않는다.
 */
export async function getPublishedNews(audience: "PARENT" | "STUDENT") {
    const now = new Date();
    const rows = await prisma.newsItem.findMany({
        where: {
            published: true,
            audience: { in: [audience, "ALL"] },
            ...(audience === "STUDENT"
                ? { category: { in: ["STUDENT_YOUTH", "GENERAL"] as const } }
                : {}),
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 50,
        select: {
            id: true,
            kind: true,
            category: true,
            audience: true,
            title: true,
            content: true,
            imageUrl: true,
            linkUrl: true,
            startsAt: true,
            endsAt: true,
            createdAt: true,
        },
    });

    return rows.map(
        (row): NewsItem => ({
            ...row,
            startsAt: row.startsAt?.toISOString() ?? null,
            endsAt: row.endsAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
        }),
    );
}
