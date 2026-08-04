import "server-only";

import { prisma } from "@/lib/db";
import {
    classScopeWhere,
    studentScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";

export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT";

/** 학부모와 현재 연결된 학생 계정을 하나의 수신자 목록으로 확장한다. */
export async function expandParentRecipients(
    parentUserIds: string[],
    excludeUserId: string,
): Promise<string[]> {
    const uniqueParents = [...new Set(parentUserIds)].filter(
        (id) => id && id !== excludeUserId,
    );
    if (uniqueParents.length === 0) return [];

    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId: { in: uniqueParents }, endedAt: null },
        select: {
            parentUserId: true,
            student: { select: { userId: true } },
        },
    });

    const ids = new Set<string>(uniqueParents);
    for (const link of links) {
        const studentUserId = link.student.userId;
        if (studentUserId && studentUserId !== excludeUserId) {
            ids.add(studentUserId);
        }
    }
    return [...ids];
}

async function studentIsInScope(studentId: string, scope: StaffScope | null) {
    const row = await prisma.student.findFirst({
        where: {
            id: studentId,
            ...(scope ? studentScopeWhere(scope) : {}),
        },
        select: { id: true },
    });
    return Boolean(row);
}

async function classIsInScope(classId: string, scope: StaffScope | null) {
    const row = await prisma.class.findFirst({
        where: {
            id: classId,
            active: true,
            ...(scope ? classScopeWhere(scope) : {}),
        },
        select: { id: true },
    });
    return Boolean(row);
}

async function studentIdsForClass(classId: string) {
    const rows = await prisma.classEnrollment.findMany({
        where: { classId, status: "ACTIVE", endedAt: null },
        select: { studentId: true },
    });
    return rows.map((row) => row.studentId);
}

export async function resolveRecipientUserIds(input: {
    actorUserId: string;
    audience: MessageAudience;
    targetStudentId?: string | null;
    targetClassId?: string | null;
    scope: StaffScope | null;
}): Promise<{ ok: true; userIds: string[] } | { ok: false; message: string }> {
    const { actorUserId, audience, targetStudentId, targetClassId, scope } =
        input;
    const isStaffScoped = scope !== null;

    if (isStaffScoped && (audience === "ALL" || audience === "STAFF")) {
        return {
            ok: false,
            message: "직원은 학부모·학생 대상만 요청할 수 있습니다.",
        };
    }
    if (isStaffScoped && !targetStudentId && !targetClassId) {
        return {
            ok: false,
            message: "학생 또는 반을 선택해 주세요.",
        };
    }
    if (targetStudentId && !(await studentIsInScope(targetStudentId, scope))) {
        return { ok: false, message: "대상 학생에 접근할 수 없습니다." };
    }
    if (targetClassId && !(await classIsInScope(targetClassId, scope))) {
        return { ok: false, message: "대상 반에 접근할 수 없습니다." };
    }

    let studentIds: string[] = [];
    if (targetStudentId) studentIds = [targetStudentId];
    if (targetClassId) studentIds = await studentIdsForClass(targetClassId);

    if (audience === "ALL") {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ["DIRECTOR", "STAFF", "TEACHER", "PARENT", "STUDENT"],
                },
                status: "ACTIVE",
            },
            select: { id: true },
        });
        return {
            ok: true,
            userIds: users.map((user) => user.id).filter((id) => id !== actorUserId),
        };
    }

    if (audience === "STAFF") {
        const users = await prisma.user.findMany({
            where: { role: { in: ["STAFF", "TEACHER"] }, status: "ACTIVE" },
            select: { id: true },
        });
        return {
            ok: true,
            userIds: users.map((user) => user.id).filter((id) => id !== actorUserId),
        };
    }

    if (audience === "STUDENT") {
        const users = studentIds.length
            ? await prisma.student.findMany({
                  where: { id: { in: studentIds }, userId: { not: null } },
                  select: { userId: true },
              })
            : await prisma.user.findMany({
                  where: { role: "STUDENT", status: "ACTIVE" },
                  select: { id: true },
              });
        const ids = users.map((user) => ("userId" in user ? user.userId : user.id));
        return {
            ok: true,
            userIds: [...new Set(ids.filter((id): id is string => Boolean(id && id !== actorUserId)))],
        };
    }

    const parentIds = studentIds.length
        ? (
              await prisma.parentStudentLink.findMany({
                  where: { studentId: { in: studentIds }, endedAt: null },
                  select: { parentUserId: true },
              })
          ).map((link) => link.parentUserId)
        : (
              await prisma.user.findMany({
                  where: { role: "PARENT", status: "ACTIVE" },
                  select: { id: true },
              })
          ).map((user) => user.id);

    return {
        ok: true,
        userIds: await expandParentRecipients(parentIds, actorUserId),
    };
}
