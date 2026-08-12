import { requireRole } from "@/lib/auth-guard";
import { resolveChild } from "@/features/families/resolve-child";
import ParentGradesScreen from "@/app/(parent)/parent/grades/ParentGradesScreen";
import { getParentGradesChildren } from "@/features/grades/viewer-data";
import { readParentChildCookie } from "@/features/families/parent-child-cooke";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ParentGradesPage({
    searchParams,
}: {
    searchParams: Promise<{ childId?: string }>;
}) {
    const session = await requireRole("PARENT");
    const params = await searchParams;
    const cookieStore = await cookies();
    const children = await getParentGradesChildren(session.user.id);
    const activeChildId = resolveChild(
        children.map((child) => child.id),
        params.childId ?? readParentChildCookie(cookieStore),
    );

    return (
        <ParentGradesScreen
            childList={children}
            activeChildId={activeChildId}
        />
    );
}
