import { requireRole } from "@/lib/auth-guard";
import { getParentTimetableData } from "@/features/timetable/data";
import { resolveChild } from "@/features/families/resolve-child";
import ParentTimetableScreen from "./ParentTimetableScreen";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ParentTimetablePage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const { childList, weekDays } = await getParentTimetableData(
        session.user.id,
    );
    const activeChildId = resolveChild(
        childList.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );
    return (
        <ParentTimetableScreen
            childList={childList}
            weekDays={weekDays}
            activeChildId={activeChildId}
        />
    );
}
