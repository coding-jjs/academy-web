import { requireRole } from "@/lib/auth-guard";
import NewsScreen from "@/features/news/NewsScreen";
import { getPublishedNews } from "@/features/news/data";

export const dynamic = "force-dynamic";

export default async function ParentNewsPage() {
    await requireRole("PARENT");
    const items = await getPublishedNews("PARENT");

    return <NewsScreen items={items} audience="parent" />;
}
