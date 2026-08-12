import { requireRole } from "@/lib/auth-guard";
import ParentGradesScreen from "@/app/(parent)/parent/grades/ParentGradesScreen";
import { getParentGradesChildren } from "@/features/grades/viewer-data";

export const dynamic = "force-dynamic";

export default async function ParentGradesPage() {
    const session = await requireRole("PARENT");

    const children = await getParentGradesChildren(session.user.id);

    return <ParentGradesScreen childList={children} />;
}
