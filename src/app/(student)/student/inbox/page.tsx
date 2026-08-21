/**
 * `/student/inbox` 학생 쪽지함.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentInboxData` → `StudentInboxScreen`.
 *
 * 회신은 없다. 읽음은 Screen/`StudentMessagesPanel`의 inbox-actions.
 */

import { requireRole } from "@/lib/auth-guard";
import StudentInboxScreen from "./StudentInboxScreen";
import { getStudentInboxData } from "@/features/messages/inbox-data";

export const dynamic = "force-dynamic";

/** 수신 쪽지와 미읽음 수를 Screen에 넘긴다. */
export default async function StudentInboxPage() {
    const session = await requireRole("STUDENT");

    const { messages, unreadCount } = await getStudentInboxData(session.user.id);

    return (
        <StudentInboxScreen messages={messages} unreadCount={unreadCount} />
    );
}
