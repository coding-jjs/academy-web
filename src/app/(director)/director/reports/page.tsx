import { getDirectorReportStudents } from "@/features/reports/director-data";
import DirectorReportsScreen from "./DirectorReportsScreen";

export const dynamic = "force-dynamic";

export default async function DirectorReportsPage() {
    const students = await getDirectorReportStudents();

    return <DirectorReportsScreen students={students} />;
}
