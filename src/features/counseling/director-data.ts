import "server-only";

import { prisma } from "@/lib/db";
import type { StaffCounselingMemo } from "@/features/counseling/types";

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
