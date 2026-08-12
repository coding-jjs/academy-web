import { requireRole } from "@/lib/auth-guard";
import { getDirectorChurnData } from "@/features/churn/data";
import DirectorChurnScreen from "./DirectorChurnScreen";

export const dynamic = "force-dynamic";

export default async function DirectorChurnPage() {
    await requireRole("DIRECTOR");
    const churnData = await getDirectorChurnData();

    return <DirectorChurnScreen {...churnData} />;
}
