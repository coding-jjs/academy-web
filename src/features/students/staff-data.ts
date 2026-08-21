import "server-only"; // 읽기 전용. 학습기록 쓰기는 staff-actions.

/**
 * 교사·직원 원생 화면용으로 스코프 안 학생과 최근 출석·성적·학습기록을 읽는다.
 *
 * 호출: `(teacher)/teacher/students/page.tsx`, `(employee)/employee/students/page.tsx`,
 * `features/chatbot/context.ts`.
 *
 * where 절은 페이지가 넘긴 `studentWhere`/`classWhere`를 그대로 쓰므로
 * 권한 범위(`viewAllStudents` vs 담당반)는 호출 측 `staff-scope` 책임이다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한 키를 여기서 해석하지 않는다.
 * - 학습기록을 쓰지 않는다 → `staff-actions.createLearningRecord`.
 *
 * 관련: `lib/staff-scope.ts`, `features/students/types.ts`.
 */

import type { Prisma } from "@/generate/prisma/client"; // 호출 측 staff-scope where. 이 함수는 키를 해석하지 않는다.
import { prisma } from "@/lib/db"; // findMany만. createLearningRecord는 staff-actions.
import type { // 워크스페이스 행·반 옵션. Prisma Student 전체가 아니다.
    StaffClassOption, // 학습기록 폼 반. viewAllStudents가 없으면 담당반만.
    StaffStudentRow, // 최근 출석 5 / 성적 3 / 기록 5.
} from "@/features/students/types"; // StaffStudentsScreen·챗봇이 이 형태로 쓴다.

/**
 * 스코프된 원생 목록과 학습기록 폼용 반 옵션.
 *
 * @param studentWhere 호출 측이 만든 Student where. 보통 ENROLLED + scope.
 * @param classWhere 활성 반 + scope.
 * @param recentAttendanceStart 이 시각 이후 출석만. 페이지가 최근 N일을 계산해 넘긴다.
 * @returns 이름순 학생, 이름순 반.
 * @auth 호출 페이지가 TEACHER/STAFF. 이 함수는 세션을 보지 않는다.
 * @sideEffects 없음.
 */
export async function getStaffStudentsData({ // 권한 키는 페이지 staff-scope. 여기서는 읽기만.
    studentWhere, // 보통 ENROLLED + scope. 이 함수는 viewAllStudents를 해석하지 않는다.
    classWhere, // 학습기록 폼 반 옵션.
    recentAttendanceStart, // 이 Instant 이후 출석만 take 5.
}: { // 페이지가 계산해 넘긴다. 세션은 보지 않는다.
    studentWhere: Prisma.StudentWhereInput; // staff-scope 결과.
    classWhere: Prisma.ClassWhereInput; // 활성 반 + scope.
    recentAttendanceStart: Date; // 최근 N일. 페이지가 KST를 계산한다.
}): Promise<{ // 화면·챗봇 페이로드.
    students: StaffStudentRow[]; // 이름순. CANCELLED 수강은 classes에서 뺀다.
    classes: StaffClassOption[]; // 학습기록 폼.
}> { // 쓰기는 createLearningRecord.
    const [studentRecords, classRecords] = await Promise.all([ // 원생 워크스페이스와 반 옵션.
        prisma.student.findMany({ // 권한 키를 여기서 해석하지 않는다.
            where: studentWhere, // 페이지가 staff-scope로 만든 where. 이 함수는 권한 키를 해석하지 않는다.
            orderBy: { name: "asc" }, // 이름순.
            select: { // 최근 출석·성적·기록. 연락처는 viewParentContact 화면이 따로.
                id: true, // Student.id.
                name: true, // 원생 이름.
                schoolName: true, // 학교.
                grade: true, // 학년.
                status: true, // ENROLLED 등. 호출 where에 달렸다.
                user: { select: { id: true, email: true } }, // 없으면 googleLinked false.
                enrollments: { // 워크스페이스 반 목록.
                    where: { status: "ACTIVE", endedAt: null }, // CANCELLED 수강은 워크스페이스 반 목록에서 뺀다.
                    orderBy: { class: { name: "asc" } }, // 반 이름순.
                    select: { // 담당 선생님 이름까지.
                        class: { // ClassEnrollment.class.
                            select: { // 학습기록 폼과 다른 요약.
                                id: true, // 반 id.
                                name: true, // 반 이름.
                                subject: true, // 과목.
                                teacher: { select: { name: true } }, // 담당 미지정이면 null.
                            },
                        },
                    },
                },
                parentLinks: { // 활성 보호자만.
                    where: { endedAt: null }, // 해제된 링크는 안 올린다.
                    select: { // 연락처는 viewParentContact 화면이 따로.
                        relationship: true, // 어머니/아버지 등.
                        parent: { select: { name: true } }, // 연락처는 viewParentContact 화면이 따로.
                    },
                },
                attendance: { // 최근 출석 5. 학부모 신청 행이 아니다.
                    where: { // 페이지가 넘긴 최근 N일 Instant.
                        session: { startsAt: { gte: recentAttendanceStart } }, // 오래된 회차는 워크스페이스에서 뺀다.
                    },
                    orderBy: { session: { startsAt: "desc" } }, // 최신이 위.
                    take: 5, // StaffStudentRow.recentAttendance 길이와 맞춘다.
                    select: { // 결석·공결은 checkInAt이 보통 null.
                        status: true, // PRESENT 등. AbsenceRequest가 아니다.
                        checkInAt: true, // 출석·지각만 값이 있다.
                        session: { // 반 이름·시작.
                            select: { // ISO로 바꾼다.
                                startsAt: true, // 회차 시작 Instant.
                                class: { select: { name: true } }, // 반 이름.
                            },
                        },
                    },
                },
                gradeRecords: { // 최근 성적 3.
                    orderBy: { assessedAt: "desc" }, // 최신 평가가 위.
                    take: 3, // StaffStudentRow.recentGrades와 맞춘다.
                    select: { // Decimal은 아래에서 Number.
                        id: true, // 성적 행.
                        title: true, // 평가 제목.
                        subject: true, // 과목.
                        score: true, // Decimal.
                        maxScore: true, // Decimal.
                        assessedAt: true, // ISO로 바꾼다.
                    },
                },
                learningRecords: { // 최근 학습기록 5. create만 있는 테이블.
                    orderBy: { recordDate: "desc" }, // 최신이 위.
                    take: 5, // StaffStudentRow.recentRecords와 맞춘다.
                    select: { // 상담 메모와 다른 테이블.
                        id: true, // 기록 id.
                        type: true, // CLASS_NOTE/HOMEWORK/LIFE_RECORD.
                        title: true, // 제목.
                        content: true, // 본문.
                        recordDate: true, // ISO로 바꾼다.
                        author: { select: { name: true } }, // 작성 교사·직원.
                    },
                },
            },
        }),
        prisma.class.findMany({ // 학습기록 폼 반 옵션.
            where: classWhere, // 학습기록 폼 반 옵션. viewAllStudents가 없으면 담당반만.
            orderBy: { name: "asc" }, // 이름순.
            select: { id: true, name: true, subject: true }, // StaffClassOption.
        }),
    ]);

    const students = studentRecords.map((student) => ({ // Prisma Date·Decimal을 화면 타입으로.
        id: student.id, // Student.id.
        name: student.name, // 원생 이름.
        schoolName: student.schoolName, // 학교.
        grade: student.grade, // 학년.
        status: student.status, // 재원/휴원/퇴원.
        googleLinked: Boolean(student.user), // userId:null 카드는 false.
        email: student.user?.email ?? null, // 미연결이면 null.
        classes: student.enrollments.map((enrollment) => ({ // ACTIVE+endedAt null만.
            id: enrollment.class.id, // 반 id.
            name: enrollment.class.name, // 반 이름.
            subject: enrollment.class.subject, // 과목.
            teacherName: enrollment.class.teacher?.name ?? null, // 담당 미지정 null.
        })),
        parents: student.parentLinks.map((parentLink) => ({ // 활성 링크만.
            name: parentLink.parent.name, // 학부모 이름.
            relationship: parentLink.relationship, // 관계. 연락처는 다른 화면.
        })),
        recentAttendance: student.attendance.map((attendance) => ({ // take 5.
            status: attendance.status, // 교사 저장 결과. 학부모 신청이 아니다.
            className: attendance.session.class.name, // 반 이름.
            startsAt: attendance.session.startsAt.toISOString(), // 회차 시작 ISO.
            checkInAt: attendance.checkInAt?.toISOString() ?? null, // 결석·공결은 보통 null.
        })),
        recentGrades: student.gradeRecords.map((grade) => ({ // take 3.
            id: grade.id, // 성적 행.
            title: grade.title, // 제목.
            subject: grade.subject, // 과목.
            score: Number(grade.score), // Decimal → number.
            maxScore: Number(grade.maxScore), // Decimal → number.
            assessedAt: grade.assessedAt.toISOString(), // 평가일 ISO.
        })),
        recentRecords: student.learningRecords.map((record) => ({ // take 5.
            id: record.id, // 학습기록 id.
            type: record.type, // CLASS_NOTE/HOMEWORK/LIFE_RECORD.
            title: record.title, // 제목.
            content: record.content, // 본문.
            recordDate: record.recordDate.toISOString(), // 기록일 ISO.
            authorName: record.author.name, // 작성자.
        })),
    }));

    return { students, classes: classRecords }; // 워크스페이스 + 폼 반 옵션.
}
