import { getDirectorStudentsData } from "@/features/students/director-data";
import DirectorStudentsScreen from "@/app/(director)/director/students/DirectorStudentsScreen";

export const dynamic = "force-dynamic";

export default async function DirectorStudentsPage() {
    const studentsData = await getDirectorStudentsData();

    return <DirectorStudentsScreen {...studentsData} />;
}
