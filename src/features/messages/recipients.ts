import "server-only";

/**
 * audience·스코프·반/학생/학부모 id를 실제 수신 User id로 펼친다.
 *
 * 호출: `messages/actions.ts`의 발송·승인, 리포트/이탈 쪽지가 `expandParentRecipients`를 재사용한다.
 * 학부모 수신은 연결된 학부모 계정만 포함하고, 학생 User id는 PARENT audience에 넣지 않는다.
 * 받는 사람 계산을 작곡기에서 빼 화면이 User id를 직접 고르지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - Message 행을 만들지 않음. id 목록만 돌려준다.
 * - 작성자를 수신에 넣지 않음(excludeUserId).
 *
 * 관련: `actions.ts`, `target-filter.ts`.
 */

import { prisma } from "@/lib/db";
import {
    classScopeWhere,
    studentScopeWhere,
    type StaffScope,
} from "@/lib/staff-scope";

/** 발송 대상. 직원 스코프가 있으면 ALL/STAFF 요청은 거절한다. */
export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT";

/**
 * 학부모 userId만 수신자로 남긴다. 학생 계정 id가 섞여 있어도 이 목록에는 넣지 않는 전제다.
 * 호출부가 parentStudentLink / role=PARENT 결과만 넘기도록 `filterParentsLinkedToScopedStudents`와 짝을 이룬다.
 */
export async function expandParentRecipients(
    parentUserIds: string[],
    excludeUserId: string,
): Promise<string[]> {
    return [...new Set(parentUserIds)].filter(
        (id) => id && id !== excludeUserId,
    );
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

async function assertStudentsInScope(
    studentIds: string[],
    scope: StaffScope | null,
) {
    for (const studentId of studentIds) {
        if (!(await studentIsInScope(studentId, scope))) {
            return {
                ok: false as const,
                message: "대상 학생에 접근할 수 없습니다.",
            };
        }
    }
    return { ok: true as const };
}

/** 스코프 안 재원생과 연결된 ACTIVE PARENT만 남긴다. 학생 계정·끊긴 링크는 뺀다. */
async function filterParentsLinkedToScopedStudents(
    parentUserIds: string[],
    scope: StaffScope | null,
) {
    const uniqueParentIds = [...new Set(parentUserIds)].filter(Boolean);
    if (uniqueParentIds.length === 0) return [];

    const links = await prisma.parentStudentLink.findMany({
        where: {
            parentUserId: { in: uniqueParentIds },
            endedAt: null,
            student: {
                status: "ENROLLED",
                ...(scope ? studentScopeWhere(scope) : {}),
            },
            parent: { status: "ACTIVE", role: "PARENT" },
        },
        select: { parentUserId: true },
    });

    return [...new Set(links.map((link) => link.parentUserId))];
}

/**
 * 대상 필터를 수신 User id 목록으로 펼친다.
 * 직원(scope != null)은 PARENT/STUDENT만 요청할 수 있고, 대상 미선택이면 거절한다.
 */
export async function resolveRecipientUserIds(input: {
    actorUserId: string;
    audience: MessageAudience;
    targetStudentId?: string | null;
    targetClassId?: string | null;
    targetStudentIds?: string[] | null;
    targetParentUserIds?: string[] | null;
    scope: StaffScope | null;
}): Promise<{ ok: true; userIds: string[] } | { ok: false; message: string }> {
    const {
        actorUserId,
        audience,
        targetStudentId,
        targetClassId,
        targetStudentIds,
        targetParentUserIds,
        scope,
    } = input;
    const isStaffScoped = scope !== null;

    if (isStaffScoped && (audience === "ALL" || audience === "STAFF")) {
        return {
            ok: false,
            message: "직원은 학부모·학생 대상만 요청할 수 있습니다.",
        };
    }

    const multiStudentIds = [
        ...new Set(
            (targetStudentIds ?? [])
                .map((id) => id.trim())
                .filter(Boolean),
        ),
    ];
    const multiParentIds = [
        ...new Set(
            (targetParentUserIds ?? [])
                .map((id) => id.trim())
                .filter(Boolean),
        ),
    ];
    const hasMultiTargets =
        multiStudentIds.length > 0 || multiParentIds.length > 0;

    if (
        isStaffScoped &&
        !hasMultiTargets &&
        !targetStudentId &&
        !targetClassId
    ) {
        return {
            ok: false,
            message: "수신 대상을 선택해 주세요.",
        };
    }

    if (audience === "PARENT" && multiParentIds.length > 0) {
        const allowedParents = await filterParentsLinkedToScopedStudents(
            multiParentIds,
            scope,
        );
        if (allowedParents.length === 0) {
            return { ok: false, message: "선택 가능한 학부모가 없습니다." };
        }
        if (allowedParents.length !== multiParentIds.length) {
            return {
                ok: false,
                message: "담당 학생과 연결되지 않은 학부모가 포함되어 있습니다.",
            };
        }
        return {
            ok: true,
            userIds: await expandParentRecipients(allowedParents, actorUserId),
        };
    }

    if (multiStudentIds.length > 0) {
        const scoped = await assertStudentsInScope(multiStudentIds, scope);
        if (!scoped.ok) return scoped;
    } else if (targetStudentId) {
        if (!(await studentIsInScope(targetStudentId, scope))) {
            return { ok: false, message: "대상 학생에 접근할 수 없습니다." };
        }
    }

    if (targetClassId && !(await classIsInScope(targetClassId, scope))) {
        return { ok: false, message: "대상 반에 접근할 수 없습니다." };
    }

    let studentIds: string[] = [];
    if (multiStudentIds.length > 0) studentIds = multiStudentIds;
    else if (targetStudentId) studentIds = [targetStudentId];
    else if (targetClassId) studentIds = await studentIdsForClass(targetClassId);

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
            userIds: users
                .map((user) => user.id)
                .filter((id) => id !== actorUserId),
        };
    }

    if (audience === "STAFF") {
        const users = await prisma.user.findMany({
            where: { role: { in: ["STAFF", "TEACHER"] }, status: "ACTIVE" },
            select: { id: true },
        });
        return {
            ok: true,
            userIds: users
                .map((user) => user.id)
                .filter((id) => id !== actorUserId),
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
        const ids = users.map((user) =>
            "userId" in user ? user.userId : user.id,
        );
        return {
            ok: true,
            userIds: [
                ...new Set(
                    ids.filter((id): id is string =>
                        Boolean(id && id !== actorUserId),
                    ),
                ),
            ],
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
