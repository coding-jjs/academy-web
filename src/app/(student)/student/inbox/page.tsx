/**
 * `/student/inbox` 학생 쪽지함.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentInboxData` → `StudentInboxScreen`.
 *
 * 회신은 없다. 읽음은 Screen/`StudentMessagesPanel`의 inbox-actions.
 */

import { requireRole } from "@/lib/auth-guard"; // 학생만.
import StudentInboxScreen from "./StudentInboxScreen"; // 작성기 없음. 교사/직원 MessagesScreen과 별개.
import { getStudentInboxData } from "@/features/messages/inbox-data"; // 수신 쪽지·미읽음. 회신은 없다.

export const dynamic = "force-dynamic"; // 미읽음이 캐시에 안 남게.

/** 수신 쪽지와 미읽음 수를 Screen에 넘긴다. */
export default async function StudentInboxPage() { // proxy→layout→page. 회신은 없다.
    const session = await requireRole("STUDENT"); // 학생만.

    const { messages, unreadCount } = await getStudentInboxData(session.user.id); // 수신 쪽지·미읽음. 회신은 없다.

    return ( // Screen에 props만.
        <StudentInboxScreen messages={messages} unreadCount={unreadCount} /> // 작성기 없음. 교사/직원 MessagesScreen과 별개.
    ); // 호출/그룹 끝.
} // 블록 끝.
