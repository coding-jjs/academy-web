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
export type TeacherOption = { // ACTIVE TEACHER/STAFF만 data가 채운다.
    id: string; // User.id. ACTIVE TEACHER/STAFF만 data가 채운다.
    name: string; // select 라벨.
    role: "TEACHER" | "STAFF"; // 원장은 담당 후보가 아니다.
};

/** SCHEDULED만 편집기에서 취소 버튼을 보여 준다. */
export type ClassSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED"; // CANCELLED는 행 삭제가 아니다.

/** 반당 최신 30건. startsAt/endsAt은 ISO(UTC). 표시는 date-time이 KST로 포맷. */
export type ClassSessionRow = { // 시간표 그리드 타입과 별개. 여기만 CANCELLED를 담는다.
    id: string; // cancelClassSession의 sessionId.
    startsAt: string; // UTC ISO. 입력은 datetime-local +09:00.
    endsAt: string; // UTC ISO.
    classroom: string | null; // 선택.
    status: ClassSessionStatus; // SCHEDULED만 취소 버튼.
};

/**
 * 반 목록/편집기 한 행.
 * `enrollmentCount`는 ACTIVE+endedAt null만. 취소된 수강은 빼다.
 */
export type ClassRow = { // Class.schedule Json은 여기 없다. 그리드는 ClassSession.
    id: string; // ClassEditor key.
    name: string; // 반 이름.
    subject: string; // 과목.
    teacherUserId: string | null; // 담당 미지정이면 null. 출결 own/other 판정에 쓴다.
    teacherName: string | null; // 목록 라벨.
    active: boolean; // false면 이후 createClassSession 거절.
    enrollmentCount: number; // ACTIVE+endedAt null만.
    sessions: ClassSessionRow[]; // CANCELLED 포함. 편집기가 취소 이력을 보여 준다.
};
