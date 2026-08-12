import type { AttendanceStatus } from "@/features/attendance/types";

export type WeekDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type WeekDay = { key: WeekDayKey; label: string; isToday: boolean; dateIso: string };
export type TimetableClass = { id: string; name: string; subject: string; teacherName: string | null };
export type RecurringClassSchedule = { classId: string; className: string; subject: string; teacherName: string | null; day: WeekDayKey; start: string; end: string; classroom: string | null };
export type TimetableSession = { id: string; className: string; subject: string; teacherName: string | null; classroom: string | null; dayKey: WeekDayKey; timeLabel: string; startsAt: string; endsAt: string; isToday: boolean; status: string };
export type ParentTimetableChild = { id: string; name: string; schoolName: string | null; grade: string | null; classes: TimetableClass[]; sessions: TimetableSession[]; recurring: RecurringClassSchedule[] };
export type StudentTimetableData = { linked: boolean; studentName: string; schoolName: string | null; grade: string | null; classes: TimetableClass[]; sessions: Array<TimetableSession & { attendanceStatus: AttendanceStatus | null; checkInAt: string | null }>; recurring: RecurringClassSchedule[] };
