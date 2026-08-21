/**
 * `/student/timetable` 본인 주간 시간표.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentTimetableData` → `StudentTimetableScreen`.
 *
 * 일정을 고치지 않는다. 출석 상태는 읽기만.
 */

import { requireRole } from "@/lib/auth-guard";
import { getStudentTimetableData } from "@/features/timetable/data";
import StudentTimetableScreen from "./StudentTimetableScreen";

export const dynamic = "force-dynamic";

/** 이번 주 세션과 요일 축을 Screen에 넘긴다. */
export default async function StudentTimetablePage() {
    const session = await requireRole("STUDENT");
    const { weekDays, data } = await getStudentTimetableData(
        session.user.id,
        session.user.name ?? "학생",
    );
    return <StudentTimetableScreen weekDays={weekDays} data={data} />;
}
