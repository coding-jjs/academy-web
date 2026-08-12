import { getKstDayRange } from "@/lib/date-kst";
import { getDirectorDashboardMetrics } from "@/features/dashboard/director-data";
import DirectorDashboardScreen from "./DirectorDashboardScreen";

export const dynamic = "force-dynamic";

export default async function DirectorDashboardPage() {
    const { startOfToday, endOfToday } = getKstDayRange();
    const metrics = await getDirectorDashboardMetrics({
        startOfDay: startOfToday,
        endOfDay: endOfToday,
    });

    return <DirectorDashboardScreen metrics={metrics} />;
}
