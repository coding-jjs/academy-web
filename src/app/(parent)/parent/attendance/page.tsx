import { getParentAttendanceChildren } from "@/features/attendance/parent-data";
import { resolveChild } from "@/features/families/resolve-child";
import { requireRole } from "@/lib/auth-guard";
import { cookies } from "next/headers";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import ParentAttendanceScreen from "./ParentAttendanceScreen";

export default async function ParentAttendencePage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const children = await getParentAttendanceChildren(session.user.id);
    const activeChildId = resolveChild(
        children.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );
    return (
        <ParentAttendanceScreen
            childList={children}
            activeChildId={activeChildId}
        />
    );
}
