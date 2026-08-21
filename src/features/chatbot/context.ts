import "server-only";

/**
 * 로그인 역할에 맞춰 챗봇이 쓸 수 있는 사실만 JSON 컨텍스트로 모은다.
 *
 * 호출: `app/api/chat/route.ts`.
 * 학부모·학생은 본인/자녀, 스태프는 스코프 + 질문에 나온 이름(focusedStudent)으로 범위를 제한한다.
 * 프롬프트는 이 스냅샷만 사실로 읽는다 (`prompt.ts`).
 *
 * 의도적으로 하지 않는 일:
 * - 이메일·전화·UUID를 JSON에 넣지 않는다.
 * - 스태프 목록 행에 오답·월 출결을 채우지 않는다 → 이름 매칭 시에만 `loadFocusedStudent`.
 *
 * 관련: `types.ts`, grades/attendance/timetable viewer-data.
 */

import {
    getParentGradesChildren,
    getStudentGradesData,
} from "@/features/grades/viewer-data";
import type {
    ParentGradesChild,
    StudentGradeRecord,
    StudentWrongNote,
} from "@/features/grades/types";
import type {
    ChatbotContext,
    ChatbotGrade,
    ChatbotWrongNote,
    ChatbotStudentSnapshot,
} from "./types";
import { getParentAttendanceChildren } from "@/features/attendance/parent-data";
import type { ParentAttendanceChild } from "@/features/attendance/parent-types";
import {
    getParentTimetableData,
    getStudentTimetableData,
} from "@/features/timetable/data";
import type {
    ParentTimetableChild,
    TimetableSession,
} from "@/features/timetable/types";
import { getKstDayRange, getKstRecentRange, getKstWeekRange } from "@/lib/date-kst";
import type { ChatbotAttendanceSummary, ChatbotSessionSummary } from "./types";
import { getStaffStudentsData } from "@/features/students/staff-data";
import type { StaffStudentRow } from "@/features/students/types";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import { prisma } from "@/lib/db";
import { getGradesManagementData } from "@/features/grades/data";
import { getStaffAttendanceSessions } from "@/features/attendance/staff-data";

function toDateLabel(iso: string) {
    return iso.slice(0, 10);
}

const GRADE_LIMIT = 10;
const WRONG_NOTE_LIMIT = 10;
const WEEK_SESSION_LIMIT = 10;
const STAFF_STUDENT_LIMIT = 20;

function currentMonthLabel() {
    return getKstDayRange().day.slice(0, 7);
}

function toChatbotGrade(row: StudentGradeRecord): ChatbotGrade {
    return {
        subject: row.subject,
        title: row.title,
        score: row.score,
        maxScore: row.maxScore,
        percent: row.percent,
        assessedAt: toDateLabel(row.assessedAt),
        className: row.className,
    };
}

function toChatbotSession(row: {
    startsAt: string;
    timeLabel: string;
    className: string;
    subject?: string;
    classroom: string | null;
    attendanceStatus?: ChatbotSessionSummary["attendanceStatus"];
}): ChatbotSessionSummary {
    return {
        date: toDateLabel(row.startsAt),
        timeLabel: row.timeLabel,
        className: row.className,
        subject: row.subject ?? "",
        classroom: row.classroom,
        attendanceStatus: row.attendanceStatus ?? null,
    };
}

function toAttendanceSummary(
    child: ParentAttendanceChild,
): ChatbotAttendanceSummary {
    return {
        monthLabel: currentMonthLabel(),
        present: child.monthCounts.present,
        late: child.monthCounts.late,
        absent: child.monthCounts.absent,
        earlyLeave: child.monthCounts.earlyLeave,
    };
}

function toTodaySession(
    child: ParentAttendanceChild,
): ChatbotSessionSummary | null {
    const highlight = child.todayHighlight;
    if (!highlight) {
        return null;
    }
    const todayRow = child.sessions.find((session) => session.isToday);

    return {
        date: getKstDayRange().day,
        timeLabel: highlight.timeLabel,
        className: highlight.className,
        subject: todayRow?.subject ?? "",
        classroom: highlight.classroom,
        attendanceStatus: highlight.status,
    };
}

function toChatbotWrongNote(row: StudentWrongNote): ChatbotWrongNote {
    return {
        subject: row.subject,
        questionNo: row.questionNo,
        status: row.status,
        createdAt: toDateLabel(row.createdAt),
    };
}

/** 학부모 성적·출결·시간표 행을 한 학생 스냅샷으로 합친다. */
function toStudentSnapshot(
    child: ParentGradesChild,
    attendance: ParentAttendanceChild | undefined,
    timetable: ParentTimetableChild | undefined,
): ChatbotStudentSnapshot {
    return {
        name: child.name,
        schoolName: child.schoolName,
        grade: child.grade,
        className: child.className,
        teacherName: child.teacherName,
        openWrongCount: child.openWrongCount,
        grades: child.grades.slice(0, GRADE_LIMIT).map(toChatbotGrade),
        wrongNotes: child.wrongNotes
            .slice(0, WRONG_NOTE_LIMIT)
            .map(toChatbotWrongNote),
        attendances: attendance ? toAttendanceSummary(attendance) : null,
        todaySession: attendance ? toTodaySession(attendance) : null,
        weekSessions: (timetable?.sessions ?? [])
            .slice(0, WEEK_SESSION_LIMIT)
            .map((session: TimetableSession) => toChatbotSession(session)),
    };
}

/**
 * 스태프 목록용 요약. 오답·출결·오늘 수업은 비운다.
 * 상세는 질문에서 이름이 1명으로 맞을 때만 loadFocusedStudent가 채운다.
 */
function toStaffStudentSnapshot(row: StaffStudentRow): ChatbotStudentSnapshot {
    const primaryClass = row.classes[0];

    return {
        name: row.name,
        schoolName: row.schoolName,
        grade: row.grade,
        className: primaryClass?.name ?? null,
        teacherName: primaryClass?.teacherName ?? null,
        openWrongCount: 0,
        grades: row.recentGrades.map((grade) => {
            const maxScore = grade.maxScore ?? 0;
            const score = grade.score;
            return {
                subject: grade.subject,
                title: grade.title,
                score,
                maxScore,
                percent:
                    maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
                assessedAt: toDateLabel(grade.assessedAt),
                className: primaryClass?.name ?? null,
            };
        }),
        wrongNotes: [],
        attendances: null,
        todaySession: null,
        weekSessions: [],
    };
}

/**
 * 연결된 자녀의 성적·출결·이번 주 시간표를 병렬로 모아 PARENT 컨텍스트를 만든다.
 */
export async function buildParentChatContext(
    parentUserId: string,
    viewerName: string,
): Promise<ChatbotContext> {
    const [children, attendanceChildren, timetable] = await Promise.all([
        getParentGradesChildren(parentUserId),
        getParentAttendanceChildren(parentUserId),
        getParentTimetableData(parentUserId),
    ]);
    const attendanceById = new Map(
        attendanceChildren.map((row) => [row.id, row]),
    );
    const timetableById = new Map(
        timetable.childList.map((row) => [row.id, row]),
    );

    return {
        role: "PARENT",
        viewerName,
        children: children.map((child) =>
            toStudentSnapshot(
                child,
                attendanceById.get(child.id),
                timetableById.get(child.id),
            ),
        ),
    };
}

/**
 * 학생 본인 성적·오답·이번 주 시간표.
 * 프로필 미연결이면 linked=false, student=null — 출결 횟수는 넣지 않는다(attendances=null).
 */
export async function buildStudentChatContext(
    studentUserId: string,
    viewerName: string,
): Promise<ChatbotContext> {
    const [data, timetable] = await Promise.all([
        getStudentGradesData(studentUserId, viewerName),
        getStudentTimetableData(studentUserId, viewerName),
    ]);

    if (!data.linked || !timetable.data.linked) {
        return {
            role: "STUDENT",
            viewerName,
            linked: false,
            student: null,
        };
    }

    const weekSessions = timetable.data.sessions
        .slice(0, WEEK_SESSION_LIMIT)
        .map((session: TimetableSession) => toChatbotSession(session));

    return {
        role: "STUDENT",
        viewerName,
        linked: true,
        student: {
            name: data.studentName,
            schoolName: data.schoolName,
            grade: data.grade,
            className: data.className,
            teacherName: data.teacherName,
            openWrongCount: data.openWrongCount,
            grades: data.grades.slice(0, GRADE_LIMIT).map(toChatbotGrade),
            wrongNotes: data.wrongNotes
                .slice(0, WRONG_NOTE_LIMIT)
                .map(toChatbotWrongNote),
            attendances: null,
            todaySession:
                weekSessions.find(
                    (session) => session.date === getKstDayRange().day,
                ) ?? null,
            weekSessions,
        },
    };
}

/**
 * 스코프 안 ENROLLED 학생 요약 + 질문 속 이름 포커스.
 * 동명이인이면 focusedStatus=ambiguous 로 한 명을 추측하지 않는다.
 */
export async function buildStaffChatContext(
    userId: string,
    viewerName: string,
    role: "DIRECTOR" | "TEACHER" | "STAFF",
    userMessage: string,
): Promise<ChatbotContext> {
    const staffScope = await getStaffScope(userId);
    const { startRecent } = getKstRecentRange(14);

    const { students } = await getStaffStudentsData({
        studentWhere: {
            status: "ENROLLED",
            ...studentScopeWhere(staffScope),
        },
        classWhere: {
            active: true,
            ...classScopeWhere(staffScope),
        },
        recentAttendanceStart: startRecent,
    });

    const scopedNames = await prisma.student.findMany({
        where: {
            status: "ENROLLED",
            ...studentScopeWhere(staffScope),
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    const mentioned = findMentionedStudents(userMessage, scopedNames);
    const focusedStatus = toFocusedStatus(mentioned.length);
    const truncated = students.length > STAFF_STUDENT_LIMIT;
    const focusedStudent =
        focusedStatus === "matched" && mentioned[0]
            ? await loadFocusedStudent(mentioned[0].id, staffScope)
            : null;
    const resolvedStatus =
        focusedStatus === "matched" && focusedStudent === null
            ? "none"
            : focusedStatus;

    return {
        role,
        viewerName,
        viewAllStudents: staffScope.viewAllStudents,
        students: students
            .slice(0, STAFF_STUDENT_LIMIT)
            .map(toStaffStudentSnapshot),
        truncated,
        focusedStudent,
        focusedStatus: resolvedStatus,
    };
}

/**
 * 질문 문자열에 스코프 안 이름이 포함되면 후보. 긴 이름 우선, id 중복 제거.
 * 2명 이상이면 ambiguous — 한 명을 고르지 않는다.
 */
function findMentionedStudents(
    message: string,
    rows: Array<{ id: string; name: string }>,
) {
    const hits = rows
        .filter((row) => row.name.length > 0 && message.includes(row.name))
        .sort((a, b) => b.name.length - a.name.length);

    return [...new Map(hits.map((row) => [row.id, row])).values()];
}

/** 0=none, 1=matched, 2+=ambiguous. not_found는 이 함수가 아니라 로드 실패에서 올 수 있다. */
function toFocusedStatus(count: number) {
    if (count === 0) return "none" as const;
    if (count === 1) return "matched" as const;
    return "ambiguous" as const;
}

/**
 * 포커스 1명의 성적·오답·이번 달 출결·이번 주 세션.
 * ENROLLED + 스코프 밖이면 null을 돌려 모델이 추측하지 않게 한다.
 */
async function loadFocusedStudent(
    studentId: string,
    staffScope: Awaited<ReturnType<typeof getStaffScope>>,
): Promise<ChatbotStudentSnapshot | null> {
    const allowed = await prisma.student.findFirst({
        where: {
            id: studentId,
            status: "ENROLLED",
            ...studentScopeWhere(staffScope),
        },
        select: {
            id: true,
            name: true,
            schoolName: true,
            grade: true,
            enrollments: {
                where: { status: "ACTIVE", endedAt: null },
                take: 1,
                select: {
                    class: {
                        select: {
                            name: true,
                            teacher: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    if (!allowed) return null;

    const data = await getGradesManagementData({
        studentWhere: {
            id: allowed.id,
            status: "ENROLLED",
            ...studentScopeWhere(staffScope),
        },
        gradeWhere: { studentId: allowed.id },
        wrongNoteWhere: { studentId: allowed.id },
    });

    if (data.students.length === 0) return null;

    const primaryClass = allowed.enrollments[0]?.class;
    const className = primaryClass?.name ?? null;
    const { day, endOfToday } = getKstDayRange();
    const { startOfWeek, endOfWeek } = getKstWeekRange();
    const startOfMonth = new Date(`${day.slice(0, 8)}01T00:00:00+09:00`);

    const [monthAttendance, staffWeekSessions] = await Promise.all([
        prisma.attendanceRecord.findMany({
            where: {
                studentId: allowed.id,
                session: {
                    startsAt: {
                        gte: startOfMonth,
                        lt: endOfToday,
                    },
                },
            },
            select: { status: true },
        }),
        getStaffAttendanceSessions({
            staffScope,
            startOfDay: startOfWeek,
            endOfDay: endOfWeek,
        }),
    ]);

    const monthlyCounts = countMonthlyAttendance(monthAttendance);
    const weekSessions = staffWeekSessions
        .filter((session) =>
            session.students.some((student) => student.id === allowed.id),
        )
        .map((session) => {
            const studentAttendance = session.students.find(
                (student) => student.id === allowed.id,
            );
            return toChatbotSession({
                startsAt: session.startsAt,
                timeLabel: session.timeLabel,
                className: session.className,
                subject: session.subject,
                classroom: session.classroom,
                attendanceStatus: studentAttendance?.status ?? null,
            });
        })
        .slice(0, WEEK_SESSION_LIMIT);
    const todaySession = weekSessions.find((session) => session.date === day) ?? null;

    return {
        name: allowed.name,
        schoolName: allowed.schoolName,
        grade: allowed.grade,
        className,
        teacherName: primaryClass?.teacher?.name ?? null,
        openWrongCount: data.wrongNotes.filter((note) => note.status === "OPEN")
            .length,
        grades: data.grades.slice(0, GRADE_LIMIT).map((grade) => ({
            subject: grade.subject,
            title: grade.title,
            score: grade.score,
            maxScore: grade.maxScore,
            percent:
                grade.maxScore > 0
                    ? Math.round((grade.score / grade.maxScore) * 100)
                    : null,
            assessedAt: toDateLabel(grade.assessedAt),
            className: grade.className,
        })),
        wrongNotes: data.wrongNotes.slice(0, WRONG_NOTE_LIMIT).map((note) => ({
            subject: null,
            questionNo: note.questionNo,
            status: note.status,
            createdAt: toDateLabel(note.createdAt),
        })),
        attendances: {
            monthLabel: currentMonthLabel(),
            present: monthlyCounts.present,
            late: monthlyCounts.late,
            absent: monthlyCounts.absent,
            earlyLeave: monthlyCounts.earlyLeave,
        },
        todaySession,
        weekSessions,
    };
}

/** PRESENT/LATE/ABSENT/EARLY_LEAVE만 센다. EXCUSED는 이 요약에 넣지 않는다. */
function countMonthlyAttendance(attendance: Array<{ status: string }>) {
    const counts = { present: 0, late: 0, absent: 0, earlyLeave: 0 };

    for (const record of attendance) {
        if (record.status === "PRESENT") counts.present++;
        if (record.status === "LATE") counts.late++;
        if (record.status === "ABSENT") counts.absent++;
        if (record.status === "EARLY_LEAVE") counts.earlyLeave++;
    }

    return counts;
}
