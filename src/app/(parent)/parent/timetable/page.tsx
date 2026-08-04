import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatKstTime, getKstWeekRange } from "@/lib/date-kst";
import ParentTimetableScreen from "./ParentTimetableScreen";
import type {
    ParentTimetableChild,
    WeekDayKey,
} from "./ParentTimetableScreen";

export const dynamic = "force-dynamic";

const DAY_KEYS: WeekDayKey[] = [
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
];

function formatDayLabel(date: Date) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
        day: "numeric",
        weekday: "short",
    }).format(date);
}

function toWeekDayKey(date: Date): WeekDayKey {
    const jsDay = date.getDay();
    const map: WeekDayKey[] = [
        "sun",
        "mon",
        "tue",
        "wed",
        "thu",
        "fri",
        "sat",
    ];
    return map[jsDay];
}

function parseRecurringSchedule(schedule: unknown) {
    if (!schedule || typeof schedule !== "object") return [];
    const slots = Array.isArray(schedule)
        ? schedule
        : Array.isArray((schedule as { slots?: unknown }).slots)
          ? (schedule as { slots: unknown[] }).slots
          : [];

    return slots
        .map((slot) => {
            if (!slot || typeof slot !== "object") return null;
            const row = slot as Record<string, unknown>;
            const day = String(row.day ?? row.weekday ?? "").toLowerCase();
            const start = String(row.start ?? row.startTime ?? "");
            const end = String(row.end ?? row.endTime ?? "");
            if (!DAY_KEYS.includes(day as WeekDayKey) || !start || !end) {
                return null;
            }
            return {
                day: day as WeekDayKey,
                start,
                end,
                classroom:
                    typeof row.classroom === "string" ? row.classroom : null,
            };
        })
        .filter(
            (
                item,
            ): item is {
                day: WeekDayKey;
                start: string;
                end: string;
                classroom: string | null;
            } => Boolean(item),
        );
}

export default async function ParentTimetablePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    if (session.user.role !== "PARENT") redirect("/post-login");

    const { startOfToday, startOfWeek, endOfWeek } = getKstWeekRange();

    const weekDays = DAY_KEYS.map((key, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return {
            key,
            label: formatDayLabel(date),
            isToday:
                date >= startOfToday &&
                date < new Date(startOfToday.getTime() + 86400000),
            dateIso: date.toISOString(),
        };
    });

    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId: session.user.id, endedAt: null },
        orderBy: { linkedAt: "asc" },
        select: {
            student: {
                select: {
                    id: true,
                    name: true,
                    schoolName: true,
                    grade: true,
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        select: {
                            class: {
                                select: {
                                    id: true,
                                    name: true,
                                    subject: true,
                                    schedule: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const children: ParentTimetableChild[] = await Promise.all(
        links.map(async ({ student }) => {
            const classIds = student.enrollments.map((e) => e.class.id);

            const sessions =
                classIds.length === 0
                    ? []
                    : await prisma.classSession.findMany({
                          where: {
                              classId: { in: classIds },
                              startsAt: { gte: startOfWeek, lt: endOfWeek },
                              status: { in: ["SCHEDULED", "COMPLETED"] },
                          },
                          orderBy: { startsAt: "asc" },
                          select: {
                              id: true,
                              startsAt: true,
                              endsAt: true,
                              classroom: true,
                              status: true,
                              class: {
                                  select: {
                                      name: true,
                                      subject: true,
                                      teacher: { select: { name: true } },
                                  },
                              },
                          },
                      });

            const recurring = student.enrollments.flatMap((enrollment) => {
                const slots = parseRecurringSchedule(enrollment.class.schedule);
                return slots.map((slot) => ({
                    classId: enrollment.class.id,
                    className: enrollment.class.name,
                    subject: enrollment.class.subject,
                    teacherName: enrollment.class.teacher?.name ?? null,
                    ...slot,
                }));
            });

            return {
                id: student.id,
                name: student.name,
                schoolName: student.schoolName,
                grade: student.grade,
                classes: student.enrollments.map((e) => ({
                    id: e.class.id,
                    name: e.class.name,
                    subject: e.class.subject,
                    teacherName: e.class.teacher?.name ?? null,
                })),
                sessions: sessions.map((s) => ({
                    id: s.id,
                    className: s.class.name,
                    subject: s.class.subject,
                    teacherName: s.class.teacher?.name ?? null,
                    classroom: s.classroom,
                    dayKey: toWeekDayKey(s.startsAt),
                    timeLabel: `${formatKstTime(s.startsAt)}~${formatKstTime(s.endsAt)}`,
                    startsAt: s.startsAt.toISOString(),
                    endsAt: s.endsAt.toISOString(),
                    isToday:
                        s.startsAt >= startOfToday &&
                        s.startsAt <
                            new Date(startOfToday.getTime() + 86400000),
                    status: s.status,
                })),
                recurring,
            };
        }),
    );

    return (
        <ParentTimetableScreen childList={children} weekDays={weekDays} />
    );
}