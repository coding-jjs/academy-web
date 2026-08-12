import { requireRole } from "@/lib/auth-guard";
import { getStudentDashboardData } from "@/features/dashboard/student-data";
import StudentDashboardScreen from "./StudentDashboardScreen";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
    const session = await requireRole("STUDENT");
    const data = await getStudentDashboardData(
        session.user.id,
        session.user.name ?? "학생",
    );
    return <StudentDashboardScreen data={data} />;
}
