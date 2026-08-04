import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ParentNewsScreen from "@/app/(parent)/parent/news/ParentNewsScreen";
import type {
    NewsAudience,
    NewsCategory,
    NewsKind,
    ParentNewsItem,
} from "@/app/(parent)/parent/news/ParentNewsScreen";

export const dynamic = "force-dynamic";

export default async function ParentNewsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

    const now = new Date();

    const rows = await prisma.newsItem.findMany({
        where: {
            published: true,
            audience: { in: ["PARENT", "ALL"] },
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [
                {
                    OR: [{ endsAt: null }, { endsAt: { gte: now } }],
                },
            ],
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

    const items: ParentNewsItem[] = rows.map((row) => ({
        id: row.id,
        kind: row.kind as NewsKind,
        category: row.category as NewsCategory,
        audience: row.audience as NewsAudience,
        title: row.title,
        content: row.content,
        imageUrl: row.imageUrl,
        linkUrl: row.linkUrl,
        startsAt: row.startsAt?.toISOString() ?? null,
        endsAt: row.endsAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
    }));

    return <ParentNewsScreen items={items} />;
}