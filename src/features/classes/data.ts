import "server-only"; // 읽기 전용. CRUD는 classes/actions.

/**
 * 원장 반 관리 화면용 반 목록·담당 교사 옵션·최근 회차를 읽는다.
 *
 * 호출: `(director)/director/classes/page.tsx`.
 * 회차는 반당 최신 30건이며, 교사 후보는 ACTIVE TEACHER/STAFF다.
 * 수강 인원은 ACTIVE+endedAt null만 센다 (CANCELLED 수강 제외).
 *
 * 의도적으로 하지 않는 일:
 * - CANCELLED 회차를 목록에서 빼지 않는다. 편집기가 취소 이력을 보여 준다.
 * - 반을 쓰지 않는다 → `classes/actions.ts`.
 *
 * 관련: `features/classes/types.ts`, `ClassesManagementScreen.tsx`.
 */

import { prisma } from "@/lib/db"; // findMany만. create/cancel은 actions.
import type { // 목록·담당 select.
    ClassRow, // CANCELLED 회차 포함. 편집기가 이력을 보여 준다.
    TeacherOption, // DIRECTOR는 후보가 아니다.
} from "@/features/classes/types"; // ClassList·ClassEditor가 이 형태로 그린다.

/**
 * 반 관리 UI 초기 데이터.
 *
 * @returns 활성 반이 위로, 이름순. teachers는 이름순.
 * @auth 페이지가 DIRECTOR만 통과.
 * @sideEffects 없음.
 */
export async function getClassesManagementData(): Promise<{ // Screen 초기값. 쓰기는 ClassEditor.
    classes: ClassRow[]; // 비활성은 아래. 삭제하지 않고 active=false.
    teachers: TeacherOption[]; // ACTIVE TEACHER/STAFF.
}> { // 수강 인원은 ACTIVE+endedAt null만.
    const [classRecords, teacherRecords] = await Promise.all([ // 반과 담당 옵션.
        prisma.class.findMany({ // CANCELLED 회차를 목록에서 빼지 않는다.
            orderBy: [{ active: "desc" }, { name: "asc" }], // 비활성 반은 아래. 삭제하지 않고 active=false.
            select: { // 반당 회차 30건. 수강 인원 count.
                id: true, // ClassEditor key.
                name: true, // 반 이름.
                subject: true, // 과목.
                teacherUserId: true, // 출결 own/other 판정.
                active: true, // false면 이후 회차 생성 거절.
                teacher: { select: { name: true } }, // 담당 이름.
                _count: { // 목록 "수강 N명".
                    select: { // CANCELLED 수강은 인원에 안 넣는다.
                        enrollments: { // 활성 수강만.
                            where: { status: "ACTIVE", endedAt: null }, // CANCELLED 수강은 인원에 안 넣는다.
                        },
                    },
                },
                sessions: { // 편집기 목록. CANCELLED 포함.
                    orderBy: { startsAt: "desc" }, // 최신 회차가 위.
                    take: 30, // CANCELLED 포함. 편집기가 취소 이력을 보여 준다.
                    select: { // ISO로 바꾼다. 표시는 date-time이 KST.
                        id: true, // cancelClassSession의 sessionId.
                        startsAt: true, // UTC Instant.
                        endsAt: true, // UTC Instant.
                        classroom: true, // 선택.
                        status: true, // SCHEDULED만 취소 버튼.
                    },
                },
            },
        }),
        prisma.user.findMany({ // 담당 select. 원장은 후보가 아니다.
            where: { // DIRECTOR는 담당 후보가 아니다.
                role: { in: ["TEACHER", "STAFF"] }, // DIRECTOR는 담당 후보가 아니다.
                status: "ACTIVE", // BLOCKED는 옵션에서 뺀다.
            },
            orderBy: { name: "asc" }, // 이름순.
            select: { id: true, name: true, role: true }, // TeacherOption.
        }),
    ]);

    const classes = classRecords.map((academyClass) => ({ // Prisma Date를 ISO로.
        id: academyClass.id, // 선택 key.
        name: academyClass.name, // 반 이름.
        subject: academyClass.subject, // 과목.
        teacherUserId: academyClass.teacherUserId, // 출결 own/other 판정. 미지정이면 null.
        teacherName: academyClass.teacher?.name ?? null, // 목록 라벨.
        active: academyClass.active, // 비활성은 이름 옆에 표시.
        enrollmentCount: academyClass._count.enrollments, // ACTIVE+endedAt null만.
        sessions: academyClass.sessions.map((classSession) => ({ // 반당 30건.
            id: classSession.id, // 취소 버튼.
            startsAt: classSession.startsAt.toISOString(), // UTC ISO. 표시는 date-time이 KST.
            endsAt: classSession.endsAt.toISOString(), // UTC ISO.
            classroom: classSession.classroom, // 선택.
            status: classSession.status, // CANCELLED도 남긴다.
        })),
    }));

    const teachers = teacherRecords.map((teacher) => ({ // 담당 select 옵션.
        id: teacher.id, // teacherUserId.
        name: teacher.name, // 라벨.
        role: teacher.role as TeacherOption["role"], // TEACHER/STAFF. where가 보장.
    }));

    return { classes, teachers }; // ClassList + ClassEditor.
}
