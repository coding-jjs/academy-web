import { requireRole } from "@/lib/auth-guard";
import StudentInboxScreen from "./StudentInboxScreen";
import { getStudentInboxData } from "@/features/messages/inbox-data";

export const dynamic = "force-dynamic";

export default async function StudentInboxPage() {
    const session = await requireRole("STUDENT");

    const { messages, unreadCount } = await getStudentInboxData(session.user.id);

    return (
        <StudentInboxScreen messages={messages} unreadCount={unreadCount} />
    );
}
