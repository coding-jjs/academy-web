import { requireRole } from "@/lib/auth-guard";
import { getStudentTimetableData } from "@/features/timetable/data";
import StudentTimetableScreen from "./StudentTimetableScreen";

export const dynamic = "force-dynamic";

export default async function StudentTimetablePage() {
    const session = await requireRole("STUDENT");
    const { weekDays, data } = await getStudentTimetableData(
        session.user.id,
        session.user.name ?? "학생",
    );
    return <StudentTimetableScreen weekDays={weekDays} data={data} />;
}
