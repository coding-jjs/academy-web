/**
 * 출결 상태 한글 라벨·톤과 체크인 시각 포맷터.
 *
 * 호출: 학부모/학생 대시보드, 학부모·교사 출결 화면, 학생 시간표 등.
 * DB 상태를 바꾸지 않고 UI 표시만 담당한다.
 *
 * 의도적으로 하지 않는 일:
 * - AbsenceRequest 라벨을 여기에 두지 않는다. 신청은 출결 상태와 별개.
 * - 타임존 계산은 `@/lib/date-kst.formatKstTime`.
 *
 * 관련: `features/attendance/types.ts`.
 */

import type { AttendanceStatus } from "@/features/attendance/types";
import { formatKstTime } from "@/lib/date-kst";

/**
 * PRESENT/LATE/ABSENT/EXCUSED/EARLY_LEAVE → 출석/지각/결석/공결/조퇴.
 * tone은 StatusChip용. 권한과 무관하다.
 */
export const ATTENDANCE_STATUS_METADATA: Record<
    AttendanceStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PRESENT: { label: "출석", tone: "success" },
    LATE: { label: "지각", tone: "warning" },
    ABSENT: { label: "결석", tone: "danger" },
    EXCUSED: { label: "공결", tone: "neutral" },
    EARLY_LEAVE: { label: "조퇴", tone: "warning" },
};

/** 교사 출결 셀렉트 옵션. 메타데이터 키 순서를 그대로 쓴다. */
export const ATTENDANCE_STATUS_OPTIONS = Object.entries(
    ATTENDANCE_STATUS_METADATA,
).map(([value, metadata]) => ({
    value: value as AttendanceStatus,
    label: metadata.label,
}));

/**
 * 체크인 ISO를 KST 시각 문자열로. 행이 없거나 결석이면 null.
 *
 * @param isoDate AttendanceRecord.checkInAt ISO 또는 null.
 */
export function formatAttendanceCheckInTime(isoDate: string | null) {
    return isoDate ? formatKstTime(isoDate) : null;
}
