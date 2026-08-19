/**
 * `/parent/inbox` 학부모 쪽지함.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentInboxData`(inbox-data) → `ParentInboxScreen`.
 *
 * 발송은 막고 읽기·읽음 처리만. Action은 Screen의 `markMessageRead` /
 * `markAllMessagesRead`.
 */

import { requireRole } from "@/lib/auth-guard"; // 학부모만.
import ParentInboxScreen from "@/app/(parent)/parent/inbox/ParentInboxScreen"; // 작성기 없음. 교사/직원 MessagesScreen과 별개.
import { getParentInboxData } from "@/features/messages/inbox-data"; // 수신 쪽지·미읽음. 발송은 막고 읽기만.

export const dynamic = "force-dynamic"; // 미읽음이 캐시에 안 남게.

/** 수신 쪽지와 미읽음 수를 Screen에 넘긴다. */
export default async function ParentInboxPage() { // proxy→layout→page. 발송은 막는다.
    const session = await requireRole("PARENT"); // 학부모만.

    const { messages, unreadCount } = await getParentInboxData(session.user.id); // 수신 쪽지·미읽음. 발송은 막고 읽기만.

    return ( // Screen에 props만.
        <ParentInboxScreen messages={messages} unreadCount={unreadCount} /> // 작성기 없음. 교사/직원 MessagesScreen과 별개.
    ); // 호출/그룹 끝.
} // 블록 끝.
