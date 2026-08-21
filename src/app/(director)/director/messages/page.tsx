/**
 * `/director/messages` 원장 쪽지.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getDirectorMessagesData` → features `MessagesScreen`
 * (`mode=director`, `canCompose`).
 *
 * 교사/직원 Screen 파일을 import하지 않는다. 승인 큐와 작성기는 features가 담당.
 */

import { requireRole } from "@/lib/auth-guard";
import { getDirectorMessagesData } from "@/features/messages/data";
import MessagesScreen from "@/features/messages/MessagesScreen";

export const dynamic = "force-dynamic";

/** 원장 쪽지 데이터와 작성 권한을 MessagesScreen에 넘긴다. */
export default async function DirectorMessagesPage() {
    await requireRole("DIRECTOR");
    const messagesData = await getDirectorMessagesData();

    return <MessagesScreen mode="director" canCompose {...messagesData} />;
}
