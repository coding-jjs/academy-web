/**
 * 학부모·학생 주간 시간표 화면의 요일·회차·반복 슬롯 타입.
 *
 * 호출: `timetable/data.ts`가 채우고 Parent/Student TimetableScreen이 그린다.
 * `RecurringClassSchedule`은 Class.schedule Json용이며, 실제 표시는
 * `TimetableSession`(ClassSession)이 우선이다. 시드/운영에서 schedule은 거의 빈 배열.
 *
 * 의도적으로 하지 않는 일:
 * - CANCELLED를 화면 그리드 타입에서 구분하지 않는다. data가 아예 안 가져온다.
 *
 * 관련: `features/attendance/types.ts`(학생 회차의 출석 상태),
 * `features/classes/types.ts`(원장 반 관리의 회차 상태).
 */

import type { AttendanceStatus } from "@/features/attendance/types";

/** 주간 그리드 열. 월요일 시작. JS getDay(일=0)와 순서가 다르다. */
export type WeekDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** 한 주의 하루. `dateIso`는 그 날 00:00 KST에 해당하는 Instant ISO. */
export type WeekDay = {
    key: WeekDayKey;
    label: string;
    isToday: boolean;
    dateIso: string;
};

/** 활성 수강 반 요약. 시간표 사이드 목록. */
export type TimetableClass = {
    id: string;
    name: string;
    subject: string;
    teacherName: string | null;
};

/**
 * Class.schedule Json에서 파싱한 반복 슬롯.
 * 화면은 회차가 있으면 회차를 그리고, 이 배열은 보조(거의 비어 있음).
 */
export type RecurringClassSchedule = {
    classId: string;
    className: string;
    subject: string;
    teacherName: string | null;
    day: WeekDayKey;
    start: string;
    end: string;
    classroom: string | null;
};

/** 이번 주 ClassSession 한 칸. status는 SCHEDULED/COMPLETED 문자열. */
export type TimetableSession = {
    id: string;
    className: string;
    subject: string;
    teacherName: string | null;
    classroom: string | null;
    dayKey: WeekDayKey;
    timeLabel: string;
    startsAt: string;
    endsAt: string;
    isToday: boolean;
    status: string;
};

/** 학부모 시간표의 자녀 한 명. 쿠키로 고른 childId와 id를 맞춘다. */
export type ParentTimetableChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    classes: TimetableClass[];
    sessions: TimetableSession[];
    recurring: RecurringClassSchedule[];
};

/**
 * 학생 본인 시간표.
 * `linked: false`면 원생 카드가 없어 일정 배열이 모두 비어 있다.
 */
export type StudentTimetableData = {
    linked: boolean;
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    classes: TimetableClass[];
    sessions: Array<
        TimetableSession & {
            attendanceStatus: AttendanceStatus | null;
            checkInAt: string | null;
        }
    >;
    recurring: RecurringClassSchedule[];
};
