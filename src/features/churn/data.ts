import "server-only";

import { prisma } from "@/lib/db";
import {
    buildStudentAssignees,
    suggestAssigneeUserId,
} from "@/features/churn/assignees";
import { CHURN_SIGNAL_LABELS } from "@/features/churn/presentation";
import type {
    ChurnSignalType,
    ChurnThreshold,
    DirectorChurnCase,
} from "@/features/churn/types";

function describeChurnSignals(
    signals: { type: ChurnSignalType; value: { toString(): string } | null }[],
    summary: string | null,
) {
    if (summary?.trim()) return summary;
    if (signals.length === 0) return "신호 없음";

    return signals
        .map((signal) => {
            const label = CHURN_SIGNAL_LABELS[signal.type];
            return signal.value == null ? label : `${label} (${signal.value})`;
        })
        .join(" · ");
}

export async function getDirectorChurnData(): Promise<{
    cases: DirectorChurnCase[];
    threshold: ChurnThreshold;
}> {
    const [studentRecords, thresholdRecord] = await Promise.all([
        prisma.student.findMany({
            where: { status: "ENROLLED" },
            select: {
                id: true,
                name: true,
                schoolName: true,
                grade: true,
                enrollments: {
                    where: { status: "ACTIVE", endedAt: null },
                    orderBy: { enrolledAt: "asc" },
                    select: {
                        class: {
                            select: {
                                name: true,
                                subject: true,
                                teacherUserId: true,
                                teacher: {
                                    select: {
                                        id: true,
                                        name: true,
                                        role: true,
                                        status: true,
                                    },
                                },
                            },
                        },
                    },
                },
                churnCases: {
                    orderBy: { detectedAt: "desc" },
                    take: 1,
                    select: {
                        id: true,
                        status: true,
                        summary: true,
                        detectedAt: true,
                        assignedUserId: true,
                        assignee: { select: { name: true } },
                        signals: {
                            orderBy: { detectedAt: "desc" },
                            take: 4,
                            select: { type: true, value: true, details: true },
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
                },
            },
            orderBy: { name: "asc" },
        }),
        prisma.churnThresholdConfig.findUnique({ where: { id: 1 } }),
    ]);

    const cases = studentRecords.map((student) => {
        const assignees = buildStudentAssignees(student.enrollments);
        const className =
            assignees.flatMap((item) => item.classNames).join(" · ") ||
            student.enrollments[0]?.class.name ||
            null;
        const churnCase = student.churnCases[0] ?? null;
        const latestMemo = churnCase?.counselingMemos[0] ?? null;
        const suggestedAssigneeUserId = suggestAssigneeUserId(
            assignees,
            churnCase?.assignedUserId ?? null,
            churnCase?.signals ?? [],
        );
        const suggested = assignees.find(
            (item) => item.id === suggestedAssigneeUserId,
        );

        return {
            id: student.id,
            churnCaseId: churnCase?.id ?? null,
            studentId: student.id,
            studentName: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className,
            teacherName:
                churnCase?.assignee?.name ?? suggested?.name ?? null,
            assigneeUserId: churnCase?.assignedUserId ?? null,
            suggestedAssigneeUserId,
            assignees,
            reason: churnCase
                ? describeChurnSignals(churnCase.signals, churnCase.summary)
                : "이탈 신호 없음",
            status: churnCase?.status ?? null,
            detectedAt: churnCase?.detectedAt.toISOString() ?? null,
            latestMemo: latestMemo
                ? {
                      content: latestMemo.content,
                      authorName: latestMemo.author.name,
                      counseledAt: latestMemo.counseledAt.toISOString(),
                  }
                : null,
        };
    });

    return {
        cases,
        threshold: {
            attendanceDropPercentPoint: Number(
                thresholdRecord?.attendanceDropPercentPoint ?? 15,
            ),
            scoreDropPoints: Number(thresholdRecord?.scoreDropPoints ?? 10),
            consecutiveAbsences: thresholdRecord?.consecutiveAbsences ?? 2,
            unpaidDays: thresholdRecord?.unpaidDays ?? 3,
        },
    };
}
