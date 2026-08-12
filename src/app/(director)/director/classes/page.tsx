import { requireRole } from "@/lib/auth-guard";
import { getClassesManagementData } from "@/features/classes/data";
import ClassesManagementScreen from "@/features/classes/ClassesManagementScreen";

export const dynamic = "force-dynamic";

export default async function DirectorClassesPage() {
    await requireRole("DIRECTOR");
    const classesData = await getClassesManagementData();

    return <ClassesManagementScreen {...classesData} />;
}
