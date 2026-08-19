/**
 * `/director/messages` 원장 쪽지.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getDirectorMessagesData` → features `MessagesScreen`
 * (`mode=director`, `canCompose`).
 *
 * 교사/직원 Screen 파일을 import하지 않는다. 승인 큐와 작성기는 features가 담당.
 */

import { requireRole } from "@/lib/auth-guard"; // layout에 더해 page에서도 원장만.
import { getDirectorMessagesData } from "@/features/messages/data"; // 승인 큐·작성기 데이터.
import MessagesScreen from "@/features/messages/MessagesScreen"; // features Screen. 교사 Screen 파일을 쓰지 않는다.

export const dynamic = "force-dynamic"; // 승인 큐가 캐시에 안 남게.

/** 원장 쪽지 데이터와 작성 권한을 MessagesScreen에 넘긴다. */
export default async function DirectorMessagesPage() { // proxy→layout→page. 승인 큐는 features.
    await requireRole("DIRECTOR"); // 원장만.
    const messagesData = await getDirectorMessagesData(); // 승인 큐·작성기 데이터.

    return <MessagesScreen mode="director" canCompose {...messagesData} />; // features MessagesScreen. 교사 Screen 파일을 쓰지 않는다.
} // 블록 끝.
