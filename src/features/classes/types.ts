/**
 * 원장 반 관리 화면의 반·회차·담당 교사 옵션 타입.
 *
 * 호출: `features/classes/data.ts`가 채우고 `ClassesManagementScreen` /
 * `ClassList` / `ClassEditor`가 그린다.
 *
 * `ClassSessionStatus`의 CANCELLED는 삭제된 회차가 아니라 취소 상태다.
 * 출석·시간표 쿼리는 CANCELLED를 보통 제외한다.
 *
 * 의도적으로 하지 않는 일:
 * - Class.schedule Json 슬롯 타입을 여기에 두지 않는다 → timetable/types.
 *
 * 관련: `features/classes/actions.ts`, `features/classes/date-time.ts`.
 */

/** 반 담당 select. DIRECTOR는 후보가 아니다. */
export type TeacherOption = {
    id: string;
    name: string;
    role: "TEACHER" | "STAFF";
};

/** SCHEDULED만 편집기에서 취소 버튼을 보여 준다. */
export type ClassSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

/** 반당 최신 30건. startsAt/endsAt은 ISO(UTC). 표시는 date-time이 KST로 포맷. */
export type ClassSessionRow = {
    id: string;
    startsAt: string;
    endsAt: string;
    classroom: string | null;
    status: ClassSessionStatus;
};

/**
 * 반 목록/편집기 한 행.
 * `enrollmentCount`는 ACTIVE+endedAt null만. 취소된 수강은 빼다.
 */
export type ClassRow = {
    id: string;
    name: string;
    subject: string;
    teacherUserId: string | null;
    teacherName: string | null;
    active: boolean;
    enrollmentCount: number;
    sessions: ClassSessionRow[];
};
