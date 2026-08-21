/**
 * 공개 공지 목록 `/notices`.
 *
 * 누구나 연다. `requireRole` 없음. proxy matcher 밖이라 미로그인도 읽는다.
 * 흐름: `auth()` + `getPublishedNotices()` → `NoticesScreen`.
 * 원장(DIRECTOR) 세션이면 `canWrite`로 작성 UI를 연다.
 *
 * 의도적으로 하지 않는 일:
 * - 역할별 뉴스 피드(`/parent/news` `/student/news`)를 대신하지 않는다.
 * - 교사·직원이 공지를 쓰게 하지 않는다.
 */

import type { Metadata } from "next";
import NoticesScreen from "@/features/notices/NoticesScreen";
import { getPublishedNotices } from "@/features/notices/data";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
    title: "공지사항 · A학원",
    description: "A학원의 주요 안내와 학사 일정을 확인합니다.",
};

/**
 * 게시된 공지를 넘기고, 원장만 작성 권한을 켠다.
 */
export default async function NoticesPage() {
    const [session, notices] = await Promise.all([
        auth(),
        getPublishedNotices(),
    ]);
    const canWrite = session?.user?.role === "DIRECTOR";

    return <NoticesScreen initialNotices={notices} canWrite={canWrite} />;
}
