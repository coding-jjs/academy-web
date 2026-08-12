import "server-only";

import { prisma } from "@/lib/db";
import { formatKstTime, getKstWeekRange } from "@/lib/date-kst";
import type { AttendanceStatus } from "@/features/attendance/types";
import type { ParentTimetableChild, RecurringClassSchedule, StudentTimetableData, TimetableSession, WeekDay, WeekDayKey } from "@/features/timetable/types";

const DAY_KEYS: WeekDayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const classSelection = { id: true, name: true, subject: true, schedule: true, teacher: { select: { name: true } } } as const;
const sessionSelection = { id: true, classId: true, startsAt: true, endsAt: true, classroom: true, status: true, class: { select: { name: true, subject: true, teacher: { select: { name: true } } } } } as const;

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
function parseSchedule(schedule: unknown): Array<{ day: WeekDayKey; start: string; end: string; classroom: string | null }> { if (!schedule || typeof schedule !== "object") return []; const slots = Array.isArray(schedule) ? schedule : Array.isArray((schedule as { slots?: unknown }).slots) ? (schedule as { slots: unknown[] }).slots : []; return slots.map((slot) => { if (!slot || typeof slot !== "object") return null; const row = slot as Record<string, unknown>; const day = String(row.day ?? row.weekday ?? "").toLowerCase(); const start = String(row.start ?? row.startTime ?? ""); const end = String(row.end ?? row.endTime ?? ""); return DAY_KEYS.includes(day as WeekDayKey) && start && end ? { day: day as WeekDayKey, start, end, classroom: typeof row.classroom === "string" ? row.classroom : null } : null; }).filter((slot): slot is { day: WeekDayKey; start: string; end: string; classroom: string | null } => Boolean(slot)); }
function unlinkedData(studentName: string): StudentTimetableData { return { linked: false, studentName, schoolName: null, grade: null, classes: [], sessions: [], recurring: [] }; }
