import "server-only";

import { prisma } from "@/lib/db";
import type { TeacherChurnCareTask } from "@/features/churn/types";

export async function getTeacherChurnCareTasks(
    teacherUserId: string,
): Promise<TeacherChurnCareTask[]> {
    const rows = await prisma.churnCase.findMany({
        where: {
            assignedUserId: teacherUserId,
            status: { in: ["COUNSELING", "PENDING_REVIEW"] },
            student: { status: "ENROLLED" },
        },
        orderBy: { detectedAt: "desc" },
        select: {
            id: true,
            status: true,
            summary: true,
            detectedAt: true,
            student: {
                select: {
                    id: true,
                    name: true,
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        take: 1,
                        select: { class: { select: { name: true } } },
                    },
                },
            },
            counselingMemos: {
                orderBy: { counseledAt: "desc" },
                take: 1,
                select: {
                    content: true,
                    counseledAt: true,
                    author: { select: { name: true } },
                },
            },
        },
    });

    return rows
        .filter(
            (row): row is typeof row & { status: "COUNSELING" | "PENDING_REVIEW" } =>
                row.status === "COUNSELING" || row.status === "PENDING_REVIEW",
        )
        .map((row) => {
            const latestMemo = row.counselingMemos[0] ?? null;
            return {
                churnCaseId: row.id,
                studentId: row.student.id,
                studentName: row.student.name,
                className: row.student.enrollments[0]?.class.name ?? null,
                reason: row.summary?.trim() || "이탈 신호",
                status: row.status,
                detectedAt: row.detectedAt.toISOString(),
                latestMemo: latestMemo
                    ? {
                          content: latestMemo.content,
                          authorName: latestMemo.author.name,
                          counseledAt: latestMemo.counseledAt.toISOString(),
                      }
                    : null,
            };
        });
}
