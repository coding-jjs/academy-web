import "server-only"; // 읽기 전용. 수강/상태는 director-actions.

/**
 * 원장 원생 목록과 수강 추가용 활성 반 옵션을 읽는다.
 *
 * 호출: `(director)/director/students/page.tsx` → `DirectorStudentsScreen`.
 * 재원/휴원/퇴원 전체를 보여 주고, 학생별 최근 수강 변경은 최대 5건이다.
 * 활성 수강은 endedAt=null + ACTIVE, 변경 이력은 endedAt이 있는 행(주로 CANCELLED).
 *
 * 의도적으로 하지 않는 일:
 * - 권한 스코프를 적용하지 않는다. 원장은 전원.
 * - 상태를 바꾸지 않는다 → `director-actions`.
 *
 * 관련: `features/students/types.ts`, `lib/student-lifecycle.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. CANCELLED+endedAt 쓰기는 actions.
import type { // 테이블 행·반 추가 드롭다운.
    DirectorClassOption, // active 반만. 비활성은 add가 거절.
    DirectorStudent, // googleLinked는 userId 존재 여부.
} from "@/features/students/types"; // DirectorStudentsScreen이 이 형태로 그린다.

/**
 * 원장 원생 테이블 데이터와 반 추가 드롭다운.
 *
 * @returns 이름순 학생, 이름순 활성 반. `recentChanges`는 학생당 최신 5건.
 * @auth 페이지가 DIRECTOR만 통과.
 * @sideEffects 없음.
 */
export async function getDirectorStudentsData(): Promise<{ // 화면 초기값. 쓰기는 director-actions.
    students: DirectorStudent[]; // 재원/휴원/퇴원 전부. 원장은 퇴원도 본다.
    classOptions: DirectorClassOption[]; // 수강 추가. active만.
}> { // 스코프 없음. 원장은 전원.
    const [studentRecords, classRecords] = await Promise.all([ // 카드와 반 옵션.
        prisma.student.findMany({ // 권한 스코프를 적용하지 않는다.
            select: { // 활성 수강과 학부모 요약. 이력은 아래 endedEnrollments.
                id: true, // Student.id. User.id가 아니다.
                name: true, // 원생 이름.
                schoolName: true, // 학교.
                grade: true, // 학년.
                status: true, // ENROLLED/PAUSED/WITHDRAWN 전부. 원장은 퇴원도 본다.
                user: { select: { id: true, email: true } }, // 없으면 googleLinked false. userId:null 카드.
                enrollments: { // 현재 반. 해제 버튼 enrollmentId.
                    where: { status: "ACTIVE", endedAt: null }, // 취소된 수강은 classes가 아니라 recentChanges.
                    select: { // 해제 버튼이 이 id로 CANCELLED+endedAt.
                        id: true, // enrollmentId.
                        enrolledAt: true, // ISO로 바꾼다.
                        class: { // 반 요약.
                            select: { // 담당 미지정 null.
                                id: true, // classId.
                                name: true, // 반 이름.
                                teacher: { select: { name: true } }, // 담당.
                            },
                        },
                    },
                    orderBy: { enrolledAt: "asc" }, // 수강 시작 순.
                },
                parentLinks: { // 활성 보호자. 보통 0 또는 1.
                    where: { endedAt: null }, // 해제된 보호자는 카운트하지 않는다.
                    select: { // parentNames 문자열용.
                        relationship: true, // 괄호 안 관계.
                        parent: { select: { name: true } }, // 학부모 이름.
                    },
                },
            },
            orderBy: { name: "asc" }, // 이름순.
        }),
        prisma.class.findMany({ // 수강 추가 드롭다운.
            where: { active: true }, // 비활성 반에는 addStudentEnrollment가 거절하므로 옵션에서 뺀다.
            select: { // 담당 이름.
                id: true, // classId.
                name: true, // 반 이름.
                teacher: { select: { name: true } }, // 담당 미지정 null.
            },
            orderBy: { name: "asc" }, // 이름순.
        }),
    ]);

    const endedEnrollments = await prisma.classEnrollment.findMany({ // 행 삭제가 아니라 이력. 주로 CANCELLED.
        where: { // 활성 수강은 위 enrollments.
            studentId: { in: studentRecords.map((student) => student.id) }, // 목록에 있는 원생만.
            endedAt: { not: null }, // 행 삭제가 아니라 이력. 주로 CANCELLED.
        },
        select: { // recentChanges 5건용.
            id: true, // 이력 행.
            studentId: true, // 맵 키.
            endedAt: true, // ISO.
            status: true, // 주로 CANCELLED.
            class: { select: { name: true } }, // 반 이름.
        },
        orderBy: { endedAt: "desc" }, // 최신 해제가 앞. 학생당 5건만 담는다.
    });

    const recentChangesByStudent = new Map< // 학생당 최신 5건.
        string, // studentId.
        typeof endedEnrollments // 이미 endedAt desc.
    >(); // 빈 맵. 아래에서 채운다.
    for (const enrollment of endedEnrollments) { // 앞에서부터 5건. 쿼리가 desc.
        const studentChanges = // 없으면 빈 배열.
            recentChangesByStudent.get(enrollment.studentId) ?? []; // 학생별 버킷.
        if (studentChanges.length < 5) { // 이미 endedAt desc라 앞에서 5건만.
            studentChanges.push(enrollment); // 이미 endedAt desc라 앞에서 5건만.
            recentChangesByStudent.set(enrollment.studentId, studentChanges); // 버킷 갱신.
        }
    }

    const students = studentRecords.map((student) => ({ // 화면 행. Prisma Date를 ISO로.
        id: student.id, // Student.id.
        name: student.name, // 원생 이름.
        schoolName: student.schoolName, // 학교.
        grade: student.grade, // 학년.
        status: student.status, // 재원/휴원/퇴원.
        googleLinked: Boolean(student.user), // userId:null 카드는 false. STUDENT 역할 부여 후보.
        email: student.user?.email ?? null, // 미연결이면 null.
        parentCount: student.parentLinks.length, // 활성 링크. 보통 0 또는 1.
        parentNames: student.parentLinks.map( // "이름 (관계)".
            (parentLink) => // 관계가 없으면 괄호 생략.
                `${parentLink.parent.name}${parentLink.relationship ? ` (${parentLink.relationship})` : ""}`, // 목록 칩.
        ),
        classes: student.enrollments.map((enrollment) => ({ // ACTIVE+endedAt null만.
            enrollmentId: enrollment.id, // 해제 버튼이 이 id로 CANCELLED+endedAt.
            classId: enrollment.class.id, // 반 id.
            className: enrollment.class.name, // 반 이름.
            teacherName: enrollment.class.teacher?.name ?? null, // 담당 미지정.
            enrolledAt: enrollment.enrolledAt.toISOString(), // 수강 시작 ISO.
        })),
        recentChanges: ( // 학생당 최신 5건. 없으면 빈 배열.
            recentChangesByStudent.get(student.id) ?? [] // 버킷.
        ).map((enrollment) => ({ // 이력 한 줄.
            id: enrollment.id, // 종료된 수강 행.
            className: enrollment.class.name, // 반 이름.
            endedAt: enrollment.endedAt!.toISOString(), // where가 not null.
            status: enrollment.status, // 주로 CANCELLED.
        })),
    }));

    const classOptions = classRecords.map((academyClass) => ({ // 수강 추가 select.
        id: academyClass.id, // classId.
        name: academyClass.name, // 반 이름.
        teacherName: academyClass.teacher?.name ?? null, // 담당.
    }));

    return { students, classOptions }; // 테이블 + 드롭다운.
}
