import { requireRole } from "@/lib/auth-guard";
import ParentInboxScreen from "@/app/(parent)/parent/inbox/ParentInboxScreen";
import { getParentInboxData } from "@/features/messages/inbox-data";

export const dynamic = "force-dynamic";

export default async function ParentInboxPage() {
    const session = await requireRole("PARENT");

    const { messages, unreadCount } = await getParentInboxData(session.user.id);

    return (
        <ParentInboxScreen messages={messages} unreadCount={unreadCount} />
    );
}
