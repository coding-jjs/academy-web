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

import type { AttendanceStatus } from "@/features/attendance/types"; // 학생 회차 take:1. 학부모 신청이 아니다.

/** 주간 그리드 열. 월요일 시작. JS getDay(일=0)와 순서가 다르다. */
export type WeekDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; // 그리드 헤더는 월 시작. session map은 sun부터.

/** 한 주의 하루. `dateIso`는 그 날 00:00 KST에 해당하는 Instant ISO. */
export type WeekDay = { // data.getWeek이 채운다. 브라우저 TZ가 아니다.
    key: WeekDayKey; // DAY_KEYS 순서.
    label: string; // 서울 타임존 월/일·요일.
    isToday: boolean; // 86_400_000ms KST 구간.
    dateIso: string; // 그날 00:00 KST Instant.
};

/** 활성 수강 반 요약. 시간표 사이드 목록. */
export type TimetableClass = { // CANCELLED 수강은 data enrollments where가 뺀다.
    id: string; // 반 id.
    name: string; // 반 이름.
    subject: string; // 과목.
    teacherName: string | null; // 담당 미지정 null.
};

/**
 * Class.schedule Json에서 파싱한 반복 슬롯.
 * 화면은 회차가 있으면 회차를 그리고, 이 배열은 보조(거의 비어 있음).
 */
export type RecurringClassSchedule = { // 그리드 본체가 아니다. ClassSession이 우선.
    classId: string; // 반.
    className: string; // 반 이름.
    subject: string; // 과목.
    teacherName: string | null; // 담당.
    day: WeekDayKey; // 월 시작 키. getDay() 배열이 아니다.
    start: string; // HH:mm. 시드/운영에서 거의 안 씀.
    end: string; // HH:mm.
    classroom: string | null; // 선택.
};

/** 이번 주 ClassSession 한 칸. status는 SCHEDULED/COMPLETED 문자열. */
export type TimetableSession = { // CANCELLED는 data가 안 가져온다.
    id: string; // ClassSession.id.
    className: string; // 반 이름.
    subject: string; // 과목.
    teacherName: string | null; // 담당.
    classroom: string | null; // 선택.
    dayKey: WeekDayKey; // getDay() 일=0 배열로 매핑. 그리드 DAY_KEYS와 순서가 다르다.
    timeLabel: string; // KST 구간.
    startsAt: string; // UTC ISO.
    endsAt: string; // UTC ISO.
    isToday: boolean; // 86_400_000ms.
    status: string; // SCHEDULED/COMPLETED. CANCELLED는 data가 안 가져온다.
};

/** 학부모 시간표의 자녀 한 명. 쿠키로 고른 childId와 id를 맞춘다. */
export type ParentTimetableChild = { // 활성 링크만 data가 채운다.
    id: string; // Student.id. resolveChild가 활성 링크 안에서만 고른다.
    name: string; // 자녀 이름.
    schoolName: string | null; // 학교.
    grade: string | null; // 학년.
    classes: TimetableClass[]; // 사이드 목록. ACTIVE 수강.
    sessions: TimetableSession[]; // 그리드 본체.
    recurring: RecurringClassSchedule[]; // 보조. 보통 빈 배열.
};

/**
 * 학생 본인 시간표.
 * `linked: false`면 원생 카드가 없어 일정 배열이 모두 비어 있다.
 */
export type StudentTimetableData = { // userId 연결 없음이면 타인 반을 보여 주지 않는다.
    linked: boolean; // false면 userId 연결 없음. 타인 반을 보여 주지 않는다.
    studentName: string; // 미연결이면 세션 표시 이름.
    schoolName: string | null; // 미연결이면 null.
    grade: string | null; // 미연결이면 null.
    classes: TimetableClass[]; // linked false면 [].
    sessions: Array< // 그리드 + 출석 take:1.
        TimetableSession & { // CANCELLED 없음.
            attendanceStatus: AttendanceStatus | null; // take:1. unique(studentId, sessionId).
            checkInAt: string | null; // 출석·지각만.
        }
    >; // sessions 끝.
    recurring: RecurringClassSchedule[]; // 보조. 보통 빈 배열.
};
