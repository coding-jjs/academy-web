import "server-only"; // 읽기 전용. 결석 신청 쓰기는 parent-actions.

/**
 * 학부모 출결 화면용으로 링크된 자녀의 오늘·주간 예정 수업과 월간 집계를 읽는다.
 *
 * 호출: `(parent)/parent/attendance/page.tsx`, `features/chatbot/context.ts`.
 * 링크가 없는 원생은 포함하지 않으며, 결석 신청은 출석 상태와 별도 필드로 내려준다.
 * 구간은 KST 달력(`getKstDayRange`, 월초 `+09:00`)을 쓴다.
 *
 * 의도적으로 하지 않는 일:
 * - CANCELLED 회차를 보여 주지 않는다.
 * - AbsenceRequest로 AttendanceRecord를 만들지 않는다.
 *
 * 관련: `parent-types.ts`, `parent-actions.ts`, `lib/date-kst.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. upsert는 requestAbsence.
import { formatKstSessionTime, getKstDayRange } from "@/lib/date-kst"; // 학원 +09:00. 브라우저 TZ가 아니다.
import type { AttendanceStatus } from "@/features/attendance/types"; // 교사 저장 결과. 신청과 별개.
import type { ParentAttendanceChild } from "@/features/attendance/parent-types"; // 신청 필드와 출석 상태를 분리.

/**
 * 현재 학부모의 활성 링크 자녀별 출결 카드.
 *
 * @param parentUserId 세션 User.id. 페이지가 PARENT인지 이미 확인한 뒤 넘긴다.
 * @returns 연결 순(linkedAt asc). 자녀가 없으면 `[]`.
 * @auth 이 함수는 역할을 재검사하지 않는다. 링크 where만 본다.
 * @sideEffects 없음.
 */
export async function getParentAttendanceChildren( // 타인 원생은 링크 where가 막는다.
    parentUserId: string, // 세션 User.id. GUEST로 떨어진 계정은 페이지가 여기 안 온다.
): Promise<ParentAttendanceChild[]> { // 신청 ≠ 출석 행. AbsenceRequest를 승격하지 않는다.
    const ranges = getAttendanceRanges(); // 오늘·주간·월초 KST Instant.
    const links = await getParentStudentLinks(parentUserId); // 활성 ParentStudentLink만. 타인 원생은 없다.
    const studentIds = links.map(({ student }) => student.id); // 출석·신청 where in.
    const classIds = [ // 형제 반이 섞이지 않게 Set.
        ...new Set( // 여러 자녀가 같은 반이면 한 번만.
            links.flatMap(({ student }) => // 활성 수강만 아래 enrollments.
                student.enrollments.map((enrollment) => enrollment.class.id), // CANCELLED 수강은 where가 뺀다.
            ),
        ),
    ]; // 고유 반 id.
    const [sessions, monthAttendance] = await Promise.all([ // 주간 회차와 월간 집계.
        getUpcomingSessions(classIds, studentIds, ranges), // CANCELLED 제외. 신청 힌트 포함.
        prisma.attendanceRecord.findMany({ // 교사 저장 행만. 신청은 여기 없다.
            where: { // 오늘까지. 미래 회차 출석은 월간에 안 넣는다.
                studentId: { in: studentIds }, // 링크된 자녀만.
                session: { // 회차 시작으로 달을 가른다.
                    startsAt: { // KST 월초~오늘 끝.
                        gte: ranges.startOfMonth, // 월초 00:00 +09:00.
                        lt: ranges.endOfToday, // 오늘까지. 미래 회차 출석은 월간에 안 넣는다.
                    },
                },
            },
            select: { studentId: true, status: true }, // 집계만. 시각은 안 내린다.
        }),
    ]);
    const attendanceByStudent = Map.groupBy( // 자녀별 월간 버킷.
        monthAttendance, // 교사 저장 행.
        (attendance) => attendance.studentId, // 키.
    );

    return links.map(({ student }) => { // 연결 순. 형제 반 회차가 섞이지 않게.
        const enrolledClassIds = new Set( // 이 자녀의 활성 반만.
            student.enrollments.map((enrollment) => enrollment.class.id), // CANCELLED 수강 제외.
        );
        const studentSessions = sessions.filter((session) => // 형제 수업 제거.
            enrolledClassIds.has(session.classId), // 형제 반 회차가 섞이지 않게.
        );
        const todaySession = studentSessions.find( // 오늘 하이라이트 한 칸.
            (session) => // KST 오늘 Instant 구간.
                session.startsAt >= ranges.startOfToday && // 오늘 00:00 KST.
                session.startsAt < ranges.endOfToday, // 내일 00:00 KST.
        );
        const todayAttendance = todaySession?.attendance.find( // 교사 행. 신청이 있어도 없을 수 있다.
            (attendance) => attendance.studentId === student.id, // 이 자녀만.
        );

        return { // Screen 카드. 신청과 출석을 분리.
            id: student.id, // resolveChild·쿠키 childId.
            name: student.name, // 자녀 이름.
            schoolName: student.schoolName, // 학교.
            grade: student.grade, // 학년.
            className: student.enrollments[0]?.class.name ?? null, // 요약용 첫 반.
            teacherName: // 첫 반 담당.
                student.enrollments[0]?.class.teacher?.name ?? null, // 미지정 null.
            monthCounts: countMonthlyAttendance( // ABSENT+EXCUSED를 absent 칸에.
                attendanceByStudent.get(student.id) ?? [], // 신청 건수는 안 넣는다.
            ),
            todayHighlight: todaySession // 오늘 회차가 없으면 null.
                ? { // 신청만 있고 출석 행이 없으면 status null.
                      className: todaySession.class.name, // 오늘 반.
                      timeLabel: formatKstSessionTime(todaySession), // KST 구간.
                      classroom: todaySession.classroom, // 선택.
                      status: // 교사 저장. 신청과 별개.
                          (todayAttendance?.status as AttendanceStatus | null) ?? // 없으면 미체크.
                          null, // 신청이 있어도 출석 행이 없으면 null.
                  }
                : null, // 오늘 수업 없음.
            sessions: studentSessions.map((session) => { // 오늘~7일. CANCELLED 없음.
                const attendance = session.attendance.find( // 교사 AttendanceRecord.
                    (row) => row.studentId === student.id, // 이 자녀.
                );
                const absenceRequest = session.absenceRequests.find( // 신청 힌트. 출석 행이 아니다.
                    (request) => request.studentId === student.id, // 신청과 출석 상태를 분리.
                );
                return { // 한 회차 줄.
                    id: session.id, // requestAbsence의 sessionId.
                    className: session.class.name, // 반 이름.
                    subject: session.class.subject, // 과목.
                    teacherName: session.class.teacher?.name ?? null, // 담당.
                    classroom: session.classroom, // 선택.
                    startsAt: session.startsAt.toISOString(), // UTC ISO.
                    endsAt: session.endsAt.toISOString(), // UTC ISO.
                    timeLabel: formatKstSessionTime(session), // KST 표시.
                    isToday: // 하이라이트.
                        session.startsAt >= ranges.startOfToday && // 오늘 00:00 KST.
                        session.startsAt < ranges.endOfToday, // 내일 00:00.
                    attendanceStatus: // 교사 저장. 신청과 별개.
                        (attendance?.status as AttendanceStatus | null) ?? null, // 미체크 null.
                    checkInAt: attendance?.checkInAt?.toISOString() ?? null, // 출석·지각만.
                    checkOutAt: attendance?.checkOutAt?.toISOString() ?? null, // 조퇴.
                    absenceRequest: absenceRequest // AttendanceRecord가 아니다.
                        ? { // 교사가 출결을 찍기 전까지 힌트만.
                              id: absenceRequest.id, // 신청 행.
                              reason: absenceRequest.reason, // 사유.
                              requestedAt: // ISO.
                                  absenceRequest.requestedAt.toISOString(), // 신청 시각.
                          }
                        : null, // 신청 없음.
                };
            }),
        };
    });
}

function getAttendanceRanges() { // 학원 달력. 브라우저 TZ가 아니다.
    const { day, startOfToday, endOfToday } = getKstDayRange(); // day는 YYYY-MM-DD KST.
    const startOfMonth = new Date(`${day.slice(0, 8)}01T00:00:00+09:00`); // day는 YYYY-MM-DD. 월초 00:00 KST.
    const endOfWeek = new Date(startOfToday); // 오늘 00:00 복사.
    endOfWeek.setDate(endOfWeek.getDate() + 7); // 오늘부터 7일. 주간 예정 수업.
    return { startOfToday, endOfToday, startOfMonth, endOfWeek }; // Instant 묶음.
}

function getParentStudentLinks(parentUserId: string) { // 활성 링크만. 해제된 자녀는 안 올린다.
    return prisma.parentStudentLink.findMany({ // GUEST로 떨어진 계정은 역할이 PARENT가 아니라 페이지가 여기 안 온다.
        where: { parentUserId, endedAt: null }, // GUEST로 떨어진 계정은 역할이 PARENT가 아니라 페이지가 여기 안 온다.
        orderBy: { linkedAt: "asc" }, // 연결 순. 쿠키 기본 첫 자녀와 맞춘다.
        select: { // 활성 수강만. CANCELLED는 반 목록에서 뺀다.
            student: { // 자녀 카드.
                select: { // 요약용 첫 반.
                    id: true, // Student.id.
                    name: true, // 이름.
                    schoolName: true, // 학교.
                    grade: true, // 학년.
                    enrollments: { // 형제 반 필터용 class.id.
                        where: { status: "ACTIVE", endedAt: null }, // CANCELLED 수강 제외.
                        select: { // 첫 반 이름·담당.
                            class: { // 반.
                                select: { // id는 회차 필터.
                                    id: true, // classId.
                                    name: true, // 요약 className.
                                    teacher: { select: { name: true } }, // 담당.
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

function getUpcomingSessions( // CANCELLED는 그리드에 안 올린다.
    classIds: string[], // 링크된 자녀의 활성 반.
    studentIds: string[], // 출석·신청 where in.
    ranges: ReturnType<typeof getAttendanceRanges>, // 오늘~7일.
) { // 반이 없으면 쿼리를 치지 않는다.
    if (classIds.length === 0) return Promise.resolve([]); // 자녀·수강 없음.
    return prisma.classSession.findMany({ // 시간표와 같은 ClassSession.
        where: { // CANCELLED 제외.
            classId: { in: classIds }, // 형제 반은 호출 측 Set.
            startsAt: { gte: ranges.startOfToday, lt: ranges.endOfWeek }, // 오늘부터 7일 KST.
            status: { in: ["SCHEDULED", "COMPLETED"] }, // CANCELLED 제외.
        },
        orderBy: { startsAt: "asc" }, // 시간순.
        select: { // 출석 행과 신청을 같이. 승격하지 않는다.
            id: true, // sessionId.
            classId: true, // 자녀별 필터.
            startsAt: true, // isToday.
            endsAt: true, // 구간.
            classroom: true, // 선택.
            class: { // 반 라벨.
                select: { // 과목·담당.
                    name: true, // 반 이름.
                    subject: true, // 과목.
                    teacher: { select: { name: true } }, // 담당.
                },
            },
            attendance: { // 교사 저장. 신청이 아니다.
                where: { studentId: { in: studentIds } }, // 링크된 자녀만.
                select: { // 화면 체크인 시각.
                    studentId: true, // 매칭 키.
                    status: true, // PRESENT 등.
                    checkInAt: true, // 출석·지각.
                    checkOutAt: true, // 조퇴.
                },
            },
            absenceRequests: { // 출석 행과 별도 필드.
                where: { studentId: { in: studentIds }, cancelledAt: null }, // 출석 행과 별도 필드.
                select: { // 힌트만. 교사가 찍기 전.
                    id: true, // 신청 id.
                    studentId: true, // 매칭 키.
                    reason: true, // 사유.
                    requestedAt: true, // ISO.
                },
            },
        },
    });
}

function countMonthlyAttendance( // 신청 건수는 세지 않는다. 교사 행만.
    attendance: Array<{ status: string }>, // 월간 AttendanceRecord.
) { // 공결 전용 칸은 없음.
    const counts = { present: 0, late: 0, absent: 0, earlyLeave: 0 }; // Screen 월간 칩.
    for (const record of attendance) { // EXCUSED는 absent에 합친다.
        if (record.status === "PRESENT") counts.present += 1; // 출석.
        else if (record.status === "LATE") counts.late += 1; // 지각.
        else if (record.status === "EARLY_LEAVE") counts.earlyLeave += 1; // 조퇴.
        else counts.absent += 1; // ABSENT와 EXCUSED(공결)를 같이 넣는다. 공결 전용 칸은 없음.
    }
    return counts; // monthCounts.
}
