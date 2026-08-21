/**
 * `/parent/inbox` 학부모 쪽지함.
 *
 * 연 사람: PARENT. layout 가드 + page `requireRole("PARENT")`.
 * 흐름: requireRole → `getParentInboxData`(inbox-data) → `ParentInboxScreen`.
 *
 * 발송은 막고 읽기·읽음 처리만. Action은 Screen의 `markMessageRead` /
 * `markAllMessagesRead`.
 */

import { requireRole } from "@/lib/auth-guard";
import ParentInboxScreen from "@/app/(parent)/parent/inbox/ParentInboxScreen";
import { getParentInboxData } from "@/features/messages/inbox-data";

export const dynamic = "force-dynamic";

/** 수신 쪽지와 미읽음 수를 Screen에 넘긴다. */
export default async function ParentInboxPage() {
    const session = await requireRole("PARENT");

    const { messages, unreadCount } = await getParentInboxData(session.user.id);

    return (
        <ParentInboxScreen messages={messages} unreadCount={unreadCount} />
    );
}
