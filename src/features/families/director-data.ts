import "server-only";

/**
 * 원장 학부모 연결 화면에 쓸 활성 링크·연결 가능 학부모/학생을 읽는다.
 *
 * 호출: `(director)/director/parents/page.tsx`.
 * 학생 후보는 이미 활성 링크가 없는 재원 원생만 올려 중복 연결을 막는다.
 * 학부모 후보는 PARENT + ACTIVE + 온보딩 완료. GUEST로 떨어진 계정은 안 나온다.
 *
 * 의도적으로 하지 않는 일:
 * - endedAt이 있는 과거 링크를 목록에 넣지 않는다.
 * - 연결/해제를 수행하지 않는다 → `families/actions.ts`.
 *
 * 관련: `features/families/types.ts`, `features/families/actions.ts`.
 */

import { prisma } from "@/lib/db";
import type {
    ActiveFamilyLink,
    LinkableParent,
    LinkableStudent,
} from "@/features/families/types";

/**
 * 연결 폼 옵션과 현재 활성 링크 목록.
 *
 * @returns `parents`/`students`는 이름순, `activeLinks`는 최근 연결순.
 * @auth 페이지가 DIRECTOR만 통과.
 * @sideEffects 없음.
 */
export async function getDirectorFamilyLinksData(): Promise<{
    parents: LinkableParent[];
    students: LinkableStudent[];
    activeLinks: ActiveFamilyLink[];
}> {
    const [parents, students, linkRecords] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "PARENT",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" },
        }),
        prisma.student.findMany({
            where: {
                status: "ENROLLED",
                user: { is: { role: "STUDENT", status: "ACTIVE" } },
                parentLinks: { none: { endedAt: null } },
            },
            select: { id: true, name: true, schoolName: true, grade: true },
            orderBy: { name: "asc" },
        }),
        prisma.parentStudentLink.findMany({
            where: { endedAt: null },
            select: {
                id: true,
                relationship: true,
                linkedAt: true,
                parent: {
                    select: { name: true, email: true, phone: true },
                },
                student: {
                    select: {
                        name: true,
                        schoolName: true,
                        grade: true,
                        user: { select: { email: true } },
                    },
                },
            },
            orderBy: { linkedAt: "desc" },
        }),
    ]);

    const activeLinks = linkRecords.map((link) => ({
        id: link.id,
        relationship: link.relationship,
        linkedAt: link.linkedAt.toISOString(),
        parent: link.parent,
        student: {
            name: link.student.name,
            schoolName: link.student.schoolName,
            grade: link.student.grade,
            email: link.student.user?.email ?? null,
        },
    }));

    return { parents, students, activeLinks };
}
