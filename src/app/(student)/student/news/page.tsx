import { requireRole } from "@/lib/auth-guard";
import NewsScreen from "@/features/news/NewsScreen";
import { getPublishedNews } from "@/features/news/data";

export const dynamic = "force-dynamic";

export default async function StudentNewsPage() {
    await requireRole("STUDENT");
    const items = await getPublishedNews("STUDENT");

    return <NewsScreen items={items} audience="student" />;
}
