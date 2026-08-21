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

import type { AttendanceStatus } from "@/features/attendance/types"; // PRESENT 등 다섯 값. null은 타입이 아님.
import { formatKstTime } from "@/lib/date-kst"; // 체크인 ISO → 학원 시각 문자열.

/**
 * PRESENT/LATE/ABSENT/EXCUSED/EARLY_LEAVE → 출석/지각/결석/공결/조퇴.
 * tone은 StatusChip용. 권한과 무관하다.
 */
export const ATTENDANCE_STATUS_METADATA: Record< // Screen 칩. 신청 라벨이 아니다.
    AttendanceStatus, // 다섯 값.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip. 권한과 무관.
> = { // 학부모 신청이 공결로 자동 승격되지는 않는다.
    PRESENT: { label: "출석", tone: "success" }, // checkInAt 있음.
    LATE: { label: "지각", tone: "warning" }, // checkInAt 있음.
    ABSENT: { label: "결석", tone: "danger" }, // 신청과 별개. 교사가 찍는다.
    EXCUSED: { label: "공결", tone: "neutral" }, // 학부모 신청이 공결로 자동 승격되지는 않는다.
    EARLY_LEAVE: { label: "조퇴", tone: "warning" }, // checkOutAt.
};

/** 교사 출결 셀렉트 옵션. 메타데이터 키 순서를 그대로 쓴다. */
export const ATTENDANCE_STATUS_OPTIONS = Object.entries( // 편집기 select. 신청 옵션이 아니다.
    ATTENDANCE_STATUS_METADATA, // 키 순서 유지.
).map(([value, metadata]) => ({ // value/label만.
    value: value as AttendanceStatus, // ALLOWED와 같은 다섯 값.
    label: metadata.label, // 한글.
}));

/**
 * 체크인 ISO를 KST 시각 문자열로. 행이 없거나 결석이면 null.
 *
 * @param isoDate AttendanceRecord.checkInAt ISO 또는 null.
 */
export function formatAttendanceCheckInTime(isoDate: string | null) { // 신청 시각이 아니다.
    return isoDate ? formatKstTime(isoDate) : null; // 행이 없거나 결석이면 null. 서버 KST 포맷터에 위임.
}
