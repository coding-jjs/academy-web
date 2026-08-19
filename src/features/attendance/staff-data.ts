import "server-only"; // 읽기 전용. 출결 쓰기는 staff-actions.

/**
 * 오늘 스코프 안 회차와 수강생 출결·결석 신청을 읽는다.
 *
 * 호출: `(teacher)/teacher/attendance/page.tsx`, `features/chatbot/context.ts`.
 * `classSessionScopeWhere`가 `viewAllStudents` vs 담당반을 가른다.
 * 학부모 결석 신청은 출석 행이 아니라 `absenceRequest`로만 붙어 화면에 힌트를 준다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한 키 own/other Teacher Attendance를 여기서 쓰지 않는다. 저장 액션이 검사.
 * - CANCELLED 회차는 오늘 명단에 올리지 않는다.
 *
 * 관련: `lib/staff-scope.ts`, `staff-types.ts`, `staff-actions.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. upsert는 saveSessionAttendance.
import { formatKstTime } from "@/lib/date-kst"; // 학원 KST 구간 라벨.
import { // viewAllStudents vs 담당반. own/other 쓰기 키는 저장 액션.
    classSessionScopeWhere, // 오늘 명단 범위.
    type StaffScope, // getStaffScope 결과.
} from "@/lib/staff-scope"; // 페이지가 넘긴다.
import type { StaffAttendanceSession } from "@/features/attendance/staff-types"; // 신청 힌트와 출석 상태를 분리.

/**
 * 오늘(호출 측이 넘긴 KST 구간)의 출결 입력용 회차 목록.
 *
 * @param staffScope `getStaffScope` 결과. viewAllStudents면 전체 반.
 * @param startOfDay / endOfDay 페이지가 `getKstDayRange`로 계산한 Instant.
 * @returns 시작 시각 오름차순. 수강생은 이름순.
 * @auth 페이지가 TEACHER/STAFF. 이 함수는 세션을 보지 않는다.
 * @sideEffects 없음.
 */
export async function getStaffAttendanceSessions({ // own/other 쓰기 키는 저장 액션이 검사.
    staffScope, // viewAllStudents vs 담당반.
    startOfDay, // KST 오늘 00:00 Instant.
    endOfDay, // KST 내일 00:00 Instant.
}: { // 페이지가 계산해 넘긴다.
    staffScope: StaffScope; // getStaffScope.
    startOfDay: Date; // getKstDayRange.
    endOfDay: Date; // getKstDayRange.
}): Promise<StaffAttendanceSession[]> { // CANCELLED는 명단에 안 올린다.
    const sessionRecords = await prisma.classSession.findMany({ // 오늘 회차. 그리드는 ClassSession.
        where: { // CANCELLED 제외. 스코프는 담당반 또는 전체.
            startsAt: { gte: startOfDay, lt: endOfDay }, // 페이지가 넘긴 KST 오늘 Instant.
            status: { in: ["SCHEDULED", "COMPLETED"] }, // CANCELLED는 명단에 안 올린다.
            ...classSessionScopeWhere(staffScope), // viewAllStudents vs 담당반. own/other 쓰기 키는 저장 액션.
        },
        orderBy: { startsAt: "asc" }, // 시간순.
        select: { // 명단·출석·신청. 신청은 힌트만.
            id: true, // saveSessionAttendance의 sessionId.
            startsAt: true, // ISO·timeLabel.
            endsAt: true, // ISO·timeLabel.
            classroom: true, // 선택.
            class: { // 반·명단.
                select: { // 활성 수강만.
                    id: true, // classId.
                    name: true, // 반 이름.
                    subject: true, // 과목.
                    teacher: { select: { name: true } }, // 담당 라벨.
                    enrollments: { // 출결 칸.
                        where: { status: "ACTIVE", endedAt: null }, // 해제된 수강생은 출결 칸에 안 올린다.
                        select: { // 원생 카드.
                            student: { // 이름·학교.
                                select: { // 학년까지.
                                    id: true, // payload studentId.
                                    name: true, // 명단 이름.
                                    schoolName: true, // 학교.
                                    grade: true, // 학년.
                                },
                            },
                        },
                        orderBy: { student: { name: "asc" } }, // 이름순 명단.
                    },
                },
            },
            attendance: { // 교사 저장 행. 신청이 아니다.
                select: { // 미체크면 맵에 없어 status null.
                    studentId: true, // 매칭 키.
                    status: true, // PRESENT 등.
                    checkInAt: true, // 출석·지각.
                    checkOutAt: true, // 조퇴.
                    note: true, // 이 화면 액션은 note를 쓰지 않는다.
                },
            },
            absenceRequests: { // 학부모 신청 힌트. AttendanceRecord가 아니다.
                where: { cancelledAt: null }, // 학부모 신청 힌트. AttendanceRecord가 아니다.
                select: { studentId: true, reason: true }, // 사유만. 자동 반영되지 않음.
            },
        },
    });

    return sessionRecords.map((classSession) => { // 명단 기준으로 출석·신청을 붙인다.
        const attendanceByStudent = new Map( // 교사 행.
            classSession.attendance.map((attendance) => [ // studentId 키.
                attendance.studentId, // 매칭.
                attendance, // 상태·시각.
            ]),
        );
        const absenceByStudent = new Map( // 신청 힌트.
            classSession.absenceRequests.map((absenceRequest) => [ // studentId 키.
                absenceRequest.studentId, // 매칭.
                absenceRequest, // 신청은 힌트일 뿐 자동 반영되지 않음.
            ]),
        );

        return { // Screen 회차 카드.
            id: classSession.id, // sessionId.
            classId: classSession.class.id, // 반.
            className: classSession.class.name, // 반 이름.
            subject: classSession.class.subject, // 과목.
            teacherName: classSession.class.teacher?.name ?? null, // 담당.
            classroom: classSession.classroom, // 선택.
            startsAt: classSession.startsAt.toISOString(), // UTC ISO.
            endsAt: classSession.endsAt.toISOString(), // UTC ISO.
            timeLabel: `${formatKstTime(classSession.startsAt)}~${formatKstTime(classSession.endsAt)}`, // 학원 KST.
            students: classSession.class.enrollments.map(({ student }) => { // 활성 수강 명단.
                const attendance = attendanceByStudent.get(student.id); // 없으면 미체크.
                const absenceRequest = absenceByStudent.get(student.id); // 힌트만.

                return { // 한 칸. 신청이 있어도 status는 출석 행만.
                    id: student.id, // payload studentId. 명단 밖은 저장 시 버린다.
                    name: student.name, // 이름.
                    schoolName: student.schoolName, // 학교.
                    grade: student.grade, // 학년.
                    status: attendance?.status ?? null, // null이면 아직 출석 행 없음.
                    checkInAt: attendance?.checkInAt?.toISOString() ?? null, // 출석·지각.
                    checkOutAt: attendance?.checkOutAt?.toISOString() ?? null, // 조퇴.
                    note: attendance?.note ?? null, // 이 화면 액션은 note를 쓰지 않는다.
                    absenceRequest: absenceRequest // 자동 승격되지 않음.
                        ? { reason: absenceRequest.reason } // 사유 힌트.
                        : null, // 신청 없음.
                };
            }),
        };
    });
}
