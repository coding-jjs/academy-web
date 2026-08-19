import "server-only"; // 조회만. 브라우저가 Prisma를 치지 않는다.

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

import { prisma } from "@/lib/db"; // server-only Prisma. 브라우저가 직접 치지 않는다.
import { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    classScopeWhere, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    studentScopeWhere, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    type StaffScope, // StaffScope 타입. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
} from "@/lib/staff-scope"; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.

/** 발송 대상. 직원 스코프가 있으면 ALL/STAFF 요청은 거절한다. */
export type MessageAudience = "ALL" | "STAFF" | "PARENT" | "STUDENT"; // MessageAudience 타입. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.

/**
 * 학부모 userId만 수신자로 남긴다. 학생 계정 id가 섞여 있어도 이 목록에는 넣지 않는 전제다.
 * 호출부가 parentStudentLink / role=PARENT 결과만 넘기도록 `filterParentsLinkedToScopedStudents`와 짝을 이룬다.
 */
export async function expandParentRecipients( // 학부모 User만. 학생 계정은 수신에서 뺀다.
    parentUserIds: string[], // 학부모 User. 학생 계정이 섞이면 거절.
    excludeUserId: string, // excludeUserId. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
): Promise<string[]> { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    return [...new Set(parentUserIds)].filter( // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        (id) => id && id !== excludeUserId, // 학생 계정 id가 섞여 있어도 이 목록에는 넣지 않는 전제. 작성자 본인도 뺀다.
    );
}

async function studentIsInScope(studentId: string, scope: StaffScope | null) { // studentIsInScope. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const row = await prisma.student.findFirst({ // 저장 행. 삭제는 없다.
        where: { // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            id: studentId, // id. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ...(scope ? studentScopeWhere(scope) : {}), // scope=null이면 원장(전 원생).
        },
        select: { id: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    });
    return Boolean(row); // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
}

async function classIsInScope(classId: string, scope: StaffScope | null) { // classIsInScope. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const row = await prisma.class.findFirst({ // 저장 행. 삭제는 없다.
        where: { // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            id: classId, // id. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            active: true, // active. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ...(scope ? classScopeWhere(scope) : {}), // 전개. 알 수 없는 키를 통과시키지 않는다.
        },
        select: { id: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    });
    return Boolean(row); // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
}

async function studentIdsForClass(classId: string) { // studentIdsForClass. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const rows = await prisma.classEnrollment.findMany({ // rows. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        where: { classId, status: "ACTIVE", endedAt: null }, // 해제 수강은 수신에서 뺀다.
        select: { studentId: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    });
    return rows.map((row) => row.studentId); // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
}

async function assertStudentsInScope( // assertStudentsInScope. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    studentIds: string[], // studentIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    scope: StaffScope | null, // 직원 스코프. 원장은 전 원생.
) { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    for (const studentId of studentIds) { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        if (!(await studentIsInScope(studentId, scope))) { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                ok: false as const, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                message: "대상 학생에 접근할 수 없습니다.", // 하나라도 스코프 밖이면 전체 거절. 부분 발송하지 않는다.
            };
        }
    }
    return { ok: true as const }; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
}

/** 스코프 안 재원생과 연결된 ACTIVE PARENT만 남긴다. 학생 계정·끊긴 링크는 뺀다. */
async function filterParentsLinkedToScopedStudents( // filterParentsLinkedToScopedStudents. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    parentUserIds: string[], // 학부모 User. 학생 계정이 섞이면 거절.
    scope: StaffScope | null, // 직원 스코프. 원장은 전 원생.
) { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const uniqueParentIds = [...new Set(parentUserIds)].filter(Boolean); // uniqueParentIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    if (uniqueParentIds.length === 0) return []; // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.

    const links = await prisma.parentStudentLink.findMany({ // links. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        where: { // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            parentUserId: { in: uniqueParentIds }, // parentUserId. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            endedAt: null, // 끊긴 링크는 뺀다.
            student: { // 스코프·존재 검사. 학부모 뷰어 쿼리가 아니다.
                status: "ENROLLED", // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
                ...(scope ? studentScopeWhere(scope) : {}), // 전개. 알 수 없는 키를 통과시키지 않는다.
            },
            parent: { status: "ACTIVE", role: "PARENT" }, // 학생 User가 링크에 있어도 role=PARENT가 아니면 수신에서 뺀다.
        },
        select: { parentUserId: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    });

    return [...new Set(links.map((link) => link.parentUserId))]; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
}

/**
 * 대상 필터를 수신 User id 목록으로 펼친다.
 * 직원(scope != null)은 PARENT/STUDENT만 요청할 수 있고, 대상 미선택이면 거절한다.
 */
export async function resolveRecipientUserIds(input: { // resolveRecipientUserIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    actorUserId: string; // actorUserId. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    audience: MessageAudience; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    targetStudentId?: string | null; // 원생 카드. 승인 때 스코프로 다시 펼친다.
    targetClassId?: string | null; // targetClassId. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    targetStudentIds?: string[] | null; // 학생 체크 목록. 학부모 User id가 아니다.
    targetParentUserIds?: string[] | null; // targetParentUserIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    scope: StaffScope | null; // 직원 스코프. 원장은 전 원생.
}): Promise<{ ok: true; userIds: string[] } | { ok: false; message: string }> { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        actorUserId, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        audience, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        targetStudentId, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        targetClassId, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        targetStudentIds, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        targetParentUserIds, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        scope, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    } = input; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const isStaffScoped = scope !== null; // 원장 즉시 발송은 scope=null. 직원 승인 요청·승인 재펼침은 작성자 스코프.

    if (isStaffScoped && (audience === "ALL" || audience === "STAFF")) { // 교사·사무. 학부모·학생은 거절.
        return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ok: false, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            message: "직원은 학부모·학생 대상만 요청할 수 있습니다.", // message. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        };
    }

    const multiStudentIds = [ // multiStudentIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (targetStudentIds ?? []) // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .map((id) => id.trim()) // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .filter(Boolean), // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        ),
    ]; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const multiParentIds = [ // multiParentIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (targetParentUserIds ?? []) // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .map((id) => id.trim()) // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .filter(Boolean), // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        ),
    ]; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    const hasMultiTargets = // hasMultiTargets. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        multiStudentIds.length > 0 || multiParentIds.length > 0; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.

    if ( // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        isStaffScoped && // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        !hasMultiTargets && // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        !targetStudentId && // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        !targetClassId // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    ) { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ok: false, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            message: "수신 대상을 선택해 주세요.", // 빈 필터로 전원 발송하지 않는다.
        };
    }

    if (audience === "PARENT" && multiParentIds.length > 0) { // 학부모 분기. 학생 계정 수신과 나눈다.
        const allowedParents = await filterParentsLinkedToScopedStudents( // allowedParents. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            multiParentIds, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            scope, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        );
        if (allowedParents.length === 0) { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            return { ok: false, message: "선택 가능한 학부모가 없습니다." }; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        }
        if (allowedParents.length !== multiParentIds.length) { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                ok: false, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                message: "담당 학생과 연결되지 않은 학부모가 포함되어 있습니다.", // 학생 계정 id가 섞이면 거절.
            };
        }
        return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ok: true, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            userIds: await expandParentRecipients(allowedParents, actorUserId), // PARENT User만. 학생 계정은 넣지 않는다.
        };
    }

    if (multiStudentIds.length > 0) { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        const scoped = await assertStudentsInScope(multiStudentIds, scope); // scoped. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        if (!scoped.ok) return scoped; // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    } else if (targetStudentId) { // 다른 분기. 로직은 그대로.
        if (!(await studentIsInScope(targetStudentId, scope))) { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            return { ok: false, message: "대상 학생에 접근할 수 없습니다." }; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        }
    }

    if (targetClassId && !(await classIsInScope(targetClassId, scope))) { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        return { ok: false, message: "대상 반에 접근할 수 없습니다." }; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    }

    let studentIds: string[] = []; // studentIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    if (multiStudentIds.length > 0) studentIds = multiStudentIds; // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    else if (targetStudentId) studentIds = [targetStudentId]; // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
    else if (targetClassId) studentIds = await studentIdsForClass(targetClassId); // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.

    if (audience === "ALL") { // 가드. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        const users = await prisma.user.findMany({ // users. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            where: { // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                role: { // 역할 분기. 학부모·학생은 거절.
                    in: ["DIRECTOR", "STAFF", "TEACHER", "PARENT", "STUDENT"], // in. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                },
                status: "ACTIVE", // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
            },
            select: { id: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        });
        return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ok: true, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            userIds: users // userIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .map((user) => user.id) // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .filter((id) => id !== actorUserId), // 작성자는 수신에서 뺀다.
        };
    }

    if (audience === "STAFF") { // 교사·사무. 학부모·학생은 거절.
        const users = await prisma.user.findMany({ // users. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            where: { role: { in: ["STAFF", "TEACHER"] }, status: "ACTIVE" }, // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            select: { id: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        });
        return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ok: true, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            userIds: users // userIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .map((user) => user.id) // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                .filter((id) => id !== actorUserId), // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        };
    }

    if (audience === "STUDENT") { // 학생 분기. /student/ 링크만.
        const users = studentIds.length // users. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ? await prisma.student.findMany({ // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  where: { id: { in: studentIds }, userId: { not: null } }, // 계정 없는 학생은 빠진다.
                  select: { userId: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
              })
            : await prisma.user.findMany({ // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  where: { role: "STUDENT", status: "ACTIVE" }, // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  select: { id: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
              });
        const ids = users.map((user) => // ids. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            "userId" in user ? user.userId : user.id, // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        );
        return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            ok: true, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
            userIds: [ // userIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
                    ids.filter((id): id is string => // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                        Boolean(id && id !== actorUserId), // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                    ),
                ),
            ], // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        };
    }

    const parentIds = studentIds.length // parentIds. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        ? ( // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
              await prisma.parentStudentLink.findMany({ // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  where: { studentId: { in: studentIds }, endedAt: null }, // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  select: { parentUserId: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
              })
          ).map((link) => link.parentUserId) // 링크된 학부모 User. 학생 User id는 넣지 않는다.
        : ( // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
              await prisma.user.findMany({ // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  where: { role: "PARENT", status: "ACTIVE" }, // where. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
                  select: { id: true }, // select. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
              })
          ).map((user) => user.id); // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.

    return { // 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        ok: true, // ok. 수신 User id 펼치기. 학부모는 학생 계정 제외. 작성자 exclude.
        userIds: await expandParentRecipients(parentIds, actorUserId), // 학부모 User id만. 작성자 본인도 뺀다.
    };
}
