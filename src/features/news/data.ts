import "server-only";

import { prisma } from "@/lib/db";
import type { NewsItem } from "@/features/news/types";

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
