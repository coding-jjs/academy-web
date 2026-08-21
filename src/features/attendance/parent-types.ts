/**
 * 학부모 출결 화면의 자녀·예정 수업 타입.
 *
 * 호출: `parent-data.getParentAttendanceChildren` →
 * `ParentAttendanceScreen`, 챗봇 컨텍스트.
 *
 * `attendanceStatus`와 `absenceRequest`를 분리해,
 * 신청만 있고 출석 행이 없는 상태를 표현한다 (학부모 신청 ≠ 출결).
 *
 * 의도적으로 하지 않는 일:
 * - 월간 집계에 EXCUSED를 별도 칸으로 두지 않는다 → data의 absent 버킷.
 *
 * 관련: `features/attendance/types.ts`, `parent-actions.ts`.
 */

import type { AttendanceStatus } from "@/features/attendance/types";

/**
 * 오늘~이번 주 회차 한 줄.
 * `attendanceStatus` null은 아직 교사가 저장하지 않음.
 */
export type ParentAttendanceSession = {
    id: string;
    className: string;
    subject: string;
    teacherName: string | null;
    classroom: string | null;
    startsAt: string;
    endsAt: string;
    timeLabel: string;
    isToday: boolean;
    attendanceStatus: AttendanceStatus | null;
    checkInAt: string | null;
    checkOutAt: string | null;
    absenceRequest: {
        id: string;
        reason: string;
        requestedAt: string;
    } | null;
};

/**
 * 링크된 자녀 한 명의 출결 카드.
 * `className`/`teacherName`은 활성 수강 첫 반(표시용 요약).
 */
export type ParentAttendanceChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    monthCounts: {
        present: number;
        late: number;
        absent: number;
        earlyLeave: number;
    };
    todayHighlight: {
        className: string;
        timeLabel: string;
        classroom: string | null;
        status: AttendanceStatus | null;
    } | null;
    sessions: ParentAttendanceSession[];
};
