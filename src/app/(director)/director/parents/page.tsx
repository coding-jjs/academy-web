import { getDirectorFamilyLinksData } from "@/features/families/director-data";
import DirectorParentsScreen from "./DirectorParentsScreen";

export const dynamic = "force-dynamic";

export default async function DirectorParentsPage() {
    const familyLinksData = await getDirectorFamilyLinksData();

    return <DirectorParentsScreen {...familyLinksData} />;
}
