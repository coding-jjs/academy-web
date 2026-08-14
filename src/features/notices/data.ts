import "server-only";

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

export async function getHomeNotices(limit = 3): Promise<Notice[]> {
    return getPublishedNotices(limit);
}
