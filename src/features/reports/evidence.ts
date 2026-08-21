import "server-only";

/**
 * 리포트 기간 안의 출석·성적·학습기록·오답을 모아 프롬프트용 근거로 만든다.
 *
 * 호출: `staff-actions.regenerateDraftWithAi` → `draft-generator.createReportDraft`.
 * 런타임 import 경로는 이 파일(`@/features/reports/evidence`)뿐이다.
 * `evidence 2.ts`는 같은 코드의 미사용 중복이니 여기서 고치고, 저쪽은 건드리지 말 것.
 *
 * 의도적으로 하지 않는 일:
 * - 근거에 없는 점수·출결을 채우지 않는다. 없으면 "기록 없음" 문장만 남긴다.
 * - 학부모에게 바로 보내지 않는다 → 초안은 교사 검수·원장 승인 후 SENT.
 *
 * 관련: `draft-generator.ts`, `staff-actions.ts`.
 */

import { prisma } from "@/lib/db";
import { formatKstYearMonthDay } from "@/lib/date-kst";

/** 기간 조회 결과를 프롬프트·템플릿·UI 요약이 같이 쓰는 사실 묶음. */
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

/** YYYY-MM-DD를 그날 00:00 UTC로. Date 컬럼(성적·학습기록) 비교용. */
function toDateOnlyUtc(isoDate: string) {
    return new Date(`${isoDate}T00:00:00.000Z`);
}

/**
 * periodEnd 다음날 00:00 UTC.
 * 출결 session.startsAt·오답 createdAt처럼 timestamptz는 `lt` 배타 상한을 쓴다.
 */
function dayAfterUtc(isoDate: string) {
    const date = toDateOnlyUtc(isoDate);
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
}

/** Prisma Decimal·number·string을 JS number로. percent 계산 전에 통일한다. */
function asNumber(value: { toNumber?: () => number } | number | string) {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value);
    if (typeof value?.toNumber === "function") return value.toNumber();
    return Number(value);
}

/**
 * 학생·기간으로 성적·출결·학습기록·오답을 병렬 조회해 `ReportEvidence`로 만든다.
 * 성적/학습기록은 Date 포함(`lte`), 출결/오답은 timestamptz 배타(`lt` 다음날).
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

/**
 * Gemini 프롬프트에 붙일 사실 블록.
 * "아래 사실만 사용하세요" 머리말로, 근거 밖 창작을 막는다.
 */
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

/** 교사 화면에 보여줄 건수 한 줄. AI 본문이 아니라 근거 규모만 알린다. */
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

/** 네 축 중 하나라도 있으면 템플릿이 요약 문단을 붙인다. 전부 없으면 키워드 문장만. */
export function hasAnyEvidence(evidence: ReportEvidence) {
    return (
        evidence.grades.length > 0 ||
        evidence.attendance.total > 0 ||
        evidence.learningRecords.length > 0 ||
        evidence.wrongNotes.length > 0
    );
}
