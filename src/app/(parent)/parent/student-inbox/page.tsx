import { requireRole } from "@/lib/auth-guard";
import { getParentStudentInboxData } from "@/features/messages/inbox-data";
import ParentStudentInboxScreen from "./ParentStudentInboxScreen";

export const dynamic = "force-dynamic";

export default async function ParentStudentInboxPage() {
    const session = await requireRole("PARENT");
    const data = await getParentStudentInboxData(session.user.id);
    return <ParentStudentInboxScreen {...data} />;
}
