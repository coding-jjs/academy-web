import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StudentNewsScreen from "./StudentNewsScreen";
import type {
    NewsAudience,
    NewsCategory,
    NewsKind,
    StudentNewsItem,
} from "./StudentNewsScreen";

export const dynamic = "force-dynamic";

export default async function StudentNewsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "STUDENT") redirect("/post-login");

    const now = new Date();

    const rows = await prisma.newsItem.findMany({
        where: {
            published: true,
            audience: { in: ["STUDENT", "ALL"] },
            // 학부모 전용 카테고리는 학생 화면에 노출하지 않음
            category: { in: ["STUDENT_YOUTH", "GENERAL"] },
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

    const items: StudentNewsItem[] = rows.map((row) => ({
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

    return <StudentNewsScreen items={items} />;
}