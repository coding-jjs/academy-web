/**
 * `/director/classes` 반·회차 관리.
 *
 * 연 사람: DIRECTOR. layout 가드 + page `requireRole("DIRECTOR")`.
 * 흐름: requireRole → `getClassesManagementData` → features `ClassesManagementScreen`.
 *
 * 교사 URL에는 반 CRUD가 없다. 세션 생성은 이 Screen의 Server Action 몫이다.
 */

import { requireRole } from "@/lib/auth-guard"; // layout에 더해 page에서도 원장만.
import { getClassesManagementData } from "@/features/classes/data"; // 반·회차 관리 DTO.
import ClassesManagementScreen from "@/features/classes/ClassesManagementScreen"; // features Screen. 교사 URL에는 반 CRUD가 없다.

export const dynamic = "force-dynamic"; // 반·회차가 캐시에 안 남게.

/** 반·회차 관리 데이터를 Screen에 넘긴다. */
export default async function DirectorClassesPage() { // proxy→layout→page. 교사 반 CRUD 없음.
    await requireRole("DIRECTOR"); // 원장만.
    const classesData = await getClassesManagementData(); // 반·회차 관리 DTO.

    return <ClassesManagementScreen {...classesData} />; // features Screen. 교사 URL에는 반 CRUD가 없다.
} // 블록 끝.
