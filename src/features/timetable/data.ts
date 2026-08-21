import "server-only";

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

import { prisma } from "@/lib/db";
import { formatKstTime, getKstWeekRange } from "@/lib/date-kst";
import type { AttendanceStatus } from "@/features/attendance/types";
import type { ParentTimetableChild, RecurringClassSchedule, StudentTimetableData, TimetableSession, WeekDay, WeekDayKey } from "@/features/timetable/types";

const DAY_KEYS: WeekDayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const classSelection = { id: true, name: true, subject: true, schedule: true, teacher: { select: { name: true } } } as const;
const sessionSelection = { id: true, classId: true, startsAt: true, endsAt: true, classroom: true, status: true, class: { select: { name: true, subject: true, teacher: { select: { name: true } } } } } as const;

/**
 * 링크된 자녀별 이번 주 회차·반복 슬롯.
 *
 * @param parentUserId 세션 User.id. endedAt null 링크만.
 * @returns `childList` 연결순, `weekDays` 월~일 KST 라벨.
 * @auth 페이지가 PARENT. 이 함수는 링크 where만 본다.
 * @sideEffects 없음.
 */
export async function getParentTimetableData(parentUserId: string) {
    const week = getWeek();
    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId, endedAt: null }, orderBy: { linkedAt: "asc" },
        select: { student: { select: { id: true, name: true, schoolName: true, grade: true, enrollments: { where: { status: "ACTIVE", endedAt: null }, select: { class: { select: classSelection } } } } } },
    });
    const classIds = [...new Set(links.flatMap(({ student }) => student.enrollments.map(({ class: academyClass }) => academyClass.id)))];
    const sessions = classIds.length === 0 ? [] : await prisma.classSession.findMany({ where: { classId: { in: classIds }, startsAt: { gte: week.startOfWeek, lt: week.endOfWeek }, status: { in: ["SCHEDULED", "COMPLETED"] } }, orderBy: { startsAt: "asc" }, select: sessionSelection });
    const sessionsByClass = Map.groupBy(sessions, (session) => session.classId);
    const childList: ParentTimetableChild[] = links.map(({ student }) => ({
        id: student.id, name: student.name, schoolName: student.schoolName, grade: student.grade,
        classes: student.enrollments.map(({ class: academyClass }) => mapClass(academyClass)),
        sessions: student.enrollments.flatMap(({ class: academyClass }) => (sessionsByClass.get(academyClass.id) ?? []).map((session) => mapSession(session, week.startOfToday))),
        recurring: student.enrollments.flatMap(({ class: academyClass }) => mapRecurring(academyClass)),
    }));
    return { childList, weekDays: week.weekDays };
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
export async function getStudentTimetableData(studentUserId: string, fallbackName: string) {
    const week = getWeek();
    const student = await prisma.student.findFirst({ where: { userId: studentUserId }, select: { id: true, name: true, schoolName: true, grade: true, enrollments: { where: { status: "ACTIVE", endedAt: null }, select: { class: { select: classSelection } } } } });
    if (!student) return { weekDays: week.weekDays, data: unlinkedData(fallbackName) };
    const classIds = student.enrollments.map(({ class: academyClass }) => academyClass.id);
    const sessions = classIds.length === 0 ? [] : await prisma.classSession.findMany({ where: { classId: { in: classIds }, startsAt: { gte: week.startOfWeek, lt: week.endOfWeek }, status: { in: ["SCHEDULED", "COMPLETED"] } }, orderBy: { startsAt: "asc" }, select: { ...sessionSelection, attendance: { where: { studentId: student.id }, take: 1, select: { status: true, checkInAt: true } } } });
    const data: StudentTimetableData = {
        linked: true, studentName: student.name, schoolName: student.schoolName, grade: student.grade,
        classes: student.enrollments.map(({ class: academyClass }) => mapClass(academyClass)),
        sessions: sessions.map((session) => ({ ...mapSession(session, week.startOfToday), attendanceStatus: (session.attendance[0]?.status as AttendanceStatus | null) ?? null, checkInAt: session.attendance[0]?.checkInAt?.toISOString() ?? null })),
        recurring: student.enrollments.flatMap(({ class: academyClass }) => mapRecurring(academyClass)),
    };
    return { weekDays: week.weekDays, data };
}

function getWeek() {
    const { startOfToday, startOfWeek, endOfWeek } = getKstWeekRange();
    const weekDays: WeekDay[] = DAY_KEYS.map((key, index) => { const date = new Date(startOfWeek); date.setDate(startOfWeek.getDate() + index); return { key, label: new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", weekday: "short" }).format(date), isToday: date >= startOfToday && date < new Date(startOfToday.getTime() + 86_400_000), dateIso: date.toISOString() }; });
    return { startOfToday, startOfWeek, endOfWeek, weekDays };
}

function mapClass(academyClass: { id: string; name: string; subject: string; teacher: { name: string } | null }) { return { id: academyClass.id, name: academyClass.name, subject: academyClass.subject, teacherName: academyClass.teacher?.name ?? null }; }
function mapSession(session: { id: string; startsAt: Date; endsAt: Date; classroom: string | null; status: string; class: { name: string; subject: string; teacher: { name: string } | null } }, today: Date): TimetableSession { return { id: session.id, className: session.class.name, subject: session.class.subject, teacherName: session.class.teacher?.name ?? null, classroom: session.classroom, dayKey: (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as WeekDayKey[])[session.startsAt.getDay()], timeLabel: `${formatKstTime(session.startsAt)}~${formatKstTime(session.endsAt)}`, startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), isToday: session.startsAt >= today && session.startsAt < new Date(today.getTime() + 86_400_000), status: session.status }; }
function mapRecurring(academyClass: { id: string; name: string; subject: string; schedule: unknown; teacher: { name: string } | null }): RecurringClassSchedule[] { return parseSchedule(academyClass.schedule).map((slot) => ({ classId: academyClass.id, className: academyClass.name, subject: academyClass.subject, teacherName: academyClass.teacher?.name ?? null, ...slot })); }
function parseSchedule(schedule: unknown): Array<{ day: WeekDayKey; start: string; end: string; classroom: string | null }> {
    if (!schedule || typeof schedule !== "object") return [];
    const slots = Array.isArray(schedule) ? schedule : Array.isArray((schedule as { slots?: unknown }).slots) ? (schedule as { slots: unknown[] }).slots : [];
    return slots.map((slot) => {
        if (!slot || typeof slot !== "object") return null;
        const row = slot as Record<string, unknown>;
        const day = String(row.day ?? row.weekday ?? "").toLowerCase();
        const start = String(row.start ?? row.startTime ?? "");
        const end = String(row.end ?? row.endTime ?? "");
        return DAY_KEYS.includes(day as WeekDayKey) && start && end ? { day: day as WeekDayKey, start, end, classroom: typeof row.classroom === "string" ? row.classroom : null } : null;
    }).filter((slot): slot is { day: WeekDayKey; start: string; end: string; classroom: string | null } => Boolean(slot));
}
function unlinkedData(studentName: string): StudentTimetableData { return { linked: false, studentName, schoolName: null, grade: null, classes: [], sessions: [], recurring: [] }; }
