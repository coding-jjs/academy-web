import { getDirectorCounselingMemos } from "@/features/counseling/director-data";
import { getDirectorStudentsData } from "@/features/students/director-data";
import DirectorStudentsScreen from "@/app/(director)/director/students/DirectorStudentsScreen";

export const dynamic = "force-dynamic";

export default async function DirectorStudentsPage() {
    const [studentsData, counselingMemos] = await Promise.all([
        getDirectorStudentsData(),
        getDirectorCounselingMemos(),
    ]);

    return (
        <DirectorStudentsScreen
            {...studentsData}
            counselingMemos={counselingMemos}
        />
    );
}
