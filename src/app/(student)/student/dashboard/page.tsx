/**
 * `/student/dashboard` 학생 홈.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentDashboardData`(student-data,
 * Student.userId = 나) → `StudentDashboardScreen`.
 *
 * 미연결이면 Screen이 대기 안내만 그린다. 쓰기는 없다.
 */

import { requireRole } from "@/lib/auth-guard";
import { getStudentDashboardData } from "@/features/dashboard/student-data";
import StudentDashboardScreen from "./StudentDashboardScreen";

export const dynamic = "force-dynamic";

/** 본인 학생 카드 요약을 홈 Screen에 넘긴다. */
export default async function StudentDashboardPage() {
    const session = await requireRole("STUDENT");
    const data = await getStudentDashboardData(
        session.user.id,
        session.user.name ?? "학생",
    );
    return <StudentDashboardScreen data={data} />;
}
