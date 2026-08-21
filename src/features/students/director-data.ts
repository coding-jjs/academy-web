import "server-only";

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

import { prisma } from "@/lib/db";
import type {
    DirectorClassOption,
    DirectorStudent,
} from "@/features/students/types";

/**
 * 원장 원생 테이블 데이터와 반 추가 드롭다운.
 *
 * @returns 이름순 학생, 이름순 활성 반. `recentChanges`는 학생당 최신 5건.
 * @auth 페이지가 DIRECTOR만 통과.
 * @sideEffects 없음.
 */
export async function getDirectorStudentsData(): Promise<{
    students: DirectorStudent[];
    classOptions: DirectorClassOption[];
}> {
    const [studentRecords, classRecords] = await Promise.all([
        prisma.student.findMany({
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
                user: { select: { id: true, email: true } },
                enrollments: {
                    where: { status: "ACTIVE", endedAt: null },
                    select: {
                        id: true,
                        enrolledAt: true,
                        class: {
                            select: {
                                id: true,
                                name: true,
                                teacher: { select: { name: true } },
                            },
                        },
                    },
                    orderBy: { enrolledAt: "asc" },
                },
                parentLinks: {
                    where: { endedAt: null },
                    select: {
                        relationship: true,
                        parent: { select: { name: true } },
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
        prisma.class.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                teacher: { select: { name: true } },
            },
            orderBy: { name: "asc" },
        }),
    ]);

    const endedEnrollments = await prisma.classEnrollment.findMany({
        where: {
            studentId: { in: studentRecords.map((student) => student.id) },
            endedAt: { not: null },
        },
        select: {
            id: true,
            studentId: true,
            endedAt: true,
            status: true,
            class: { select: { name: true } },
        },
        orderBy: { endedAt: "desc" },
    });

    const recentChangesByStudent = new Map<
        string,
        typeof endedEnrollments
    >();
    for (const enrollment of endedEnrollments) {
        const studentChanges =
            recentChangesByStudent.get(enrollment.studentId) ?? [];
        if (studentChanges.length < 5) {
            studentChanges.push(enrollment);
            recentChangesByStudent.set(enrollment.studentId, studentChanges);
        }
    }

    const students = studentRecords.map((student) => ({
        id: student.id,
        name: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        status: student.status,
        googleLinked: Boolean(student.user),
        email: student.user?.email ?? null,
        parentCount: student.parentLinks.length,
        parentNames: student.parentLinks.map(
            (parentLink) =>
                `${parentLink.parent.name}${parentLink.relationship ? ` (${parentLink.relationship})` : ""}`,
        ),
        classes: student.enrollments.map((enrollment) => ({
            enrollmentId: enrollment.id,
            classId: enrollment.class.id,
            className: enrollment.class.name,
            teacherName: enrollment.class.teacher?.name ?? null,
            enrolledAt: enrollment.enrolledAt.toISOString(),
        })),
        recentChanges: (
            recentChangesByStudent.get(student.id) ?? []
        ).map((enrollment) => ({
            id: enrollment.id,
            className: enrollment.class.name,
            endedAt: enrollment.endedAt!.toISOString(),
            status: enrollment.status,
        })),
    }));

    const classOptions = classRecords.map((academyClass) => ({
        id: academyClass.id,
        name: academyClass.name,
        teacherName: academyClass.teacher?.name ?? null,
    }));

    return { students, classOptions };
}
