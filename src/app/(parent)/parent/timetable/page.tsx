import { requireRole } from "@/lib/auth-guard";
import { getParentTimetableData } from "@/features/timetable/data";
import ParentTimetableScreen from "./ParentTimetableScreen";

export const dynamic = "force-dynamic";

export default async function ParentTimetablePage() {
    const session = await requireRole("PARENT");
    const { childList, weekDays } = await getParentTimetableData(
        session.user.id,
    );
    return <ParentTimetableScreen childList={childList} weekDays={weekDays} />;
}
