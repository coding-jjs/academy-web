/**
 * `/student/timetable` 본인 주간 시간표.
 *
 * 연 사람: STUDENT. layout 가드 + page `requireRole("STUDENT")`.
 * 흐름: requireRole → `getStudentTimetableData` → `StudentTimetableScreen`.
 *
 * 일정을 고치지 않는다. 출석 상태는 읽기만.
 */

import { requireRole } from "@/lib/auth-guard"; // 학생만.
import { getStudentTimetableData } from "@/features/timetable/data"; // 이번 주 세션. 일정은 고치지 않는다.
import StudentTimetableScreen from "./StudentTimetableScreen"; // Screen에 요일 축·세션만. 출석 저장이 아니다.

export const dynamic = "force-dynamic"; // 주간 세션이 캐시에 안 남게.

/** 이번 주 세션과 요일 축을 Screen에 넘긴다. */
export default async function StudentTimetablePage() { // proxy→layout→page. 출석 저장이 아니다.
    const session = await requireRole("STUDENT"); // 학생만.
    const { weekDays, data } = await getStudentTimetableData( // 이번 주 세션. 일정은 고치지 않는다.
        session.user.id, // 본인 User.id.
        session.user.name ?? "학생", // 표시 이름.
    ); // 호출/그룹 끝.
    return <StudentTimetableScreen weekDays={weekDays} data={data} />; // Screen에 요일 축·세션만. 출석 저장이 아니다.
} // 블록 끝.
