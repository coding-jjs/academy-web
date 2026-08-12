import "server-only";

import { prisma } from "@/lib/db";
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
                    take: 1,
                    select: {
                        class: {
                            select: {
                                name: true,
                                teacher: { select: { name: true } },
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
                        assignee: { select: { name: true } },
                        signals: {
                            orderBy: { detectedAt: "desc" },
                            take: 3,
                            select: { type: true, value: true },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        }),
        prisma.churnThresholdConfig.findUnique({ where: { id: 1 } }),
    ]);

    const cases = studentRecords.map((student) => {
        const enrollment = student.enrollments[0];
        const churnCase = student.churnCases[0] ?? null;

        return {
            id: student.id,
            churnCaseId: churnCase?.id ?? null,
            studentId: student.id,
            studentName: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: enrollment?.class.name ?? null,
            teacherName:
                churnCase?.assignee?.name ??
                enrollment?.class.teacher?.name ??
                null,
            reason: churnCase
                ? describeChurnSignals(churnCase.signals, churnCase.summary)
                : "이탈 신호 없음",
            status: churnCase?.status ?? null,
            detectedAt: churnCase?.detectedAt.toISOString() ?? null,
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
