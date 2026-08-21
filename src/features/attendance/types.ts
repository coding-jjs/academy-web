/**
 * 출결 상태(AttendanceStatus) 공통 유니온.
 *
 * 호출: 직원 저장·학부모 조회·시간표·대시보드·표시 라벨이 모두
 * 이 다섯 값을 공유한다. Prisma enum과 문자열을 맞춰 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 미체크(null)를 유니온에 넣지 않는다. 화면은 `AttendanceStatus | null`.
 * - AbsenceRequest 상태를 여기 두지 않는다.
 *
 * 관련: `staff-actions.ts` ALLOWED, `presentation.ts` 메타데이터.
 */

export type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "ABSENT"
    | "EXCUSED"
    | "EARLY_LEAVE";
