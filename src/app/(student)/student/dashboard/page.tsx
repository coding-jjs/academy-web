/**
 * `/student/dashboard` 학생 홈.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentDashboardData`(student-data,
 * Student.userId = 나) → `StudentDashboardScreen`.
 *
 * 미연결이면 Screen이 대기 안내만 그린다. 쓰기는 없다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학생만. 본인 프로필에 묶인 카드.
import { getStudentDashboardData } from "@/features/dashboard/student-data"; // 본인 학생 카드 요약. 미연결이면 Screen이 대기 안내.
import StudentDashboardScreen from "./StudentDashboardScreen"; // Screen에 data만. 쓰기는 없다.

export const dynamic = "force-dynamic"; // 오늘 수업·쪽지가 캐시에 안 남게.

/** 본인 학생 카드 요약을 홈 Screen에 넘긴다. */
export default async function StudentDashboardPage() { // proxy→layout→page. Student.userId = 나.
    const session = await requireRole("STUDENT"); // 학생만. 본인 프로필에 묶인 카드.
    const data = await getStudentDashboardData( // 본인 학생 카드 요약. 미연결이면 Screen이 대기 안내.
        session.user.id, // 본인 User.id. 다른 학생을 보지 않는다.
        session.user.name ?? "학생", // 표시 이름. 미연결 안내용.
    ); // 호출/그룹 끝.
    return <StudentDashboardScreen data={data} />; // Screen에 data만. 쓰기는 없다.
} // 블록 끝.
