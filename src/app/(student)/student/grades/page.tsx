/**
 * `/student/grades` 본인 성적·오답 열람.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentGradesData`(viewer-data) → `StudentGradesScreen`.
 *
 * 쓰기는 없다. 점수 입력은 교사/원장 성적 화면 몫이다.
 */

import { requireRole } from "@/lib/auth-guard"; // 학생만.
import StudentGradesScreen from "./StudentGradesScreen"; // 읽기 Screen. GradesManagementScreen이 아니다.
import { getStudentGradesData } from "@/features/grades/viewer-data"; // 본인 성적·오답. 쓰기는 없다.

export const dynamic = "force-dynamic"; // 본인 성적이 캐시에 안 남게.

/** 본인 성적·오답 묶음을 읽기 Screen에 넘긴다. */
export default async function StudentGradesPage() { // proxy→layout→page. 입력은 교사/원장.
    const session = await requireRole("STUDENT"); // 학생만.

    const data = await getStudentGradesData( // 본인 성적·오답. 쓰기는 없다.
        session.user.id, // 본인 User.id.
        session.user.name ?? "학생", // 표시 이름.
    ); // 호출/그룹 끝.

    return <StudentGradesScreen data={data} />; // 읽기 Screen에 data만. GradesManagementScreen이 아니다.
} // 블록 끝.
