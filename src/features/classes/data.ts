import "server-only";

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

import { prisma } from "@/lib/db";
import type {
    ClassRow,
    TeacherOption,
} from "@/features/classes/types";

/**
 * 반 관리 UI 초기 데이터.
 *
 * @returns 활성 반이 위로, 이름순. teachers는 이름순.
 * @auth 페이지가 DIRECTOR만 통과.
 * @sideEffects 없음.
 */
export async function getClassesManagementData(): Promise<{
    classes: ClassRow[];
    teachers: TeacherOption[];
}> {
    const [classRecords, teacherRecords] = await Promise.all([
        prisma.class.findMany({
            orderBy: [{ active: "desc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                subject: true,
                teacherUserId: true,
                active: true,
                teacher: { select: { name: true } },
                _count: {
                    select: {
                        enrollments: {
                            where: { status: "ACTIVE", endedAt: null },
                        },
                    },
                },
                sessions: {
                    orderBy: { startsAt: "desc" },
                    take: 30,
                    select: {
                        id: true,
                        startsAt: true,
                        endsAt: true,
                        classroom: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.user.findMany({
            where: {
                role: { in: ["TEACHER", "STAFF"] },
                status: "ACTIVE",
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true, role: true },
        }),
    ]);

    const classes = classRecords.map((academyClass) => ({
        id: academyClass.id,
        name: academyClass.name,
        subject: academyClass.subject,
        teacherUserId: academyClass.teacherUserId,
        teacherName: academyClass.teacher?.name ?? null,
        active: academyClass.active,
        enrollmentCount: academyClass._count.enrollments,
        sessions: academyClass.sessions.map((classSession) => ({
            id: classSession.id,
            startsAt: classSession.startsAt.toISOString(),
            endsAt: classSession.endsAt.toISOString(),
            classroom: classSession.classroom,
            status: classSession.status,
        })),
    }));

    const teachers = teacherRecords.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        role: teacher.role as TeacherOption["role"],
    }));

    return { classes, teachers };
}
