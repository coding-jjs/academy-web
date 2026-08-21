import "server-only";

/**
 * 게시된 공개 공지 조회. kind=NOTICE·published·audience=ALL만 돌려 /notices와 홈에 쓴다.
 *
 * 호출: `/notices`가 getPublishedNotices, `/`(홈)이 getHomeNotices.
 * getHomeNotices는 같은 목록을 3건으로 잘라 홈 미리보기와 목록이 어긋나지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 피드 → `news/data.ts` (audience·카테고리·게시 기간).
 * - 미게시·특정 audience 공지를 공개 목록에 넣지 않음.
 *
 * 관련: `types.ts`, `actions.ts`.
 */

import { prisma } from "@/lib/db";
import {
    NOTICE_AUDIENCE_LABELS,
    formatNoticeListDate,
    type Notice,
} from "@/features/notices/types";

function mapNotice(row: {
    id: string;
    audience: string;
    title: string;
    content: string | null;
    createdAt: Date;
    imageUrl: string | null;
}): Notice {
    return {
        id: row.id,
        audience: NOTICE_AUDIENCE_LABELS[row.audience] ?? "전체",
        title: row.title,
        date: formatNoticeListDate(row.createdAt),
        body: row.content?.trim() || "내용이 없습니다.",
        imageUrl: row.imageUrl,
    };
}

/**
 * 공개 /notices용 공지 목록. 기본 200건.
 */
export async function getPublishedNotices(limit = 200): Promise<Notice[]> {
    const rows = await prisma.newsItem.findMany({
        where: {
            kind: "NOTICE",
            published: true,
            audience: "ALL",
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        select: {
            id: true,
            audience: true,
            title: true,
            content: true,
            createdAt: true,
            imageUrl: true,
        },
    });

    return rows.map(mapNotice);
}

/**
 * 홈 미리보기. 같은 쿼리를 limit만 줄여 목록 첫 화면과 내용이 갈라지지 않게 한다.
 */
export async function getHomeNotices(limit = 3): Promise<Notice[]> {
    return getPublishedNotices(limit);
}
