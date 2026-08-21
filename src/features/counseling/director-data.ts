import "server-only";

/**
 * 원장 학생 관리에 붙는 상담 메모 목록.
 *
 * 호출: `/director/students`가 `DirectorStudentsScreen`에 넘긴다.
 * 스코프 없이 전 원생 이력을 모아 한 화면에서 보게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 직원 스코프 적용 → `staff-data.ts`.
 * - 문의 목록을 붙이지 않음. 문의는 직원 상담 화면.
 *
 * 관련: `actions.ts`의 createDirectorCounselingMemo, `types.ts`.
 */

import { prisma } from "@/lib/db";
import type { StaffCounselingMemo } from "@/features/counseling/types";

/**
 * 최근 상담 메모 최대 500건. 학생 상세에서 해당 studentId만 걸러 보여 준다.
 */
export async function getDirectorCounselingMemos(): Promise<
    StaffCounselingMemo[]
> {
    const records = await prisma.counselingMemo.findMany({
        orderBy: [{ counseledAt: "desc" }, { createdAt: "desc" }],
        take: 500,
        select: {
            id: true,
            content: true,
            counseledAt: true,
            createdAt: true,
            studentId: true,
            student: {
                select: {
                    name: true,
                    grade: true,
                },
            },
            author: {
                select: {
                    name: true,
                },
            },
        },
    });

    return records.map((memo) => ({
        id: memo.id,
        content: memo.content,
        counseledAt: memo.counseledAt.toISOString(),
        createdAt: memo.createdAt.toISOString(),
        studentId: memo.studentId,
        studentName: memo.student.name,
        studentGrade: memo.student.grade,
        authorName: memo.author.name,
    }));
}
