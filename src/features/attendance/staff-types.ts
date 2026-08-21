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

import type { AttendanceStatus } from "@/features/attendance/types";

/**
 * 해당 회차 활성 수강생 한 명.
 * note는 기존 출석 행의 메모. 이 화면 액션은 note를 쓰지 않는다.
 */
export type StaffAttendanceStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: AttendanceStatus | null;
    checkInAt: string | null;
    checkOutAt: string | null;
    note: string | null;
    absenceRequest: { reason: string } | null;
};

/** 오늘 스코프 안 회차 하나. students는 활성 수강 명단 순. */
export type StaffAttendanceSession = {
    id: string;
    classId: string;
    className: string;
    subject: string;
    teacherName: string | null;
    classroom: string | null;
    startsAt: string;
    endsAt: string;
    timeLabel: string;
    students: StaffAttendanceStudent[];
};
