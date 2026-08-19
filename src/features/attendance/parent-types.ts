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

import type { AttendanceStatus } from "@/features/attendance/types"; // 교사 저장 결과. 신청 enum이 아니다.

/**
 * 오늘~이번 주 회차 한 줄.
 * `attendanceStatus` null은 아직 교사가 저장하지 않음.
 */
export type ParentAttendanceSession = { // CANCELLED 회차는 data가 안 넣는다.
    id: string; // ClassSession.id. requestAbsence의 sessionId.
    className: string; // 반 이름.
    subject: string; // 과목.
    teacherName: string | null; // 담당.
    classroom: string | null; // 선택.
    startsAt: string; // UTC ISO.
    endsAt: string; // UTC ISO.
    timeLabel: string; // KST.
    isToday: boolean; // KST 오늘 구간.
    attendanceStatus: AttendanceStatus | null; // 교사 저장 결과. 신청과 별개.
    checkInAt: string | null; // 출석·지각만.
    checkOutAt: string | null; // 조퇴.
    absenceRequest: { // AttendanceRecord가 아니다. 교사가 출결을 찍기 전까지 힌트만.
        id: string; // 신청 행.
        reason: string; // 사유.
        requestedAt: string; // ISO.
    } | null; // AttendanceRecord가 아니다. 교사가 출결을 찍기 전까지 힌트만.
};

/**
 * 링크된 자녀 한 명의 출결 카드.
 * `className`/`teacherName`은 활성 수강 첫 반(표시용 요약).
 */
export type ParentAttendanceChild = { // 타인 원생은 data가 안 넣는다.
    id: string; // Student.id. 쿠키 childId와 맞춘다. 타인 원생은 data가 안 넣는다.
    name: string; // 자녀 이름.
    schoolName: string | null; // 학교.
    grade: string | null; // 학년.
    className: string | null; // 활성 수강 첫 반. 여러 반이면 요약일 뿐.
    teacherName: string | null; // 첫 반 담당.
    monthCounts: { // 교사 출석 행만. 신청 건수는 안 넣는다.
        present: number; // PRESENT.
        late: number; // LATE.
        absent: number; // ABSENT+EXCUSED. 공결 전용 칸은 없음.
        earlyLeave: number; // EARLY_LEAVE.
    };
    todayHighlight: { // 오늘 회차가 없으면 null.
        className: string; // 오늘 반.
        timeLabel: string; // KST.
        classroom: string | null; // 선택.
        status: AttendanceStatus | null; // 신청만 있으면 null.
    } | null; // 오늘 수업 없음.
    sessions: ParentAttendanceSession[]; // 오늘~7일. CANCELLED 없음.
};
