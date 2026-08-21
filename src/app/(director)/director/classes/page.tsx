/**
 * `/director/classes` 반·회차 관리.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getClassesManagementData` → features `ClassesManagementScreen`.
 *
 * 교사 URL에는 반 CRUD가 없다. 세션 생성은 이 Screen의 Server Action 몫이다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getClassesManagementData } from "@/features/classes/data";
import ClassesManagementScreen from "@/features/classes/ClassesManagementScreen";

export const dynamic = "force-dynamic";

/** 반·회차 관리 데이터를 Screen에 넘긴다. */
export default async function DirectorClassesPage() {
    await requireRole("DIRECTOR");
    const classesData = await getClassesManagementData();

    return <ClassesManagementScreen {...classesData} />;
}
