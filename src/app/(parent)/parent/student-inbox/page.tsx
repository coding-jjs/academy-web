import { requireRole } from "@/lib/auth-guard";
import { resolveChild } from "@/features/families/resolve-child";
import { getParentStudentInboxData } from "@/features/messages/inbox-data";
import ParentStudentInboxScreen from "./ParentStudentInboxScreen";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ParentStudentInboxPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const data = await getParentStudentInboxData(session.user.id);
    const activeChildId = resolveChild(
        data.childList.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );
    return <ParentStudentInboxScreen {...data} activeChildId={activeChildId} />;
}
