import "server-only"; // 서버 전용. 클라이언트 번들에 안 넣는다.

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

import { // 의존성. JSON-only 사실. 이메일·UUID 없음.
    getParentGradesChildren, // JSON-only 사실. 이메일·UUID 없음.
    getStudentGradesData, // JSON-only 사실. 이메일·UUID 없음.
} from "@/features/grades/viewer-data"; // JSON-only 사실. 이메일·UUID 없음.
import type { // 타입만. JSON-only 사실. 이메일·UUID 없음.
    ParentGradesChild, // JSON-only 사실. 이메일·UUID 없음.
    StudentGradeRecord, // JSON-only 사실. 이메일·UUID 없음.
    StudentWrongNote, // JSON-only 사실. 이메일·UUID 없음.
} from "@/features/grades/types"; // JSON-only 사실. 이메일·UUID 없음.
import type { // 타입만. JSON-only 사실. 이메일·UUID 없음.
    ChatbotContext, // JSON-only 사실. 이메일·UUID 없음.
    ChatbotGrade, // JSON-only 사실. 이메일·UUID 없음.
    ChatbotWrongNote, // JSON-only 사실. 이메일·UUID 없음.
    ChatbotStudentSnapshot, // JSON-only 사실. 이메일·UUID 없음.
} from "./types"; // JSON-only 사실. 이메일·UUID 없음.
import { getParentAttendanceChildren } from "@/features/attendance/parent-data"; // 의존성. JSON-only 사실. 이메일·UUID 없음.
import type { ParentAttendanceChild } from "@/features/attendance/parent-types"; // 타입만. JSON-only 사실. 이메일·UUID 없음.
import { // 의존성. JSON-only 사실. 이메일·UUID 없음.
    getParentTimetableData, // JSON-only 사실. 이메일·UUID 없음.
    getStudentTimetableData, // JSON-only 사실. 이메일·UUID 없음.
} from "@/features/timetable/data"; // JSON-only 사실. 이메일·UUID 없음.
import type { // 타입만. JSON-only 사실. 이메일·UUID 없음.
    ParentTimetableChild, // JSON-only 사실. 이메일·UUID 없음.
    TimetableSession, // JSON-only 사실. 이메일·UUID 없음.
} from "@/features/timetable/types"; // JSON-only 사실. 이메일·UUID 없음.
import { getKstDayRange, getKstRecentRange, getKstWeekRange } from "@/lib/date-kst"; // 의존성. JSON-only 사실. 이메일·UUID 없음.
import type { ChatbotAttendanceSummary, ChatbotSessionSummary } from "./types"; // 타입만. JSON-only 사실. 이메일·UUID 없음.
import { getStaffStudentsData } from "@/features/students/staff-data"; // 의존성. JSON-only 사실. 이메일·UUID 없음.
import type { StaffStudentRow } from "@/features/students/types"; // 타입만. JSON-only 사실. 이메일·UUID 없음.
import { // 의존성. JSON-only 사실. 이메일·UUID 없음.
    classScopeWhere, // JSON-only 사실. 이메일·UUID 없음.
    getStaffScope, // JSON-only 사실. 이메일·UUID 없음.
    studentScopeWhere, // JSON-only 사실. 이메일·UUID 없음.
} from "@/lib/staff-scope"; // JSON-only 사실. 이메일·UUID 없음.
import { prisma } from "@/lib/db"; // 의존성. JSON-only 사실. 이메일·UUID 없음.
import { getGradesManagementData } from "@/features/grades/data"; // 의존성. JSON-only 사실. 이메일·UUID 없음.
import { getStaffAttendanceSessions } from "@/features/attendance/staff-data"; // 의존성. JSON-only 사실. 이메일·UUID 없음.

function toDateLabel(iso: string) { // toDateLabel. JSON-only 사실. 이메일·UUID 없음.
    return iso.slice(0, 10); // YYYY-MM-DD만. 프롬프트에 시각·타임존을 넣지 않는다.
}

const GRADE_LIMIT = 10; // GRADE_LIMIT. JSON-only 사실. 이메일·UUID 없음.
const WRONG_NOTE_LIMIT = 10; // WRONG_NOTE_LIMIT. JSON-only 사실. 이메일·UUID 없음.
const WEEK_SESSION_LIMIT = 10; // WEEK_SESSION_LIMIT. JSON-only 사실. 이메일·UUID 없음.
const STAFF_STUDENT_LIMIT = 20; // 스태프 목록은 20명 요약. 나머지는 truncated=true 후 이름 질문으로 포커스.

function currentMonthLabel() { // currentMonthLabel. JSON-only 사실. 이메일·UUID 없음.
    return getKstDayRange().day.slice(0, 7); // KST 오늘에서 YYYY-MM. 출결 요약 monthLabel.
}

function toChatbotGrade(row: StudentGradeRecord): ChatbotGrade { // toChatbotGrade. JSON-only 사실. 이메일·UUID 없음.
    return { // 화면용 성적 행을 챗봇 JSON 필드로. UUID는 넣지 않는다.
        subject: row.subject, // subject. JSON-only 사실. 이메일·UUID 없음.
        title: row.title, // title. JSON-only 사실. 이메일·UUID 없음.
        score: row.score, // score. JSON-only 사실. 이메일·UUID 없음.
        maxScore: row.maxScore, // maxScore. JSON-only 사실. 이메일·UUID 없음.
        percent: row.percent, // percent. JSON-only 사실. 이메일·UUID 없음.
        assessedAt: toDateLabel(row.assessedAt), // assessedAt. JSON-only 사실. 이메일·UUID 없음.
        className: row.className, // className. JSON-only 사실. 이메일·UUID 없음.
    };
}

function toChatbotSession(row: { // toChatbotSession. JSON-only 사실. 이메일·UUID 없음.
    startsAt: string; // startsAt. JSON-only 사실. 이메일·UUID 없음.
    timeLabel: string; // timeLabel. JSON-only 사실. 이메일·UUID 없음.
    className: string; // className. JSON-only 사실. 이메일·UUID 없음.
    subject?: string; // JSON-only 사실. 이메일·UUID 없음.
    classroom: string | null; // classroom. JSON-only 사실. 이메일·UUID 없음.
    attendanceStatus?: ChatbotSessionSummary["attendanceStatus"]; // JSON-only 사실. 이메일·UUID 없음.
}): ChatbotSessionSummary { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    return { // 오늘/이번 주 한 칸. attendanceStatus 없으면 null(미체크).
        date: toDateLabel(row.startsAt), // date. JSON-only 사실. 이메일·UUID 없음.
        timeLabel: row.timeLabel, // timeLabel. JSON-only 사실. 이메일·UUID 없음.
        className: row.className, // className. JSON-only 사실. 이메일·UUID 없음.
        subject: row.subject ?? "", // subject. JSON-only 사실. 이메일·UUID 없음.
        classroom: row.classroom, // classroom. JSON-only 사실. 이메일·UUID 없음.
        attendanceStatus: row.attendanceStatus ?? null, // attendanceStatus. JSON-only 사실. 이메일·UUID 없음.
    };
}

function toAttendanceSummary( // toAttendanceSummary. JSON-only 사실. 이메일·UUID 없음.
    child: ParentAttendanceChild, // child. JSON-only 사실. 이메일·UUID 없음.
): ChatbotAttendanceSummary { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    return { // 이번 달 횟수만. EXCUSED는 이 요약에 넣지 않는다.
        monthLabel: currentMonthLabel(), // monthLabel. JSON-only 사실. 이메일·UUID 없음.
        present: child.monthCounts.present, // present. JSON-only 사실. 이메일·UUID 없음.
        late: child.monthCounts.late, // late. JSON-only 사실. 이메일·UUID 없음.
        absent: child.monthCounts.absent, // absent. JSON-only 사실. 이메일·UUID 없음.
        earlyLeave: child.monthCounts.earlyLeave, // earlyLeave. JSON-only 사실. 이메일·UUID 없음.
    };
}

function toTodaySession( // toTodaySession. JSON-only 사실. 이메일·UUID 없음.
    child: ParentAttendanceChild, // child. JSON-only 사실. 이메일·UUID 없음.
): ChatbotSessionSummary | null { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    const highlight = child.todayHighlight; // highlight. JSON-only 사실. 이메일·UUID 없음.
    if (!highlight) { // 가드. JSON-only 사실. 이메일·UUID 없음.
        return null; // 프롬프트가 "오늘 수업 없음"으로 답하게.
    }
    const todayRow = child.sessions.find((session) => session.isToday); // todayRow. JSON-only 사실. 이메일·UUID 없음.

    return { // 반환. JSON-only 사실. 이메일·UUID 없음.
        date: getKstDayRange().day, // date. JSON-only 사실. 이메일·UUID 없음.
        timeLabel: highlight.timeLabel, // timeLabel. JSON-only 사실. 이메일·UUID 없음.
        className: highlight.className, // className. JSON-only 사실. 이메일·UUID 없음.
        subject: todayRow?.subject ?? "", // subject. JSON-only 사실. 이메일·UUID 없음.
        classroom: highlight.classroom, // classroom. JSON-only 사실. 이메일·UUID 없음.
        attendanceStatus: highlight.status, // attendanceStatus. JSON-only 사실. 이메일·UUID 없음.
    };
}

function toChatbotWrongNote(row: StudentWrongNote): ChatbotWrongNote { // toChatbotWrongNote. JSON-only 사실. 이메일·UUID 없음.
    return { // 문항 본문 없이 번호·상태만.
        subject: row.subject, // subject. JSON-only 사실. 이메일·UUID 없음.
        questionNo: row.questionNo, // questionNo. JSON-only 사실. 이메일·UUID 없음.
        status: row.status, // status. JSON-only 사실. 이메일·UUID 없음.
        createdAt: toDateLabel(row.createdAt), // createdAt. JSON-only 사실. 이메일·UUID 없음.
    };
}

/** 학부모 성적·출결·시간표 행을 한 학생 스냅샷으로 합친다. */
function toStudentSnapshot( // toStudentSnapshot. JSON-only 사실. 이메일·UUID 없음.
    child: ParentGradesChild, // child. JSON-only 사실. 이메일·UUID 없음.
    attendance: ParentAttendanceChild | undefined, // attendance. JSON-only 사실. 이메일·UUID 없음.
    timetable: ParentTimetableChild | undefined, // timetable. JSON-only 사실. 이메일·UUID 없음.
): ChatbotStudentSnapshot { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    return { // 학부모 성적·출결·시간표 행을 한 학생 JSON으로 합친다. 건수 상한 적용.
        name: child.name, // name. JSON-only 사실. 이메일·UUID 없음.
        schoolName: child.schoolName, // schoolName. JSON-only 사실. 이메일·UUID 없음.
        grade: child.grade, // grade. JSON-only 사실. 이메일·UUID 없음.
        className: child.className, // className. JSON-only 사실. 이메일·UUID 없음.
        teacherName: child.teacherName, // teacherName. JSON-only 사실. 이메일·UUID 없음.
        openWrongCount: child.openWrongCount, // openWrongCount. JSON-only 사실. 이메일·UUID 없음.
        grades: child.grades.slice(0, GRADE_LIMIT).map(toChatbotGrade), // grades. JSON-only 사실. 이메일·UUID 없음.
        wrongNotes: child.wrongNotes // wrongNotes. JSON-only 사실. 이메일·UUID 없음.
            .slice(0, WRONG_NOTE_LIMIT) // JSON-only 사실. 이메일·UUID 없음.
            .map(toChatbotWrongNote), // JSON-only 사실. 이메일·UUID 없음.
        attendances: attendance ? toAttendanceSummary(attendance) : null, // attendances. JSON-only 사실. 이메일·UUID 없음.
        todaySession: attendance ? toTodaySession(attendance) : null, // todaySession. JSON-only 사실. 이메일·UUID 없음.
        weekSessions: (timetable?.sessions ?? []) // weekSessions. JSON-only 사실. 이메일·UUID 없음.
            .slice(0, WEEK_SESSION_LIMIT) // JSON-only 사실. 이메일·UUID 없음.
            .map((session: TimetableSession) => toChatbotSession(session)), // JSON-only 사실. 이메일·UUID 없음.
    };
}

/**
 * 스태프 목록용 요약. 오답·출결·오늘 수업은 비운다.
 * 상세는 질문에서 이름이 1명으로 맞을 때만 loadFocusedStudent가 채운다.
 */
function toStaffStudentSnapshot(row: StaffStudentRow): ChatbotStudentSnapshot { // toStaffStudentSnapshot. JSON-only 사실. 이메일·UUID 없음.
    const primaryClass = row.classes[0]; // primaryClass. JSON-only 사실. 이메일·UUID 없음.

    return { // 목록 행은 요약만. 오답·월출결·시간표는 focusedStudent에서만 채운다.
        name: row.name, // name. JSON-only 사실. 이메일·UUID 없음.
        schoolName: row.schoolName, // schoolName. JSON-only 사실. 이메일·UUID 없음.
        grade: row.grade, // grade. JSON-only 사실. 이메일·UUID 없음.
        className: primaryClass?.name ?? null, // className. JSON-only 사실. 이메일·UUID 없음.
        teacherName: primaryClass?.teacherName ?? null, // teacherName. JSON-only 사실. 이메일·UUID 없음.
        openWrongCount: 0, // 목록은 0. 상세는 focusedStudent.
        grades: row.recentGrades.map((grade) => { // grades. JSON-only 사실. 이메일·UUID 없음.
            const maxScore = grade.maxScore ?? 0; // maxScore. JSON-only 사실. 이메일·UUID 없음.
            const score = grade.score; // score. JSON-only 사실. 이메일·UUID 없음.
            return { // 반환. JSON-only 사실. 이메일·UUID 없음.
                subject: grade.subject, // subject. JSON-only 사실. 이메일·UUID 없음.
                title: grade.title, // title. JSON-only 사실. 이메일·UUID 없음.
                score, // JSON-only 사실. 이메일·UUID 없음.
                maxScore, // JSON-only 사실. 이메일·UUID 없음.
                percent: // percent. JSON-only 사실. 이메일·UUID 없음.
                    maxScore > 0 ? Math.round((score / maxScore) * 100) : null, // JSON-only 사실. 이메일·UUID 없음.
                assessedAt: toDateLabel(grade.assessedAt), // assessedAt. JSON-only 사실. 이메일·UUID 없음.
                className: primaryClass?.name ?? null, // className. JSON-only 사실. 이메일·UUID 없음.
            };
        }),
        wrongNotes: [], // wrongNotes. JSON-only 사실. 이메일·UUID 없음.
        attendances: null, // attendances. JSON-only 사실. 이메일·UUID 없음.
        todaySession: null, // todaySession. JSON-only 사실. 이메일·UUID 없음.
        weekSessions: [], // weekSessions. JSON-only 사실. 이메일·UUID 없음.
    };
}

/**
 * 연결된 자녀의 성적·출결·이번 주 시간표를 병렬로 모아 PARENT 컨텍스트를 만든다.
 */
export async function buildParentChatContext( // buildParentChatContext. JSON-only 사실. 이메일·UUID 없음.
    parentUserId: string, // parentUserId. JSON-only 사실. 이메일·UUID 없음.
    viewerName: string, // viewerName. JSON-only 사실. 이메일·UUID 없음.
): Promise<ChatbotContext> { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    const [children, attendanceChildren, timetable] = await Promise.all([ // 프롬프트는 이 스냅샷만 사실로 읽는다.
        getParentGradesChildren(parentUserId), // JSON-only 사실. 이메일·UUID 없음.
        getParentAttendanceChildren(parentUserId), // JSON-only 사실. 이메일·UUID 없음.
        getParentTimetableData(parentUserId), // JSON-only 사실. 이메일·UUID 없음.
    ]);
    const attendanceById = new Map( // 자녀 id로 출결·시간표를 붙인다.
        attendanceChildren.map((row) => [row.id, row]), // JSON-only 사실. 이메일·UUID 없음.
    );
    const timetableById = new Map( // timetableById. JSON-only 사실. 이메일·UUID 없음.
        timetable.childList.map((row) => [row.id, row]), // JSON-only 사실. 이메일·UUID 없음.
    );

    return { // 반환. JSON-only 사실. 이메일·UUID 없음.
        role: "PARENT", // role. JSON-only 사실. 이메일·UUID 없음.
        viewerName, // JSON-only 사실. 이메일·UUID 없음.
        children: children.map((child) => // children. JSON-only 사실. 이메일·UUID 없음.
            toStudentSnapshot( // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
                child, // JSON-only 사실. 이메일·UUID 없음.
                attendanceById.get(child.id), // JSON-only 사실. 이메일·UUID 없음.
                timetableById.get(child.id), // JSON-only 사실. 이메일·UUID 없음.
            ),
        ),
    };
}

/**
 * 학생 본인 성적·오답·이번 주 시간표.
 * 프로필 미연결이면 linked=false, student=null — 출결 횟수는 넣지 않는다(attendances=null).
 */
export async function buildStudentChatContext( // buildStudentChatContext. JSON-only 사실. 이메일·UUID 없음.
    studentUserId: string, // studentUserId. JSON-only 사실. 이메일·UUID 없음.
    viewerName: string, // viewerName. JSON-only 사실. 이메일·UUID 없음.
): Promise<ChatbotContext> { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    const [data, timetable] = await Promise.all([ // [data, timetable] 시작. JSON-only 사실. 이메일·UUID 없음.
        getStudentGradesData(studentUserId, viewerName), // JSON-only 사실. 이메일·UUID 없음.
        getStudentTimetableData(studentUserId, viewerName), // JSON-only 사실. 이메일·UUID 없음.
    ]);

    if (!data.linked || !timetable.data.linked) { // 가드. JSON-only 사실. 이메일·UUID 없음.
        return { // 프로필이 없으면 linked=false, student=null — 출결 횟수를 넣지 않는다.
            role: "STUDENT", // role. JSON-only 사실. 이메일·UUID 없음.
            viewerName, // JSON-only 사실. 이메일·UUID 없음.
            linked: false, // linked 선택.
            student: null, // student. JSON-only 사실. 이메일·UUID 없음.
        };
    }

    const weekSessions = timetable.data.sessions // weekSessions. JSON-only 사실. 이메일·UUID 없음.
        .slice(0, WEEK_SESSION_LIMIT) // JSON-only 사실. 이메일·UUID 없음.
        .map((session: TimetableSession) => toChatbotSession(session)); // buildStudentChatContext 끝.

    return { // 반환. JSON-only 사실. 이메일·UUID 없음.
        role: "STUDENT", // role. JSON-only 사실. 이메일·UUID 없음.
        viewerName, // JSON-only 사실. 이메일·UUID 없음.
        linked: true, // linked 선택.
        student: { // student. JSON-only 사실. 이메일·UUID 없음.
            name: data.studentName, // name. JSON-only 사실. 이메일·UUID 없음.
            schoolName: data.schoolName, // schoolName. JSON-only 사실. 이메일·UUID 없음.
            grade: data.grade, // grade. JSON-only 사실. 이메일·UUID 없음.
            className: data.className, // className. JSON-only 사실. 이메일·UUID 없음.
            teacherName: data.teacherName, // teacherName. JSON-only 사실. 이메일·UUID 없음.
            openWrongCount: data.openWrongCount, // openWrongCount. JSON-only 사실. 이메일·UUID 없음.
            grades: data.grades.slice(0, GRADE_LIMIT).map(toChatbotGrade), // grades. JSON-only 사실. 이메일·UUID 없음.
            wrongNotes: data.wrongNotes // wrongNotes. JSON-only 사실. 이메일·UUID 없음.
                .slice(0, WRONG_NOTE_LIMIT) // JSON-only 사실. 이메일·UUID 없음.
                .map(toChatbotWrongNote), // JSON-only 사실. 이메일·UUID 없음.
            attendances: null, // 월 집계는 넣지 않는다. 오늘 수업은 주간 시간표에서 고른다.
            todaySession: // todaySession. JSON-only 사실. 이메일·UUID 없음.
                weekSessions.find( // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
                    (session) => session.date === getKstDayRange().day, // JSON-only 사실. 이메일·UUID 없음.
                ) ?? null, // JSON-only 사실. 이메일·UUID 없음.
            weekSessions, // JSON-only 사실. 이메일·UUID 없음.
        },
    };
}

/**
 * 스코프 안 ENROLLED 학생 요약 + 질문 속 이름 포커스.
 * 동명이인이면 focusedStatus=ambiguous 로 한 명을 추측하지 않는다.
 */
export async function buildStaffChatContext( // buildStaffChatContext. JSON-only 사실. 이메일·UUID 없음.
    userId: string, // userId. JSON-only 사실. 이메일·UUID 없음.
    viewerName: string, // viewerName. JSON-only 사실. 이메일·UUID 없음.
    role: "DIRECTOR" | "TEACHER" | "STAFF", // role. JSON-only 사실. 이메일·UUID 없음.
    userMessage: string, // userMessage. JSON-only 사실. 이메일·UUID 없음.
): Promise<ChatbotContext> { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    const staffScope = await getStaffScope(userId); // 담당 반 또는 전교. 질문 속 이름 포커스는 아래에서 한 명만 상세 로드.
    const { startRecent } = getKstRecentRange(14); // { startRecent }. JSON-only 사실. 이메일·UUID 없음.

    const { students } = await getStaffStudentsData({ // 재원(ENROLLED)만. 퇴원·휴원은 챗봇 목록에 넣지 않는다.
        studentWhere: { // studentWhere. JSON-only 사실. 이메일·UUID 없음.
            status: "ENROLLED", // status. JSON-only 사실. 이메일·UUID 없음.
            ...studentScopeWhere(staffScope), // 전개. JSON-only 사실. 이메일·UUID 없음.
        },
        classWhere: { // classWhere. JSON-only 사실. 이메일·UUID 없음.
            active: true, // active 선택.
            ...classScopeWhere(staffScope), // 전개. JSON-only 사실. 이메일·UUID 없음.
        },
        recentAttendanceStart: startRecent, // recentAttendanceStart. JSON-only 사실. 이메일·UUID 없음.
    });

    const scopedNames = await prisma.student.findMany({ // 질문 문자열 매칭용. 스코프 안 ENROLLED만.
        where: { // 필터. JSON-only 사실. 이메일·UUID 없음.
            status: "ENROLLED", // status. JSON-only 사실. 이메일·UUID 없음.
            ...studentScopeWhere(staffScope), // 전개. JSON-only 사실. 이메일·UUID 없음.
        },
        select: { id: true, name: true }, // select 필드. JSON-only 사실. 이메일·UUID 없음.
        orderBy: { name: "asc" }, // orderBy 필드. JSON-only 사실. 이메일·UUID 없음.
    });

    const mentioned = findMentionedStudents(userMessage, scopedNames); // mentioned. JSON-only 사실. 이메일·UUID 없음.
    const focusedStatus = toFocusedStatus(mentioned.length); // 동명이인이면 ambiguous — 한 명을 추측하지 않는다.
    const truncated = students.length > STAFF_STUDENT_LIMIT; // truncated. JSON-only 사실. 이메일·UUID 없음.
    const focusedStudent = // focusedStudent. JSON-only 사실. 이메일·UUID 없음.
        focusedStatus === "matched" && mentioned[0] // JSON-only 사실. 이메일·UUID 없음.
            ? await loadFocusedStudent(mentioned[0].id, staffScope) // 삼항. JSON-only 사실. 이메일·UUID 없음.
            : null; // 삼항 나머지. JSON-only 사실. 이메일·UUID 없음.
    const resolvedStatus = // resolvedStatus. JSON-only 사실. 이메일·UUID 없음.
        focusedStatus === "matched" && focusedStudent === null // JSON-only 사실. 이메일·UUID 없음.
            ? "none" // 매칭됐는데 상세 로드 실패면 none. 없는 학생을 지어내지 않는다.
            : focusedStatus; // 삼항 나머지. JSON-only 사실. 이메일·UUID 없음.

    return { // 반환. JSON-only 사실. 이메일·UUID 없음.
        role, // JSON-only 사실. 이메일·UUID 없음.
        viewerName, // JSON-only 사실. 이메일·UUID 없음.
        viewAllStudents: staffScope.viewAllStudents, // viewAllStudents. JSON-only 사실. 이메일·UUID 없음.
        students: students // students. JSON-only 사실. 이메일·UUID 없음.
            .slice(0, STAFF_STUDENT_LIMIT) // JSON-only 사실. 이메일·UUID 없음.
            .map(toStaffStudentSnapshot), // JSON-only 사실. 이메일·UUID 없음.
        truncated, // JSON-only 사실. 이메일·UUID 없음.
        focusedStudent, // JSON-only 사실. 이메일·UUID 없음.
        focusedStatus: resolvedStatus, // focusedStatus. JSON-only 사실. 이메일·UUID 없음.
    };
}

/**
 * 질문 문자열에 스코프 안 이름이 포함되면 후보. 긴 이름 우선, id 중복 제거.
 * 2명 이상이면 ambiguous — 한 명을 고르지 않는다.
 */
function findMentionedStudents( // findMentionedStudents. JSON-only 사실. 이메일·UUID 없음.
    message: string, // message. JSON-only 사실. 이메일·UUID 없음.
    rows: Array<{ id: string; name: string }>, // rows. JSON-only 사실. 이메일·UUID 없음.
) { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    const hits = rows // hits. JSON-only 사실. 이메일·UUID 없음.
        .filter((row) => row.name.length > 0 && message.includes(row.name)) // JSON-only 사실. 이메일·UUID 없음.
        .sort((a, b) => b.name.length - a.name.length); // 긴 이름 우선.

    return [...new Map(hits.map((row) => [row.id, row])).values()]; // id 중복 제거.
}

/** 0=none, 1=matched, 2+=ambiguous. not_found는 이 함수가 아니라 로드 실패에서 올 수 있다. */
function toFocusedStatus(count: number) { // toFocusedStatus. JSON-only 사실. 이메일·UUID 없음.
    if (count === 0) return "none" as const; // 가드. JSON-only 사실. 이메일·UUID 없음.
    if (count === 1) return "matched" as const; // 가드. JSON-only 사실. 이메일·UUID 없음.
    return "ambiguous" as const; // 한 명을 추측하지 않는다.
}

/**
 * 포커스 1명의 성적·오답·이번 달 출결·이번 주 세션.
 * ENROLLED + 스코프 밖이면 null을 돌려 모델이 추측하지 않게 한다.
 */
async function loadFocusedStudent( // loadFocusedStudent. JSON-only 사실. 이메일·UUID 없음.
    studentId: string, // studentId. JSON-only 사실. 이메일·UUID 없음.
    staffScope: Awaited<ReturnType<typeof getStaffScope>>, // staffScope. JSON-only 사실. 이메일·UUID 없음.
): Promise<ChatbotStudentSnapshot | null> { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
    const allowed = await prisma.student.findFirst({ // allowed 시작. JSON-only 사실. 이메일·UUID 없음.
        where: { // 필터. JSON-only 사실. 이메일·UUID 없음.
            id: studentId, // id. JSON-only 사실. 이메일·UUID 없음.
            status: "ENROLLED", // status. JSON-only 사실. 이메일·UUID 없음.
            ...studentScopeWhere(staffScope), // 스코프 밖이면 null을 돌려 모델이 추측하지 않게 한다.
        },
        select: { // select 필드. JSON-only 사실. 이메일·UUID 없음.
            id: true, // id 선택.
            name: true, // name 선택.
            schoolName: true, // schoolName 선택.
            grade: true, // grade 선택.
            enrollments: { // enrollments. JSON-only 사실. 이메일·UUID 없음.
                where: { status: "ACTIVE", endedAt: null }, // 필터. JSON-only 사실. 이메일·UUID 없음.
                take: 1, // 조회 상한.
                select: { // select 필드. JSON-only 사실. 이메일·UUID 없음.
                    class: { // class. JSON-only 사실. 이메일·UUID 없음.
                        select: { // select 필드. JSON-only 사실. 이메일·UUID 없음.
                            name: true, // name 선택.
                            teacher: { select: { name: true } }, // teacher. JSON-only 사실. 이메일·UUID 없음.
                        },
                    },
                },
            },
        },
    });

    if (!allowed) return null; // 가드. JSON-only 사실. 이메일·UUID 없음.

    const data = await getGradesManagementData({ // 성적·오답. 목록 요약이 아니라 이 학생만.
        studentWhere: { // studentWhere. JSON-only 사실. 이메일·UUID 없음.
            id: allowed.id, // id. JSON-only 사실. 이메일·UUID 없음.
            status: "ENROLLED", // status. JSON-only 사실. 이메일·UUID 없음.
            ...studentScopeWhere(staffScope), // 전개. JSON-only 사실. 이메일·UUID 없음.
        },
        gradeWhere: { studentId: allowed.id }, // gradeWhere. JSON-only 사실. 이메일·UUID 없음.
        wrongNoteWhere: { studentId: allowed.id }, // wrongNoteWhere. JSON-only 사실. 이메일·UUID 없음.
    });

    if (data.students.length === 0) return null; // 가드. JSON-only 사실. 이메일·UUID 없음.

    const primaryClass = allowed.enrollments[0]?.class; // primaryClass. JSON-only 사실. 이메일·UUID 없음.
    const className = primaryClass?.name ?? null; // className. JSON-only 사실. 이메일·UUID 없음.
    const { day, endOfToday } = getKstDayRange(); // { day, endOfToday }. JSON-only 사실. 이메일·UUID 없음.
    const { startOfWeek, endOfWeek } = getKstWeekRange(); // { startOfWeek, endOfWeek }. JSON-only 사실. 이메일·UUID 없음.
    const startOfMonth = new Date(`${day.slice(0, 8)}01T00:00:00+09:00`); // startOfMonth. JSON-only 사실. 이메일·UUID 없음.

    const [monthAttendance, staffWeekSessions] = await Promise.all([ // 이번 달 출결 + 이번 주 세션. 프롬프트 JSON의 유일한 사실 출처.
        prisma.attendanceRecord.findMany({ // Prisma 조회/쓰기. JSON-only 사실. 이메일·UUID 없음.
            where: { // 필터. JSON-only 사실. 이메일·UUID 없음.
                studentId: allowed.id, // studentId. JSON-only 사실. 이메일·UUID 없음.
                session: { // session. JSON-only 사실. 이메일·UUID 없음.
                    startsAt: { // startsAt. JSON-only 사실. 이메일·UUID 없음.
                        gte: startOfMonth, // gte. JSON-only 사실. 이메일·UUID 없음.
                        lt: endOfToday, // lt. JSON-only 사실. 이메일·UUID 없음.
                    },
                },
            },
            select: { status: true }, // select 필드. JSON-only 사실. 이메일·UUID 없음.
        }),
        getStaffAttendanceSessions({ // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
            staffScope, // JSON-only 사실. 이메일·UUID 없음.
            startOfDay: startOfWeek, // startOfDay. JSON-only 사실. 이메일·UUID 없음.
            endOfDay: endOfWeek, // endOfDay. JSON-only 사실. 이메일·UUID 없음.
        }),
    ]);

    const monthlyCounts = countMonthlyAttendance(monthAttendance); // monthlyCounts. JSON-only 사실. 이메일·UUID 없음.
    const weekSessions = staffWeekSessions // weekSessions. JSON-only 사실. 이메일·UUID 없음.
        .filter((session) => // JSON-only 사실. 이메일·UUID 없음.
            session.students.some((student) => student.id === allowed.id), // JSON-only 사실. 이메일·UUID 없음.
        )
        .map((session) => { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
            const studentAttendance = session.students.find( // studentAttendance. JSON-only 사실. 이메일·UUID 없음.
                (student) => student.id === allowed.id, // JSON-only 사실. 이메일·UUID 없음.
            );
            return toChatbotSession({ // 반환. JSON-only 사실. 이메일·UUID 없음.
                startsAt: session.startsAt, // startsAt. JSON-only 사실. 이메일·UUID 없음.
                timeLabel: session.timeLabel, // timeLabel. JSON-only 사실. 이메일·UUID 없음.
                className: session.className, // className. JSON-only 사실. 이메일·UUID 없음.
                subject: session.subject, // subject. JSON-only 사실. 이메일·UUID 없음.
                classroom: session.classroom, // classroom. JSON-only 사실. 이메일·UUID 없음.
                attendanceStatus: studentAttendance?.status ?? null, // attendanceStatus. JSON-only 사실. 이메일·UUID 없음.
            });
        })
        .slice(0, WEEK_SESSION_LIMIT); // findMentionedStudents 끝.
    const todaySession = weekSessions.find((session) => session.date === day) ?? null; // todaySession. JSON-only 사실. 이메일·UUID 없음.

    return { // focusedStudent. 이메일·전화·UUID는 넣지 않는다.
        name: allowed.name, // name. JSON-only 사실. 이메일·UUID 없음.
        schoolName: allowed.schoolName, // schoolName. JSON-only 사실. 이메일·UUID 없음.
        grade: allowed.grade, // grade. JSON-only 사실. 이메일·UUID 없음.
        className, // JSON-only 사실. 이메일·UUID 없음.
        teacherName: primaryClass?.teacher?.name ?? null, // teacherName. JSON-only 사실. 이메일·UUID 없음.
        openWrongCount: data.wrongNotes.filter((note) => note.status === "OPEN") // openWrongCount. JSON-only 사실. 이메일·UUID 없음.
            .length, // JSON-only 사실. 이메일·UUID 없음.
        grades: data.grades.slice(0, GRADE_LIMIT).map((grade) => ({ // grades. JSON-only 사실. 이메일·UUID 없음.
            subject: grade.subject, // subject. JSON-only 사실. 이메일·UUID 없음.
            title: grade.title, // title. JSON-only 사실. 이메일·UUID 없음.
            score: grade.score, // score. JSON-only 사실. 이메일·UUID 없음.
            maxScore: grade.maxScore, // maxScore. JSON-only 사실. 이메일·UUID 없음.
            percent: // percent. JSON-only 사실. 이메일·UUID 없음.
                grade.maxScore > 0 // JSON-only 사실. 이메일·UUID 없음.
                    ? Math.round((grade.score / grade.maxScore) * 100) // 삼항. JSON-only 사실. 이메일·UUID 없음.
                    : null, // 삼항 나머지. JSON-only 사실. 이메일·UUID 없음.
            assessedAt: toDateLabel(grade.assessedAt), // assessedAt. JSON-only 사실. 이메일·UUID 없음.
            className: grade.className, // className. JSON-only 사실. 이메일·UUID 없음.
        })),
        wrongNotes: data.wrongNotes.slice(0, WRONG_NOTE_LIMIT).map((note) => ({ // wrongNotes. JSON-only 사실. 이메일·UUID 없음.
            subject: null, // subject. JSON-only 사실. 이메일·UUID 없음.
            questionNo: note.questionNo, // questionNo. JSON-only 사실. 이메일·UUID 없음.
            status: note.status, // status. JSON-only 사실. 이메일·UUID 없음.
            createdAt: toDateLabel(note.createdAt), // createdAt. JSON-only 사실. 이메일·UUID 없음.
        })),
        attendances: { // attendances. JSON-only 사실. 이메일·UUID 없음.
            monthLabel: currentMonthLabel(), // monthLabel. JSON-only 사실. 이메일·UUID 없음.
            present: monthlyCounts.present, // present. JSON-only 사실. 이메일·UUID 없음.
            late: monthlyCounts.late, // late. JSON-only 사실. 이메일·UUID 없음.
            absent: monthlyCounts.absent, // absent. JSON-only 사실. 이메일·UUID 없음.
            earlyLeave: monthlyCounts.earlyLeave, // earlyLeave. JSON-only 사실. 이메일·UUID 없음.
        },
        todaySession, // JSON-only 사실. 이메일·UUID 없음.
        weekSessions, // JSON-only 사실. 이메일·UUID 없음.
    };
}

/** PRESENT/LATE/ABSENT/EARLY_LEAVE만 센다. EXCUSED는 이 요약에 넣지 않는다. */
function countMonthlyAttendance(attendance: Array<{ status: string }>) { // countMonthlyAttendance. JSON-only 사실. 이메일·UUID 없음.
    const counts = { present: 0, late: 0, absent: 0, earlyLeave: 0 }; // EXCUSED는 이 요약에 넣지 않는다.

    for (const record of attendance) { // 블록 시작. JSON-only 사실. 이메일·UUID 없음.
        if (record.status === "PRESENT") counts.present++; // 가드. JSON-only 사실. 이메일·UUID 없음.
        if (record.status === "LATE") counts.late++; // 가드. JSON-only 사실. 이메일·UUID 없음.
        if (record.status === "ABSENT") counts.absent++; // 가드. JSON-only 사실. 이메일·UUID 없음.
        if (record.status === "EARLY_LEAVE") counts.earlyLeave++; // 가드. JSON-only 사실. 이메일·UUID 없음.
    }

    return counts; // 반환. JSON-only 사실. 이메일·UUID 없음.
}
