import "server-only";

/**
 * 원장 역할 부여 화면에 쓸 GUEST 대기 목록과 연결 가능 원생을 읽는다.
 *
 * 호출: `(director)/director/users/page.tsx`가 서버에서 불러
 * `DirectorUsersScreen`에 넘긴다.
 *
 * 온보딩을 끝낸 ACTIVE GUEST만 보여 주고,
 * 학생 후보는 userId가 없는 재원/휴원 카드다 (퇴원·이미 연결된 카드 제외).
 *
 * 의도적으로 하지 않는 일:
 * - 역할을 바꾸지 않는다 → `assignUserRole`.
 * - 미온보딩 GUEST를 넣지 않는다 → 가입 폼이 끝나지 않은 계정.
 *
 * 관련: `features/users/types.ts`, `features/users/actions.ts`.
 */

import { prisma } from "@/lib/db";
import type {
    PendingRoleUser,
    UnlinkedStudentOption,
} from "@/features/users/types";

/**
 * 역할 부여 화면의 대기 GUEST와 연결 가능 학생 카드.
 *
 * @returns `users`는 최신 가입 순. `unlinkedStudents`는 이름순.
 * @auth 페이지 레이아웃이 DIRECTOR만 통과시킨다. 이 함수는 역할 재검사하지 않는다.
 * @sideEffects 없음. 읽기 전용.
 */
export async function getPendingRoleUsersData(): Promise<{
    users: PendingRoleUser[];
    unlinkedStudents: UnlinkedStudentOption[];
}> {
    const [userRecords, unlinkedStudents] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: "GUEST",
                status: "ACTIVE",
                onboardingCompleteAt: { not: null },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                schoolName: true,
                grade: true,
                createdAt: true,
                studentProfile: { select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.student.findMany({
            where: {
                userId: null,
                status: { in: ["ENROLLED", "PAUSED"] },
            },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                status: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);

    return {
        users: userRecords.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            schoolName: user.schoolName,
            grade: user.grade,
            joinedAt: user.createdAt.toISOString(),
            hasStudentProfile: Boolean(user.studentProfile),
        })),
        unlinkedStudents,
    };
}
