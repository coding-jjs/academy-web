import { requireRole } from "@/lib/auth-guard";
import { getDirectorMessagesData } from "@/features/messages/data";
import MessagesScreen from "@/features/messages/MessagesScreen";

export const dynamic = "force-dynamic";

export default async function DirectorMessagesPage() {
    await requireRole("DIRECTOR");
    const messagesData = await getDirectorMessagesData();

    return <MessagesScreen mode="director" canCompose {...messagesData} />;
}
