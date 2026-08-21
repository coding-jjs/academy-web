import "server-only"; // 서버 전용. 클라이언트 번들에 안 넣는다.

/**
 * 학부모 홈에 링크된 자녀별 오늘 수업·도착 요약·최근 SENT 리포트와 쪽지·뉴스를 묶는다.
 *
 * 호출: `(parent)/parent/dashboard/page.tsx`.
 * 여러 화면 쿼리를 한 번에 모아 홈이 한 번의 데이터 로딩으로 그려지게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 마케팅 홈 → `features/home`.
 * - 초안 리포트. SENT만 최대 3건.
 *
 * 관련: `types.ts`의 `ParentDashboardData`.
 */

import { prisma } from "@/lib/db"; // 의존성. 역할 홈. 공개 마케팅 `/` 아님.
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst"; // 의존성. 역할 홈. 공개 마케팅 `/` 아님.
import type { AttendanceStatus } from "@/features/attendance/types"; // 타입만. 역할 홈. 공개 마케팅 `/` 아님.
import type { ParentDashboardData } from "@/features/dashboard/types"; // 타입만. 역할 홈. 공개 마케팅 `/` 아님.

/**
 * 종료되지 않은 자녀 링크 + 오늘 세션 + 안 읽은 쪽지 + PARENT/ALL 뉴스 3건.
 */
export async function getParentDashboardData( // getParentDashboardData. 역할 홈. 공개 마케팅 `/` 아님.
    parentUserId: string, // parentUserId. 역할 홈. 공개 마케팅 `/` 아님.
): Promise<ParentDashboardData> { // 블록 시작. 역할 홈. 공개 마케팅 `/` 아님.
    const { startOfToday, endOfToday } = getKstDayRange(); // KST 오늘. 역할 홈이지 공개 마케팅 홈이 아니다.
    const now = new Date(); // now. 역할 홈. 공개 마케팅 `/` 아님.
    const [links, unreadCount, newsItems] = await Promise.all([ // [links, unreadCount, newsItems] 시작. 역할 홈. 공개 마케팅 `/` 아님.
        getParentStudentLinks(parentUserId), // 역할 홈. 공개 마케팅 `/` 아님.
        prisma.messageRecipient.count({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
            where: { recipientUserId: parentUserId, readAt: null }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
        }),
        prisma.newsItem.findMany({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
            where: { // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                published: true, // published 선택.
                audience: { in: ["PARENT", "ALL"] }, // STUDENT 전용은 빼고, 게시·기간 안인 PARENT/ALL만 3건.
                OR: [{ startsAt: null }, { startsAt: { lte: now } }], // OR. 역할 홈. 공개 마케팅 `/` 아님.
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }], // AND. 역할 홈. 공개 마케팅 `/` 아님.
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
            take: 3, // 조회 상한.
            select: { id: true, title: true, createdAt: true }, // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
        }),
    ]);

    const studentIds = links.map(({ student }) => student.id); // studentIds. 역할 홈. 공개 마케팅 `/` 아님.
    const classIds = [ // classIds 시작. 역할 홈. 공개 마케팅 `/` 아님.
        ...new Set( // 전개. 역할 홈. 공개 마케팅 `/` 아님.
            links.flatMap(({ student }) => // 역할 홈. 공개 마케팅 `/` 아님.
                student.enrollments.map((enrollment) => enrollment.class.id), // 역할 홈. 공개 마케팅 `/` 아님.
            ),
        ),
    ]; // 역할 홈. 공개 마케팅 `/` 아님.
    const sessions = // sessions. 역할 홈. 공개 마케팅 `/` 아님.
        classIds.length === 0 // 역할 홈. 공개 마케팅 `/` 아님.
            ? [] // 반이 없으면 빈 배열.
            : await prisma.classSession.findMany({ // Prisma 조회/쓰기. 역할 홈. 공개 마케팅 `/` 아님.
                  where: { // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                      classId: { in: classIds }, // 자녀가 듣는 반만.
                      startsAt: { gte: startOfToday, lt: endOfToday }, // startsAt. 역할 홈. 공개 마케팅 `/` 아님.
                      status: { in: ["SCHEDULED", "COMPLETED"] }, // status. 역할 홈. 공개 마케팅 `/` 아님.
                  },
                  orderBy: { startsAt: "asc" }, // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
                  select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                      id: true, // id 선택.
                      classId: true, // classId 선택.
                      startsAt: true, // startsAt 선택.
                      endsAt: true, // endsAt 선택.
                      classroom: true, // classroom 선택.
                      class: { select: { name: true, subject: true } }, // class. 역할 홈. 공개 마케팅 `/` 아님.
                      attendance: { // attendance. 역할 홈. 공개 마케팅 `/` 아님.
                          where: { studentId: { in: studentIds } }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                          select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                              studentId: true, // studentId 선택.
                              status: true, // status 선택.
                              checkInAt: true, // checkInAt 선택.
                          },
                      },
                  },
              });

    return { // 자녀별 오늘 수업·도착 요약·최근 SENT 리포트.
        childList: links.map(({ student }) => { // childList. 역할 홈. 공개 마케팅 `/` 아님.
            const enrolledClassIds = new Set( // enrolledClassIds. 역할 홈. 공개 마케팅 `/` 아님.
                student.enrollments.map((enrollment) => enrollment.class.id), // 역할 홈. 공개 마케팅 `/` 아님.
            );
            const studentSessions = sessions.filter((session) => // studentSessions. 역할 홈. 공개 마케팅 `/` 아님.
                enrolledClassIds.has(session.classId), // 역할 홈. 공개 마케팅 `/` 아님.
            );
            const firstSession = studentSessions[0]; // 오늘 첫 수업만. 이후 세션은 todaySessions에만.
            const firstAttendance = firstSession?.attendance.find( // firstAttendance. 역할 홈. 공개 마케팅 `/` 아님.
                (attendance) => attendance.studentId === student.id, // 역할 홈. 공개 마케팅 `/` 아님.
            );

            return { // 반환. 역할 홈. 공개 마케팅 `/` 아님.
                id: student.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
                name: student.name, // name. 역할 홈. 공개 마케팅 `/` 아님.
                schoolName: student.schoolName, // schoolName. 역할 홈. 공개 마케팅 `/` 아님.
                grade: student.grade, // grade. 역할 홈. 공개 마케팅 `/` 아님.
                className: student.enrollments[0]?.class.name ?? null, // className. 역할 홈. 공개 마케팅 `/` 아님.
                teacherName: // teacherName. 역할 홈. 공개 마케팅 `/` 아님.
                    student.enrollments[0]?.class.teacher?.name ?? null, // 역할 홈. 공개 마케팅 `/` 아님.
                todaySessions: studentSessions.map((session) => ({ // todaySessions. 역할 홈. 공개 마케팅 `/` 아님.
                    id: session.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
                    className: session.class.name, // className. 역할 홈. 공개 마케팅 `/` 아님.
                    subject: session.class.subject, // subject. 역할 홈. 공개 마케팅 `/` 아님.
                    timeLabel: formatKstSessionTime(session), // timeLabel. 역할 홈. 공개 마케팅 `/` 아님.
                    classroom: session.classroom, // classroom. 역할 홈. 공개 마케팅 `/` 아님.
                    attendanceStatus: // attendanceStatus. 역할 홈. 공개 마케팅 `/` 아님.
                        (session.attendance.find( // 블록 시작. 역할 홈. 공개 마케팅 `/` 아님.
                            (attendance) => // 역할 홈. 공개 마케팅 `/` 아님.
                                attendance.studentId === student.id, // 역할 홈. 공개 마케팅 `/` 아님.
                        )?.status as AttendanceStatus | null) ?? null, // 역할 홈. 공개 마케팅 `/` 아님.
                })),
                arrivalSummary: firstSession // arrivalSummary. 역할 홈. 공개 마케팅 `/` 아님.
                    ? { // 삼항. 역할 홈. 공개 마케팅 `/` 아님.
                          title: firstSession.class.name, // title. 역할 홈. 공개 마케팅 `/` 아님.
                          detail: `${formatKstSessionTime(firstSession)}${ // detail. 역할 홈. 공개 마케팅 `/` 아님.
                              firstSession.classroom // 역할 홈. 공개 마케팅 `/` 아님.
                                  ? ` · ${firstSession.classroom}` // 삼항. 역할 홈. 공개 마케팅 `/` 아님.
                                  : "" // 삼항 나머지. 역할 홈. 공개 마케팅 `/` 아님.
                          }`, // 역할 홈. 공개 마케팅 `/` 아님.
                          status: // status. 역할 홈. 공개 마케팅 `/` 아님.
                              (firstAttendance?.status as AttendanceStatus | null) ?? // 역할 홈. 공개 마케팅 `/` 아님.
                              null, // 역할 홈. 공개 마케팅 `/` 아님.
                          checkInAt: // checkInAt. 역할 홈. 공개 마케팅 `/` 아님.
                              firstAttendance?.checkInAt?.toISOString() ?? null, // 역할 홈. 공개 마케팅 `/` 아님.
                      }
                    : null, // 삼항 나머지. 역할 홈. 공개 마케팅 `/` 아님.
                reports: student.reports.map((report) => ({ // reports. 역할 홈. 공개 마케팅 `/` 아님.
                    id: report.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
                    content: report.content, // content. 역할 홈. 공개 마케팅 `/` 아님.
                    teacherName: report.author.name, // teacherName. 역할 홈. 공개 마케팅 `/` 아님.
                    sentAt: report.sentAt?.toISOString() ?? null, // sentAt. 역할 홈. 공개 마케팅 `/` 아님.
                    parentReadAt: report.parentReadAt?.toISOString() ?? null, // parentReadAt. 역할 홈. 공개 마케팅 `/` 아님.
                    periodStart: report.periodStart.toISOString(), // periodStart. 역할 홈. 공개 마케팅 `/` 아님.
                    periodEnd: report.periodEnd.toISOString(), // periodEnd. 역할 홈. 공개 마케팅 `/` 아님.
                })),
            };
        }),
        unreadCount, // 역할 홈. 공개 마케팅 `/` 아님.
        news: newsItems.map((item) => ({ // news. 역할 홈. 공개 마케팅 `/` 아님.
            id: item.id, // id. 역할 홈. 공개 마케팅 `/` 아님.
            title: item.title, // title. 역할 홈. 공개 마케팅 `/` 아님.
            createdAt: item.createdAt.toISOString(), // createdAt. 역할 홈. 공개 마케팅 `/` 아님.
        })),
    };
}

/** 활성 자녀 링크. 홈 쿼리 전에 반 id·학생 id를 모은다. */
function getParentStudentLinks(parentUserId: string) { // getParentStudentLinks. 역할 홈. 공개 마케팅 `/` 아님.
    return prisma.parentStudentLink.findMany({ // 반환. 역할 홈. 공개 마케팅 `/` 아님.
        where: { parentUserId, endedAt: null }, // 종료되지 않은 자녀 링크. 홈 쿼리 전에 반 id·학생 id를 모은다.
        orderBy: { linkedAt: "asc" }, // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
        select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
            student: { // student. 역할 홈. 공개 마케팅 `/` 아님.
                select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                    id: true, // id 선택.
                    name: true, // name 선택.
                    schoolName: true, // schoolName 선택.
                    grade: true, // grade 선택.
                    enrollments: { // enrollments. 역할 홈. 공개 마케팅 `/` 아님.
                        where: { status: "ACTIVE", endedAt: null }, // 필터. 역할 홈. 공개 마케팅 `/` 아님.
                        select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                            class: { // class. 역할 홈. 공개 마케팅 `/` 아님.
                                select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                                    id: true, // id 선택.
                                    name: true, // name 선택.
                                    teacher: { select: { name: true } }, // teacher. 역할 홈. 공개 마케팅 `/` 아님.
                                },
                            },
                        },
                    },
                    reports: { // reports. 역할 홈. 공개 마케팅 `/` 아님.
                        where: { status: "SENT" }, // 원장 승인 발송본만 최대 3건. 초안은 학부모 홈에 올리지 않는다.
                        orderBy: { sentAt: "desc" }, // orderBy 필드. 역할 홈. 공개 마케팅 `/` 아님.
                        take: 3, // 조회 상한.
                        select: { // select 필드. 역할 홈. 공개 마케팅 `/` 아님.
                            id: true, // id 선택.
                            content: true, // content 선택.
                            sentAt: true, // sentAt 선택.
                            parentReadAt: true, // parentReadAt 선택.
                            author: { select: { name: true } }, // author. 역할 홈. 공개 마케팅 `/` 아님.
                            periodStart: true, // periodStart 선택.
                            periodEnd: true, // periodEnd 선택.
                        },
                    },
                },
            },
        },
    });
}
