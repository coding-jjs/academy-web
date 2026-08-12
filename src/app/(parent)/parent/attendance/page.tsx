import { requireRole } from "@/lib/auth-guard";
import { getParentAttendanceChildren } from "@/features/attendance/parent-data";
import ParentAttendanceScreen from "./ParentAttendanceScreen";

export const dynamic = "force-dynamic";

export default async function ParentAttendancePage() {
    const session = await requireRole("PARENT");
    const children = await getParentAttendanceChildren(session.user.id);
    return <ParentAttendanceScreen childList={children} />;
}
