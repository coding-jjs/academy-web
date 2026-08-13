import type { Metadata } from "next";
import NoticesScreen from "@/features/notices/NoticesScreen";
import { getPublishedNotices } from "@/features/notices/data";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
    title: "공지사항 · A학원",
    description: "A학원의 주요 안내와 학사 일정을 확인합니다.",
};

export default async function NoticesPage() {
    const [session, notices] = await Promise.all([
        auth(),
        getPublishedNotices(),
    ]);
    const canWrite = session?.user?.role === "DIRECTOR";

    return <NoticesScreen initialNotices={notices} canWrite={canWrite} />;
}
