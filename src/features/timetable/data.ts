import "server-only"; // 읽기 전용. 반·출결 쓰기는 classes/attendance actions.

/**
 * 학부모·학생 주간 시간표를 ClassSession으로 구성한다.
 *
 * 호출:
 * - `getParentTimetableData`: `(parent)/parent/timetable/page.tsx`, 챗봇
 * - `getStudentTimetableData`: `(student)/student/timetable/page.tsx`, 챗봇
 *
 * Class.schedule Json의 반복 슬롯은 거의 빈 배열이라 화면 그리드는 실제 회차 기준이다.
 * 주 구간은 `getKstWeekRange`(Asia/Seoul). CANCELLED 회차는 빼다.
 *
 * 의도적으로 하지 않는 일:
 * - 반을 만들거나 출결을 쓰지 않는다.
 * - 링크되지 않은 학생 계정에 빈 카드(`linked: false`)만 돌려 타인 반을 보여 주지 않는다.
 *
 * 관련: `features/timetable/types.ts`, `lib/date-kst.ts`, `classes/actions.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. ClassSession이 그리드 본체.
import { formatKstTime, getKstWeekRange } from "@/lib/date-kst"; // 서울 월요일 시작. +09:00 Instant.
import type { AttendanceStatus } from "@/features/attendance/types"; // 학생 회차 출석. 신청이 아니다.
import type { ParentTimetableChild, RecurringClassSchedule, StudentTimetableData, TimetableSession, WeekDay, WeekDayKey } from "@/features/timetable/types"; // 화면 그리드 타입. CANCELLED는 없다.

const DAY_KEYS: WeekDayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]; // 그리드 헤더 월 시작. getDay() 일=0과 순서가 다르다.
const classSelection = { id: true, name: true, subject: true, schedule: true, teacher: { select: { name: true } } } as const; // schedule Json은 보조. 거의 빈 배열.
const sessionSelection = { id: true, classId: true, startsAt: true, endsAt: true, classroom: true, status: true, class: { select: { name: true, subject: true, teacher: { select: { name: true } } } } } as const; // CANCELLED는 where가 뺀다.

/**
 * 링크된 자녀별 이번 주 회차·반복 슬롯.
 *
 * @param parentUserId 세션 User.id. endedAt null 링크만.
 * @returns `childList` 연결순, `weekDays` 월~일 KST 라벨.
 * @auth 페이지가 PARENT. 이 함수는 링크 where만 본다.
 * @sideEffects 없음.
 */
export async function getParentTimetableData(parentUserId: string) { // 타인 원생은 링크 where가 막는다. 그리드는 ClassSession.
    const week = getWeek(); // KST 월요일 시작. 화면 그리드는 ClassSession.
    const links = await prisma.parentStudentLink.findMany({ // 활성 링크만. GUEST로 떨어진 계정은 페이지가 여기 안 온다.
        where: { parentUserId, endedAt: null }, orderBy: { linkedAt: "asc" }, // 활성 링크만. 타인 원생은 가져오지 않는다.
        select: { student: { select: { id: true, name: true, schoolName: true, grade: true, enrollments: { where: { status: "ACTIVE", endedAt: null }, select: { class: { select: classSelection } } } } } }, // CANCELLED 수강은 반 목록에서 뺀다.
    });
    const classIds = [...new Set(links.flatMap(({ student }) => student.enrollments.map(({ class: academyClass }) => academyClass.id)))]; // 형제 반 중복 제거.
    const sessions = classIds.length === 0 ? [] : await prisma.classSession.findMany({ where: { classId: { in: classIds }, startsAt: { gte: week.startOfWeek, lt: week.endOfWeek }, status: { in: ["SCHEDULED", "COMPLETED"] } }, orderBy: { startsAt: "asc" }, select: sessionSelection }); // CANCELLED는 그리드에 안 올린다.
    const sessionsByClass = Map.groupBy(sessions, (session) => session.classId); // 자녀별 수강 반에만 붙인다.
    const childList: ParentTimetableChild[] = links.map(({ student }) => ({ // 연결 순 카드.
        id: student.id, name: student.name, schoolName: student.schoolName, grade: student.grade, // resolveChild가 이 id만 고른다.
        classes: student.enrollments.map(({ class: academyClass }) => mapClass(academyClass)), // 사이드 목록. ACTIVE+endedAt null.
        sessions: student.enrollments.flatMap(({ class: academyClass }) => (sessionsByClass.get(academyClass.id) ?? []).map((session) => mapSession(session, week.startOfToday))), // 그리드 본체 ClassSession.
        recurring: student.enrollments.flatMap(({ class: academyClass }) => mapRecurring(academyClass)), // 보조. 보통 빈 배열.
    }));
    return { childList, weekDays: week.weekDays }; // Screen 그리드. 쓰기는 없다.
}

/**
 * 로그인한 학생 본인의 주간 시간표.
 *
 * Student.userId가 없으면 `linked: false`와 빈 일정만 돌려
 * Google만 있고 원생 카드가 없는 GUEST/오연결을 보호한다.
 * 출석은 회차당 `take: 1` — unique(studentId, sessionId)라 한 행이면 충분.
 *
 * @param studentUserId User.id (role=STUDENT).
 * @param fallbackName 미연결 카드에 쓸 세션 표시 이름.
 * @sideEffects 없음.
 */
export async function getStudentTimetableData(studentUserId: string, fallbackName: string) { // userId:null이면 타인 반을 보여 주지 않는다.
    const week = getWeek(); // KST 월요일 시작. 그리드는 ClassSession.
    const student = await prisma.student.findFirst({ where: { userId: studentUserId }, select: { id: true, name: true, schoolName: true, grade: true, enrollments: { where: { status: "ACTIVE", endedAt: null }, select: { class: { select: classSelection } } } } }); // 없으면 linked:false. 타인 반을 보여 주지 않는다.
    if (!student) return { weekDays: week.weekDays, data: unlinkedData(fallbackName) }; // Google만 있고 원생 카드가 없으면 빈 일정.
    const classIds = student.enrollments.map(({ class: academyClass }) => academyClass.id); // 활성 수강 반.
    const sessions = classIds.length === 0 ? [] : await prisma.classSession.findMany({ where: { classId: { in: classIds }, startsAt: { gte: week.startOfWeek, lt: week.endOfWeek }, status: { in: ["SCHEDULED", "COMPLETED"] } }, orderBy: { startsAt: "asc" }, select: { ...sessionSelection, attendance: { where: { studentId: student.id }, take: 1, select: { status: true, checkInAt: true } } } }); // unique(studentId, sessionId). CANCELLED 제외.
    const data: StudentTimetableData = { // linked:true. 출석은 take 1.
        linked: true, studentName: student.name, schoolName: student.schoolName, grade: student.grade, // 미연결 카드가 아니다.
        classes: student.enrollments.map(({ class: academyClass }) => mapClass(academyClass)), // 사이드 목록.
        sessions: sessions.map((session) => ({ ...mapSession(session, week.startOfToday), attendanceStatus: (session.attendance[0]?.status as AttendanceStatus | null) ?? null, checkInAt: session.attendance[0]?.checkInAt?.toISOString() ?? null })), // 신청이 아니라 교사 출석 행.
        recurring: student.enrollments.flatMap(({ class: academyClass }) => mapRecurring(academyClass)), // 보조. 보통 빈 배열.
    };
    return { weekDays: week.weekDays, data }; // Screen. 출결 쓰기는 없다.
}

function getWeek() { // 서울 월요일 00:00 Instant. 브라우저 TZ가 아니다.
    const { startOfToday, startOfWeek, endOfWeek } = getKstWeekRange(); // 서울 월요일 00:00 Instant.
    const weekDays: WeekDay[] = DAY_KEYS.map((key, index) => { const date = new Date(startOfWeek); date.setDate(startOfWeek.getDate() + index); return { key, label: new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", weekday: "short" }).format(date), isToday: date >= startOfToday && date < new Date(startOfToday.getTime() + 86_400_000), dateIso: date.toISOString() }; }); // 월~일. isToday는 86_400_000ms KST 구간.
    return { startOfToday, startOfWeek, endOfWeek, weekDays }; // 그리드 헤더.
}

function mapClass(academyClass: { id: string; name: string; subject: string; teacher: { name: string } | null }) { return { id: academyClass.id, name: academyClass.name, subject: academyClass.subject, teacherName: academyClass.teacher?.name ?? null }; } // 사이드 목록용 반 요약.
function mapSession(session: { id: string; startsAt: Date; endsAt: Date; classroom: string | null; status: string; class: { name: string; subject: string; teacher: { name: string } | null } }, today: Date): TimetableSession { return { id: session.id, className: session.class.name, subject: session.class.subject, teacherName: session.class.teacher?.name ?? null, classroom: session.classroom, dayKey: (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as WeekDayKey[])[session.startsAt.getDay()], timeLabel: `${formatKstTime(session.startsAt)}~${formatKstTime(session.endsAt)}`, startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), isToday: session.startsAt >= today && session.startsAt < new Date(today.getTime() + 86_400_000), status: session.status }; } // getDay()는 일=0이라 sun부터. 그리드 DAY_KEYS는 월 시작.
function mapRecurring(academyClass: { id: string; name: string; subject: string; schedule: unknown; teacher: { name: string } | null }): RecurringClassSchedule[] { return parseSchedule(academyClass.schedule).map((slot) => ({ classId: academyClass.id, className: academyClass.name, subject: academyClass.subject, teacherName: academyClass.teacher?.name ?? null, ...slot })); } // 보조. 시드/운영에서 거의 빈 배열.
function parseSchedule(schedule: unknown): Array<{ day: WeekDayKey; start: string; end: string; classroom: string | null }> { // 그리드 본체는 ClassSession. Json은 보조.
    if (!schedule || typeof schedule !== "object") return []; // 시드/운영에서 거의 빈 배열. 그리드 본체는 ClassSession.
    const slots = Array.isArray(schedule) ? schedule : Array.isArray((schedule as { slots?: unknown }).slots) ? (schedule as { slots: unknown[] }).slots : []; // 배열 또는 { slots }.
    return slots.map((slot) => { // day/start/end가 없으면 버린다.
        if (!slot || typeof slot !== "object") return null; // 깨진 슬롯.
        const row = slot as Record<string, unknown>; // Json 키 별칭.
        const day = String(row.day ?? row.weekday ?? "").toLowerCase(); // mon~sun. DAY_KEYS만.
        const start = String(row.start ?? row.startTime ?? ""); // HH:mm.
        const end = String(row.end ?? row.endTime ?? ""); // HH:mm.
        return DAY_KEYS.includes(day as WeekDayKey) && start && end ? { day: day as WeekDayKey, start, end, classroom: typeof row.classroom === "string" ? row.classroom : null } : null; // 그리드 열이 아닌 요일은 버림.
    }).filter((slot): slot is { day: WeekDayKey; start: string; end: string; classroom: string | null } => Boolean(slot)); // null 제거.
}
function unlinkedData(studentName: string): StudentTimetableData { return { linked: false, studentName, schoolName: null, grade: null, classes: [], sessions: [], recurring: [] }; } // Google만 있고 원생 카드가 없으면 빈 일정.
