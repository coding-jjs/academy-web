/**
 * 직원 출결 화면의 회차·수강생 행 타입.
 *
 * 호출: `staff-data.getStaffAttendanceSessions` →
 * `StaffAttendanceScreen` / `AttendanceSessionEditor`.
 *
 * `status`가 null이면 아직 출석 행이 없고,
 * `absenceRequest`는 학부모 신청 힌트다 (저장 시 자동 반영되지 않음).
 *
 * 의도적으로 하지 않는 일:
 * - CANCELLED 회차를 이 타입으로 내리지 않는다 → data where.
 *
 * 관련: `features/attendance/staff-actions.ts`, `types.ts`.
 */

import type { AttendanceStatus } from "@/features/attendance/types"; // 교사 저장 enum. 신청이 아니다.

/**
 * 해당 회차 활성 수강생 한 명.
 * note는 기존 출석 행의 메모. 이 화면 액션은 note를 쓰지 않는다.
 */
export type StaffAttendanceStudent = { // 명단 밖 id는 저장 시 버린다.
    id: string; // Student.id. payload의 studentId. 수강 명단 밖은 저장 시 버린다.
    name: string; // 명단 이름.
    schoolName: string | null; // 학교.
    grade: string | null; // 학년.
    status: AttendanceStatus | null; // null이면 아직 AttendanceRecord가 없음.
    checkInAt: string | null; // 출석·지각만. 재저장이 기존 시각을 덮지 않게 서버가 유지.
    checkOutAt: string | null; // 조퇴 시.
    note: string | null; // 이 화면 액션은 note를 쓰지 않는다.
    absenceRequest: { reason: string } | null; // 학부모 신청 힌트. 출결로 자동 승격되지 않음.
};

/** 오늘 스코프 안 회차 하나. students는 활성 수강 명단 순. */
export type StaffAttendanceSession = { // CANCELLED는 data where가 뺀다.
    id: string; // ClassSession.id. saveSessionAttendance의 sessionId.
    classId: string; // 반.
    className: string; // 반 이름.
    subject: string; // 과목.
    teacherName: string | null; // 담당. own/other 권한 판정은 서버가 teacherUserId로.
    classroom: string | null; // 선택.
    startsAt: string; // UTC ISO.
    endsAt: string; // UTC ISO.
    timeLabel: string; // KST 구간. 학원 표준시.
    students: StaffAttendanceStudent[]; // ACTIVE+endedAt null 수강만.
};
