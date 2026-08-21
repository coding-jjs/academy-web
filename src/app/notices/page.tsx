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

import type { Metadata } from "next"; // 공개 공지 메타. /parent/news 와 별개.
import NoticesScreen from "@/features/notices/NoticesScreen"; // 목록·작성 UI. 역할 뉴스 피드가 아니다.
import { getPublishedNotices } from "@/features/notices/data"; // 게시된 공지만. 초안은 원장 작성 UI.
import { auth } from "@/lib/auth"; // JWT role만. requireRole 없음 — 공개 경로.

export const metadata: Metadata = { // 공개 공지 제목. /parent/news 와 별개.
    title: "공지사항 · A학원", // 브라우저 탭. 역할 홈이 아니다.
    description: "A학원의 주요 안내와 학사 일정을 확인합니다.", // 공개 목록 설명.
}; // 블록 끝.

/**
 * 게시된 공지를 넘기고, 원장만 작성 권한을 켠다.
 */
export default async function NoticesPage() { // 공개 `/notices`. proxy matcher 밖.
    const [session, notices] = await Promise.all([ // 세션은 작성 권한만. 목록은 게시된 공지.
        auth(), // JWT. 미로그인도 목록은 본다.
        getPublishedNotices(), // 게시본만. 역할별 news 피드가 아니다.
    ]); // 구문 끝.
    const canWrite = session?.user?.role === "DIRECTOR"; // 원장만 작성 UI. 교사·직원은 읽기만.

    return <NoticesScreen initialNotices={notices} canWrite={canWrite} />; // NoticesScreen에 목록·작성 플래그만.
} // 블록 끝.
