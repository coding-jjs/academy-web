import "server-only"; // 서버 전용. 클라이언트 번들에 안 넣는다.

/**
 * 학생 본인 홈: 오늘 수업, 다음 세션, 최근 성적·오답·숙제·뉴스를 묶는다.
 *
 * 호출: `(student)/student/dashboard/page.tsx`.
 * 프로필이 없으면 linked=false 빈 홈을 돌려, 연결 전에도 화면이 깨지지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 마케팅 홈 → `features/home`.
 * - 출결 체크인 액션. 오늘 라벨만 읽는다.
 *
 * 관련: `types.ts`의 `StudentDashboardData`.
 */

import { prisma } from "@/lib/db"; // 의존성. 역할 홈. 공개 마케팅 `/` 아님.
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst"; // 의존성. 역할 홈. 공개 마케팅 `/` 아님.
import type { AttendanceStatus } from "@/features/attendance/types"; // 타입만. 역할 홈. 공개 마케팅 `/` 아님.
import type { StudentDashboardData } from "@/features/dashboard/types"; // 타입만. 역할 홈. 공개 마케팅 `/` 아님.

/**
 * Student 프로필이 있으면 오늘 세션·숙제·뉴스를 채우고, 없으면 빈 대시보드.
 */
export async function getStudentDashboardData( // getStudentDashboardData. 역할 홈. 공개 마케팅 `/` 아님.
    studentUserId: string, // studentUserId. 역할 홈. 공개 마케팅 `/` 아님.
    fallbackStudentName: string, // fallbackStudentName. 역할 홈. 공개 마케팅 `/` 아님.
): Promise<StudentDashboardData> { // 블록 시작. 역할 홈. 공개 마케팅 `/` 아님.
    const { startOfToday, endOfToday } = getKstDayRange(); // KST 오늘. 프로필이 없으면 아래에서 빈 홈을 돌려 화면이 깨지지 않게 한다.
    const now = new Date(); // now. 역할 홈. 공개 마케팅 `/` 아님.
    const student = await getStudentProfile(studentUserId); // student 조회. 역할 홈. 공개 마케팅 `/` 아님.
    if (!student) return createUnlinkedDashboard(fallbackStudentName); // User는 있어도 Student 프로필이 없으면 빈 홈. 세션 쿼리를 돌리지 않는다.

    const classIds = student.enrollments.map( // classIds. 역할 홈. 공개 마케팅 `/` 아님.
        (enrollment) => enrollment.class.id, // 역할 홈. 공개 마케팅 `/` 아님.
    );
    const [sessions, unreadCount, newsRows, homework] = await Promise.all([ // 오늘 수업·안 읽은 쪽지·학생/전체 뉴스 3건·숙제 3건.
        classIds.length === 0 // 역할 홈. 공개 마케팅 `/` 아님.
            ? Promise.resolve([]) // 삼항. 역할 홈. 공개 마케팅 `/` 아님.
            : prisma.classSession.findMany({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
                  where: { // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                      classId: { in: classIds }, // classId. 역할 홈. 공개 마케팅 `/` 아님.
                      startsAt: { gte: startOfToday, lt: endOfToday }, // startsAt. 역할 홈. 공개 마케팅 `/` 아님.
                      status: { in: ["SCHEDULED", "COMPLETED"] }, // status. 역할 홈. 공개 마케팅 `/` 아님.
                  },
                  orderBy: { startsAt: "asc" }, // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
                  select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                      id: true, // id 선택.
                      startsAt: true, // startsAt 선택.
                      endsAt: true, // endsAt 선택.
                      classroom: true, // classroom 선택.
                      class: { select: { name: true, subject: true } }, // class. 역할 홈. 공개 마케팅 `/` 아님.
                      attendance: { // attendance. 역할 홈. 공개 마케팅 `/` 아님.
                          where: { studentId: student.id }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                          take: 1, // 조회 상한.
                          select: { status: true, checkInAt: true }, // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                      },
                  },
              }),
        prisma.messageRecipient.count({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
            where: { recipientUserId: studentUserId, readAt: null }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
        }),
        prisma.newsItem.findMany({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
            where: { // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                published: true, // published 선택.
                audience: { in: ["STUDENT", "ALL"] }, // audience. 역할 홈. 공개 마케팅 `/` 아님.
                OR: [{ startsAt: null }, { startsAt: { lte: now } }], // OR. 역할 홈. 공개 마케팅 `/` 아님.
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }], // AND. 역할 홈. 공개 마케팅 `/` 아님.
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
            take: 3, // 조회 상한.
            select: { id: true, title: true, createdAt: true }, // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
        }),
        prisma.learningRecord.findMany({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
            where: { studentId: student.id, type: "HOMEWORK" }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
            orderBy: { recordDate: "desc" }, // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
            take: 3, // 조회 상한.
            select: { id: true, title: true, content: true, recordDate: true }, // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
        }),
    ]);

    const upcomingSession = // upcomingSession. 역할 홈. 공개 마케팅 `/` 아님.
        sessions.find((session) => session.startsAt >= now) ?? // 역할 홈. 공개 마케팅 `/` 아님.
        sessions[0] ?? // 역할 홈. 공개 마케팅 `/` 아님.
        null; // 아직 시작 안 한 오늘 수업이 있으면 그걸, 없으면 오늘 첫 칸(이미 지난 수업).
    const latestGrade = student.gradeRecords[0]; // latestGrade. 역할 홈. 공개 마케팅 `/` 아님.

    return { // 역할 홈 페이로드. 공개 마케팅 홈(`features/home`)이 아니다.
        studentName: student.name, // studentName. 역할 홈. 공개 마케팅 `/` 아님.
        schoolName: student.schoolName, // schoolName. 역할 홈. 공개 마케팅 `/` 아님.
        grade: student.grade, // grade. 역할 홈. 공개 마케팅 `/` 아님.
        linked: true, // linked 선택.
        todaySessions: sessions.map((session) => ({ // todaySessions. 역할 홈. 공개 마케팅 `/` 아님.
            id: session.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
            className: session.class.name, // className. 역할 홈. 공개 마케팅 `/` 아님.
            subject: session.class.subject, // subject. 역할 홈. 공개 마케팅 `/` 아님.
            timeLabel: formatKstSessionTime(session), // timeLabel. 역할 홈. 공개 마케팅 `/` 아님.
            classroom: session.classroom, // classroom. 역할 홈. 공개 마케팅 `/` 아님.
            startsAt: session.startsAt.toISOString(), // startsAt. 역할 홈. 공개 마케팅 `/` 아님.
            attendanceStatus: // attendanceStatus. 역할 홈. 공개 마케팅 `/` 아님.
                (session.attendance[0]?.status as AttendanceStatus | null) ?? // 역할 홈. 공개 마케팅 `/` 아님.
                null, // 역할 홈. 공개 마케팅 `/` 아님.
        })),
        nextSession: upcomingSession // nextSession. 역할 홈. 공개 마케팅 `/` 아님.
            ? { // 삼항. 역할 홈. 공개 마케팅 `/` 아님.
                  className: upcomingSession.class.name, // className. 역할 홈. 공개 마케팅 `/` 아님.
                  timeLabel: formatKstSessionTime(upcomingSession), // timeLabel. 역할 홈. 공개 마케팅 `/` 아님.
                  classroom: upcomingSession.classroom, // classroom. 역할 홈. 공개 마케팅 `/` 아님.
              }
            : null, // 삼항 나머지. 역할 홈. 공개 마케팅 `/` 아님.
        todayAttendanceLabel: // todayAttendanceLabel. 역할 홈. 공개 마케팅 `/` 아님.
            (sessions[0]?.attendance[0]?.status as AttendanceStatus | null) ?? // 역할 홈. 공개 마케팅 `/` 아님.
            null, // 오늘 출석은 첫 세션 기록. 이후 수업 상태는 todaySessions에만.
        latestGrade: latestGrade // latestGrade. 역할 홈. 공개 마케팅 `/` 아님.
            ? { // 삼항. 역할 홈. 공개 마케팅 `/` 아님.
                  subject: latestGrade.subject, // subject. 역할 홈. 공개 마케팅 `/` 아님.
                  title: latestGrade.title, // title. 역할 홈. 공개 마케팅 `/` 아님.
                  score: Number(latestGrade.score), // score. 역할 홈. 공개 마케팅 `/` 아님.
                  maxScore: Number(latestGrade.maxScore), // maxScore. 역할 홈. 공개 마케팅 `/` 아님.
                  assessedAt: latestGrade.assessedAt.toISOString(), // assessedAt. 역할 홈. 공개 마케팅 `/` 아님.
              }
            : null, // 삼항 나머지. 역할 홈. 공개 마케팅 `/` 아님.
        openWrongCount: student.wrongNotes.length, // openWrongCount. 역할 홈. 공개 마케팅 `/` 아님.
        unreadCount, // 역할 홈. 공개 마케팅 `/` 아님.
        news: newsRows.map((newsItem) => ({ // news. 역할 홈. 공개 마케팅 `/` 아님.
            id: newsItem.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
            title: newsItem.title, // title. 역할 홈. 공개 마케팅 `/` 아님.
            createdAt: newsItem.createdAt.toISOString(), // createdAt. 역할 홈. 공개 마케팅 `/` 아님.
        })),
        homework: homework.map((item) => ({ // homework. 역할 홈. 공개 마케팅 `/` 아님.
            id: item.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
            title: item.title, // title. 역할 홈. 공개 마케팅 `/` 아님.
            content: item.content, // content. 역할 홈. 공개 마케팅 `/` 아님.
            recordDate: item.recordDate.toISOString(), // recordDate. 역할 홈. 공개 마케팅 `/` 아님.
        })),
    };
}

/** userId로 Student 프로필·오늘 반·최근 성적 1건·미해결 오답을 읽는다. */
function getStudentProfile(studentUserId: string) { // getStudentProfile. 역할 홈. 공개 마케팅 `/` 아님.
    return prisma.student.findFirst({ // 반환. 역할 홈. 공개 마케팅 `/` 아님.
        where: { userId: studentUserId }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
        select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
            id: true, // id 선택.
            name: true, // name 선택.
            schoolName: true, // schoolName 선택.
            grade: true, // grade 선택.
            enrollments: { // enrollments. 역할 홈. 공개 마케팅 `/` 아님.
                where: { status: "ACTIVE", endedAt: null }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                select: { class: { select: { id: true } } }, // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
            },
            gradeRecords: { // gradeRecords. 역할 홈. 공개 마케팅 `/` 아님.
                orderBy: { assessedAt: "desc" }, // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
                take: 1, // 조회 상한.
                select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                    subject: true, // subject 선택.
                    score: true, // score 선택.
                    maxScore: true, // maxScore 선택.
                    title: true, // title 선택.
                    assessedAt: true, // assessedAt 선택.
                },
            },
            wrongNotes: { where: { status: "OPEN" }, select: { id: true } }, // OPEN만 가져와 length를 openWrongCount로 쓴다.
        },
    });
}

/** Student 행이 없을 때 홈이 깨지지 않게 빈 값. linked=false. */
function createUnlinkedDashboard(studentName: string): StudentDashboardData { // createUnlinkedDashboard. 역할 홈. 공개 마케팅 `/` 아님.
    return { // Student 행이 없을 때 화면이 깨지지 않게 0/null. linked=false.
        studentName, // 역할 홈. 공개 마케팅 `/` 아님.
        schoolName: null, // schoolName. 역할 홈. 공개 마케팅 `/` 아님.
        grade: null, // grade. 역할 홈. 공개 마케팅 `/` 아님.
        linked: false, // linked 선택.
        todaySessions: [], // todaySessions. 역할 홈. 공개 마케팅 `/` 아님.
        nextSession: null, // nextSession. 역할 홈. 공개 마케팅 `/` 아님.
        todayAttendanceLabel: null, // todayAttendanceLabel. 역할 홈. 공개 마케팅 `/` 아님.
        latestGrade: null, // latestGrade. 역할 홈. 공개 마케팅 `/` 아님.
        openWrongCount: 0, // openWrongCount. 역할 홈. 공개 마케팅 `/` 아님.
        unreadCount: 0, // unreadCount. 역할 홈. 공개 마케팅 `/` 아님.
        news: [], // news. 역할 홈. 공개 마케팅 `/` 아님.
        homework: [], // homework. 역할 홈. 공개 마케팅 `/` 아님.
    };
}
