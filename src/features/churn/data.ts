import "server-only";

/**
 * 재원 학생별 최신 이탈 케이스와 임계값 설정을 원장 화면에 넘긴다.
 *
 * 호출: `(director)/director/churn/page.tsx`.
 * `status: ENROLLED`만 스캔한다. 케이스 없는 학생도 목록에 남겨 신호 없음까지 한 화면에서 본다.
 * 담당자 후보·추천은 `assignees.ts`가 반 수강에서 만든다.
 *
 * 의도적으로 하지 않는 일:
 * - 신호 4종 계산 → `runChurnDetection` → `@/lib/churn-detect`.
 * - 배정·검토 확정 → `actions.ts`.
 *
 * 관련: `types.ts`, `presentation.ts`, `assignees.ts`.
 */

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

/** summary가 있으면 그걸, 없으면 최근 신호 라벨·값으로 이어 붙인다. */
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

/** ENROLLED 전원 행 + id=1 임계. 케이스 없어도 신호 없음 행을 남긴다. */
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
