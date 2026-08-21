/**
 * `/student/grades` 본인 성적·오답 열람.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentGradesData`(viewer-data) → `StudentGradesScreen`.
 *
 * 쓰기는 없다. 점수 입력은 교사/원장 성적 화면 몫이다.
 */

import { requireRole } from "@/lib/auth-guard";
import StudentGradesScreen from "./StudentGradesScreen";
import { getStudentGradesData } from "@/features/grades/viewer-data";

export const dynamic = "force-dynamic";

/** 본인 성적·오답 묶음을 읽기 Screen에 넘긴다. */
export default async function StudentGradesPage() {
    const session = await requireRole("STUDENT");

    const data = await getStudentGradesData(
        session.user.id,
        session.user.name ?? "학생",
    );

    return <StudentGradesScreen data={data} />;
}
