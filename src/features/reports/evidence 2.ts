import "server-only";

/**
 * `evidence.ts`와 본문이 같은 미사용 중복 파일이다.
 *
 * 런타임 import는 `@/features/reports/evidence`만 쓴다
 * (`draft-generator.ts`, `staff-actions.ts`). 이 파일은 어디에서도 import하지 않는다.
 * 파일 이름에 공백과 `2`가 있어 실수로 경로를 맞추기 쉽다 — 새 코드에서 쓰지 말 것.
 *
 * 의도적으로 하지 않는 일:
 * - 삭제·이름 변경·내용 동기화를 하지 않는다. 주석만으로 미사용임을 표시한다.
 * - 근거 조회를 여기서 고치지 않는다 → 반드시 `evidence.ts`를 수정한다.
 *
 * 관련: `evidence.ts` (실제 구현).
 */

import { prisma } from "@/lib/db";
import { formatKstYearMonthDay } from "@/lib/date-kst";

/** 미사용 복제. 타입은 `evidence.ts`의 `ReportEvidence`를 import할 것. */
export type ReportEvidence = {
    grades: Array<{
        title: string;
        subject: string;
        score: number;
        maxScore: number;
        percent: number;
        assessedAt: string;
        className: string | null;
    }>;
    attendance: {
        total: number;
        present: number;
        late: number;
        absent: number;
        excused: number;
        earlyLeave: number;
        rateLabel: string | null;
    };
    learningRecords: Array<{
        typeLabel: string;
        title: string;
        content: string;
        recordDate: string;
    }>;
    wrongNotes: Array<{
        subjectHint: string | null;
        questionNo: string | null;
        questionText: string | null;
        statusLabel: string;
        explanation: string | null;
    }>;
};

const LEARNING_TYPE_LABEL: Record<string, string> = {
    CLASS_NOTE: "수업 기록",
    HOMEWORK: "숙제",
    LIFE_RECORD: "생활·태도",
};

const WRONG_NOTE_STATUS_LABEL: Record<string, string> = {
    OPEN: "미해결",
    REVIEWED: "검토됨",
    MASTERED: "완벽 이해",
};

function toDateOnlyUtc(isoDate: string) {
    return new Date(`${isoDate}T00:00:00.000Z`);
}

/** periodEnd(YYYY-MM-DD) 다음날 00:00 UTC — timestamptz 구간용 */
function dayAfterUtc(isoDate: string) {
    const date = toDateOnlyUtc(isoDate);
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
}

function asNumber(value: { toNumber?: () => number } | number | string) {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value);
    if (typeof value?.toNumber === "function") return value.toNumber();
    return Number(value);
}

/**
 * 미사용 복제. 호출하지 말 것.
 * 실제 조회는 `evidence.ts`의 `getReportEvidence`.
 */
export async function getReportEvidence(input: {
    studentId: string;
    periodStart: string;
    periodEnd: string;
}): Promise<ReportEvidence> {
    const periodStart = toDateOnlyUtc(input.periodStart);
    const periodEnd = toDateOnlyUtc(input.periodEnd);
    const periodEndExclusive = dayAfterUtc(input.periodEnd);

    const [grades, attendanceRows, learningRecords, wrongNotes] =
        await Promise.all([
            prisma.gradeRecord.findMany({
                where: {
                    studentId: input.studentId,
                    assessedAt: { gte: periodStart, lte: periodEnd },
                },
                orderBy: { assessedAt: "desc" },
                take: 12,
                select: {
                    title: true,
                    subject: true,
                    score: true,
                    maxScore: true,
                    assessedAt: true,
                    class: { select: { name: true } },
                },
            }),
            prisma.attendanceRecord.findMany({
                where: {
                    studentId: input.studentId,
                    session: {
                        startsAt: {
                            gte: periodStart,
                            lt: periodEndExclusive,
                        },
                        status: { in: ["SCHEDULED", "COMPLETED"] },
                    },
                },
                select: { status: true },
            }),
            prisma.learningRecord.findMany({
                where: {
                    studentId: input.studentId,
                    recordDate: { gte: periodStart, lte: periodEnd },
                },
                orderBy: { recordDate: "desc" },
                take: 8,
                select: {
                    type: true,
                    title: true,
                    content: true,
                    recordDate: true,
                },
            }),
            prisma.wrongNote.findMany({
                where: {
                    studentId: input.studentId,
                    createdAt: {
                        gte: periodStart,
                        lt: periodEndExclusive,
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 8,
                select: {
                    questionNo: true,
                    questionText: true,
                    explanation: true,
                    status: true,
                    class: { select: { subject: true, name: true } },
                    gradeRecord: { select: { subject: true, title: true } },
                },
            }),
        ]);

    const counts = {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        earlyLeave: 0,
    };
    for (const row of attendanceRows) {
        if (row.status === "PRESENT") counts.present += 1;
        else if (row.status === "LATE") counts.late += 1;
        else if (row.status === "ABSENT") counts.absent += 1;
        else if (row.status === "EXCUSED") counts.excused += 1;
        else if (row.status === "EARLY_LEAVE") counts.earlyLeave += 1;
    }
    const total = attendanceRows.length;
    const attended = counts.present + counts.late + counts.earlyLeave;
    const rateLabel =
        total > 0 ? `${Math.round((attended / total) * 100)}%` : null;

    return {
        grades: grades.map((grade) => {
            const score = asNumber(grade.score);
            const maxScore = asNumber(grade.maxScore);
            const percent =
                maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
            return {
                title: grade.title,
                subject: grade.subject,
                score,
                maxScore,
                percent,
                assessedAt: formatKstYearMonthDay(grade.assessedAt),
                className: grade.class?.name ?? null,
            };
        }),
        attendance: {
            total,
            ...counts,
            rateLabel,
        },
        learningRecords: learningRecords.map((record) => ({
            typeLabel: LEARNING_TYPE_LABEL[record.type] ?? record.type,
            title: record.title,
            content: record.content.slice(0, 160),
            recordDate: formatKstYearMonthDay(record.recordDate),
        })),
        wrongNotes: wrongNotes.map((note) => ({
            subjectHint:
                note.gradeRecord?.subject ??
                note.class?.subject ??
                note.class?.name ??
                null,
            questionNo: note.questionNo,
            questionText: note.questionText
                ? note.questionText.slice(0, 120)
                : null,
            statusLabel: WRONG_NOTE_STATUS_LABEL[note.status] ?? note.status,
            explanation: note.explanation
                ? note.explanation.slice(0, 120)
                : null,
        })),
    };
}

/** 미사용 복제. 실제 직렬화는 `evidence.ts`의 `formatEvidenceForPrompt`. */
export function formatEvidenceForPrompt(evidence: ReportEvidence) {
    const lines: string[] = ["[기간 내 학습 근거 — 아래 사실만 사용하세요]"];

    if (evidence.grades.length === 0) {
        lines.push("- 성적: 기간 내 기록 없음");
    } else {
        lines.push("- 성적:");
        for (const grade of evidence.grades) {
            lines.push(
                `  · ${grade.assessedAt} ${grade.subject}「${grade.title}」 ${grade.score}/${grade.maxScore}(${grade.percent}%)` +
                    (grade.className ? ` · ${grade.className}` : ""),
            );
        }
    }

    if (evidence.attendance.total === 0) {
        lines.push("- 출결: 기간 내 기록 없음");
    } else {
        const a = evidence.attendance;
        lines.push(
            `- 출결: 총 ${a.total}회 · 출석 ${a.present} · 지각 ${a.late} · 결석 ${a.absent} · 공결 ${a.excused} · 조퇴 ${a.earlyLeave}` +
                (a.rateLabel ? ` · 출석률(지각·조퇴 포함) ${a.rateLabel}` : ""),
        );
    }

    if (evidence.learningRecords.length === 0) {
        lines.push("- 학습 기록: 기간 내 기록 없음");
    } else {
        lines.push("- 학습 기록:");
        for (const record of evidence.learningRecords) {
            lines.push(
                `  · ${record.recordDate} [${record.typeLabel}] ${record.title} — ${record.content}`,
            );
        }
    }

    if (evidence.wrongNotes.length === 0) {
        lines.push("- 오답: 기간 내 기록 없음");
    } else {
        lines.push("- 오답:");
        for (const note of evidence.wrongNotes) {
            const q = note.questionNo ? `#${note.questionNo} ` : "";
            const text = note.questionText ?? "(문항 요약 없음)";
            lines.push(
                `  · [${note.statusLabel}] ${note.subjectHint ?? "과목미상"} ${q}${text}` +
                    (note.explanation ? ` / 지도: ${note.explanation}` : ""),
            );
        }
    }

    return lines.join("\n");
}

/** 미사용 복제. 실제 요약은 `evidence.ts`의 `formatEvidenceSummary`. */
export function formatEvidenceSummary(evidence: ReportEvidence) {
    const parts: string[] = [];
    parts.push(`성적 ${evidence.grades.length}건`);
    if (evidence.attendance.total > 0) {
        parts.push(
            `출결 ${evidence.attendance.total}회` +
                (evidence.attendance.rateLabel
                    ? `(${evidence.attendance.rateLabel})`
                    : ""),
        );
    } else {
        parts.push("출결 없음");
    }
    parts.push(`학습기록 ${evidence.learningRecords.length}건`);
    parts.push(`오답 ${evidence.wrongNotes.length}건`);
    return parts.join(" · ");
}

/** 미사용 복제. 실제 판정은 `evidence.ts`의 `hasAnyEvidence`. */
export function hasAnyEvidence(evidence: ReportEvidence) {
    return (
        evidence.grades.length > 0 ||
        evidence.attendance.total > 0 ||
        evidence.learningRecords.length > 0 ||
        evidence.wrongNotes.length > 0
    );
}
