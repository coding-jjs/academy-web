import { requireRole } from "@/lib/auth-guard";
import StudentGradesScreen from "./StudentGradesScreen";
import { getStudentGradesData } from "@/features/grades/viewer-data";

export const dynamic = "force-dynamic";

export default async function StudentGradesPage() {
    const session = await requireRole("STUDENT");

    const data = await getStudentGradesData(
        session.user.id,
        session.user.name ?? "학생",
    );

    return <StudentGradesScreen data={data} />;
}
