import "server-only"; // 서버 전용. 클라이언트 번들에 안 넣는다.

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

import { prisma } from "@/lib/db"; // 의존성. 미사용 복제. 런타임은 evidence.ts.
import { formatKstYearMonthDay } from "@/lib/date-kst"; // 의존성. 미사용 복제. 런타임은 evidence.ts.

/** 미사용 복제. 타입은 `evidence.ts`의 `ReportEvidence`를 import할 것. */
export type ReportEvidence = { // 화면 DTO. 미사용 복제. 런타임은 evidence.ts.
    grades: Array<{ // grades. 미사용 복제. 런타임은 evidence.ts.
        title: string; // 미사용 복제 필드. 런타임 타입은 evidence.ts.
        subject: string; // subject. 미사용 복제. 런타임은 evidence.ts.
        score: number; // score. 미사용 복제. 런타임은 evidence.ts.
        maxScore: number; // maxScore. 미사용 복제. 런타임은 evidence.ts.
        percent: number; // percent. 미사용 복제. 런타임은 evidence.ts.
        assessedAt: string; // assessedAt. 미사용 복제. 런타임은 evidence.ts.
        className: string | null; // className. 미사용 복제. 런타임은 evidence.ts.
    }>; // 미사용 복제. 런타임은 evidence.ts.
    attendance: { // attendance. 미사용 복제. 런타임은 evidence.ts.
        total: number; // total. 미사용 복제. 런타임은 evidence.ts.
        present: number; // present. 미사용 복제. 런타임은 evidence.ts.
        late: number; // late. 미사용 복제. 런타임은 evidence.ts.
        absent: number; // absent. 미사용 복제. 런타임은 evidence.ts.
        excused: number; // excused. 미사용 복제. 런타임은 evidence.ts.
        earlyLeave: number; // earlyLeave. 미사용 복제. 런타임은 evidence.ts.
        rateLabel: string | null; // rateLabel. 미사용 복제. 런타임은 evidence.ts.
    };
    learningRecords: Array<{ // learningRecords. 미사용 복제. 런타임은 evidence.ts.
        typeLabel: string; // typeLabel. 미사용 복제. 런타임은 evidence.ts.
        title: string; // title. 미사용 복제. 런타임은 evidence.ts.
        content: string; // content. 미사용 복제. 런타임은 evidence.ts.
        recordDate: string; // recordDate. 미사용 복제. 런타임은 evidence.ts.
    }>; // 미사용 복제. 런타임은 evidence.ts.
    wrongNotes: Array<{ // wrongNotes. 미사용 복제. 런타임은 evidence.ts.
        subjectHint: string | null; // subjectHint. 미사용 복제. 런타임은 evidence.ts.
        questionNo: string | null; // questionNo. 미사용 복제. 런타임은 evidence.ts.
        questionText: string | null; // questionText. 미사용 복제. 런타임은 evidence.ts.
        statusLabel: string; // statusLabel. 미사용 복제. 런타임은 evidence.ts.
        explanation: string | null; // explanation. 미사용 복제. 런타임은 evidence.ts.
    }>; // 미사용 복제. 런타임은 evidence.ts.
};

const LEARNING_TYPE_LABEL: Record<string, string> = { // LEARNING_TYPE_LABEL: Record<string, string> 시작. 미사용 복제. 런타임은 evidence.ts.
    CLASS_NOTE: "수업 기록", // 미사용. 실제 라벨 맵은 evidence.ts.
    HOMEWORK: "숙제", // HOMEWORK. 미사용 복제. 런타임은 evidence.ts.
    LIFE_RECORD: "생활·태도", // LIFE_RECORD. 미사용 복제. 런타임은 evidence.ts.
};

const WRONG_NOTE_STATUS_LABEL: Record<string, string> = { // WRONG_NOTE_STATUS_LABEL: Record<string, string> 시작. 미사용 복제. 런타임은 evidence.ts.
    OPEN: "미해결", // 미사용. 실제 상태 라벨은 evidence.ts.
    REVIEWED: "검토됨", // REVIEWED. 미사용 복제. 런타임은 evidence.ts.
    MASTERED: "완벽 이해", // MASTERED. 미사용 복제. 런타임은 evidence.ts.
};

function toDateOnlyUtc(isoDate: string) { // toDateOnlyUtc. 미사용 복제. 런타임은 evidence.ts.
    return new Date(`${isoDate}T00:00:00.000Z`); // 미사용. 런타임은 evidence.ts. 여기서 고치지 말 것.
}

/** periodEnd(YYYY-MM-DD) 다음날 00:00 UTC — timestamptz 구간용 */
function dayAfterUtc(isoDate: string) { // dayAfterUtc. 미사용 복제. 런타임은 evidence.ts.
    const date = toDateOnlyUtc(isoDate); // 미사용. periodEnd 다음날 00:00. 실제 구현은 evidence.ts.
    date.setUTCDate(date.getUTCDate() + 1); // dayAfterUtc 끝.
    return date; // 반환. 미사용 복제. 런타임은 evidence.ts.
}

function asNumber(value: { toNumber?: () => number } | number | string) { // asNumber. 미사용 복제. 런타임은 evidence.ts.
    if (typeof value === "number") return value; // 미사용 Decimal 변환. 실제 구현은 evidence.ts.
    if (typeof value === "string") return Number(value); // 가드. 미사용 복제. 런타임은 evidence.ts.
    if (typeof value?.toNumber === "function") return value.toNumber(); // 가드. 미사용 복제. 런타임은 evidence.ts.
    return Number(value); // 반환. 미사용 복제. 런타임은 evidence.ts.
}

/**
 * 미사용 복제. 호출하지 말 것.
 * 실제 조회는 `evidence.ts`의 `getReportEvidence`.
 */
export async function getReportEvidence(input: { // getReportEvidence. 미사용 복제. 런타임은 evidence.ts.
    studentId: string; // studentId. 미사용 복제. 런타임은 evidence.ts.
    periodStart: string; // periodStart. 미사용 복제. 런타임은 evidence.ts.
    periodEnd: string; // periodEnd. 미사용 복제. 런타임은 evidence.ts.
}): Promise<ReportEvidence> { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
    const periodStart = toDateOnlyUtc(input.periodStart); // 미사용. 본문은 evidence.ts와 같다. 런타임 import는 @/features/reports/evidence만.
    const periodEnd = toDateOnlyUtc(input.periodEnd); // periodEnd. 미사용 복제. 런타임은 evidence.ts.
    const periodEndExclusive = dayAfterUtc(input.periodEnd); // periodEndExclusive. 미사용 복제. 런타임은 evidence.ts.

    const [grades, attendanceRows, learningRecords, wrongNotes] = // [grades, attendanceRows, learningRecords, wrongNotes]. 미사용 복제. 런타임은 evidence.ts.
        await Promise.all([ // 미사용. 삭제하지 않는다. 새 코드에서 이 파일을 쓰지 말 것.
            prisma.gradeRecord.findMany({ // 미사용 성적 조회. 고치려면 evidence.ts.
                where: { // 필터. 미사용 복제. 런타임은 evidence.ts.
                    studentId: input.studentId, // studentId. 미사용 복제. 런타임은 evidence.ts.
                    assessedAt: { gte: periodStart, lte: periodEnd }, // assessedAt. 미사용 복제. 런타임은 evidence.ts.
                },
                orderBy: { assessedAt: "desc" }, // orderBy 필드. 미사용 복제. 런타임은 evidence.ts.
                take: 12, // 조회 상한.
                select: { // select 필드. 미사용 복제. 런타임은 evidence.ts.
                    title: true, // title 선택.
                    subject: true, // subject 선택.
                    score: true, // score 선택.
                    maxScore: true, // maxScore 선택.
                    assessedAt: true, // assessedAt 선택.
                    class: { select: { name: true } }, // class. 미사용 복제. 런타임은 evidence.ts.
                },
            }),
            prisma.attendanceRecord.findMany({ // 미사용 출결 조회. CANCELLED 제외는 evidence.ts와 같다.
                where: { // 필터. 미사용 복제. 런타임은 evidence.ts.
                    studentId: input.studentId, // studentId. 미사용 복제. 런타임은 evidence.ts.
                    session: { // session. 미사용 복제. 런타임은 evidence.ts.
                        startsAt: { // startsAt. 미사용 복제. 런타임은 evidence.ts.
                            gte: periodStart, // gte. 미사용 복제. 런타임은 evidence.ts.
                            lt: periodEndExclusive, // lt. 미사용 복제. 런타임은 evidence.ts.
                        },
                        status: { in: ["SCHEDULED", "COMPLETED"] }, // status. 미사용 복제. 런타임은 evidence.ts.
                    },
                },
                select: { status: true }, // select 필드. 미사용 복제. 런타임은 evidence.ts.
            }),
            prisma.learningRecord.findMany({ // 미사용 학습기록 조회.
                where: { // 필터. 미사용 복제. 런타임은 evidence.ts.
                    studentId: input.studentId, // studentId. 미사용 복제. 런타임은 evidence.ts.
                    recordDate: { gte: periodStart, lte: periodEnd }, // recordDate. 미사용 복제. 런타임은 evidence.ts.
                },
                orderBy: { recordDate: "desc" }, // orderBy 필드. 미사용 복제. 런타임은 evidence.ts.
                take: 8, // 조회 상한.
                select: { // select 필드. 미사용 복제. 런타임은 evidence.ts.
                    type: true, // type 선택.
                    title: true, // title 선택.
                    content: true, // content 선택.
                    recordDate: true, // recordDate 선택.
                },
            }),
            prisma.wrongNote.findMany({ // 미사용 오답 조회.
                where: { // 필터. 미사용 복제. 런타임은 evidence.ts.
                    studentId: input.studentId, // studentId. 미사용 복제. 런타임은 evidence.ts.
                    createdAt: { // createdAt. 미사용 복제. 런타임은 evidence.ts.
                        gte: periodStart, // gte. 미사용 복제. 런타임은 evidence.ts.
                        lt: periodEndExclusive, // lt. 미사용 복제. 런타임은 evidence.ts.
                    },
                },
                orderBy: { createdAt: "desc" }, // orderBy 필드. 미사용 복제. 런타임은 evidence.ts.
                take: 8, // 조회 상한.
                select: { // select 필드. 미사용 복제. 런타임은 evidence.ts.
                    questionNo: true, // questionNo 선택.
                    questionText: true, // questionText 선택.
                    explanation: true, // explanation 선택.
                    status: true, // status 선택.
                    class: { select: { subject: true, name: true } }, // class. 미사용 복제. 런타임은 evidence.ts.
                    gradeRecord: { select: { subject: true, title: true } }, // gradeRecord. 미사용 복제. 런타임은 evidence.ts.
                },
            }),
        ]);

    const counts = { // counts 시작. 미사용 복제. 런타임은 evidence.ts.
        present: 0, // 미사용 출결 집계. 실제 구현은 evidence.ts.
        late: 0, // late. 미사용 복제. 런타임은 evidence.ts.
        absent: 0, // absent. 미사용 복제. 런타임은 evidence.ts.
        excused: 0, // excused. 미사용 복제. 런타임은 evidence.ts.
        earlyLeave: 0, // earlyLeave. 미사용 복제. 런타임은 evidence.ts.
    };
    for (const row of attendanceRows) { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
        if (row.status === "PRESENT") counts.present += 1; // 가드. 미사용 복제. 런타임은 evidence.ts.
        else if (row.status === "LATE") counts.late += 1; // 분기. 미사용 복제. 런타임은 evidence.ts.
        else if (row.status === "ABSENT") counts.absent += 1; // 분기. 미사용 복제. 런타임은 evidence.ts.
        else if (row.status === "EXCUSED") counts.excused += 1; // 분기. 미사용 복제. 런타임은 evidence.ts.
        else if (row.status === "EARLY_LEAVE") counts.earlyLeave += 1; // 분기. 미사용 복제. 런타임은 evidence.ts.
    }
    const total = attendanceRows.length; // total. 미사용 복제. 런타임은 evidence.ts.
    const attended = counts.present + counts.late + counts.earlyLeave; // 미사용 출석률. 실제 구현은 evidence.ts.
    const rateLabel = // rateLabel. 미사용 복제. 런타임은 evidence.ts.
        total > 0 ? `${Math.round((attended / total) * 100)}%` : null; // 미사용 복제. 런타임은 evidence.ts.

    return { // 미사용 매핑. 근거 조회를 고치려면 evidence.ts를 수정한다.
        grades: grades.map((grade) => { // grades. 미사용 복제. 런타임은 evidence.ts.
            const score = asNumber(grade.score); // score. 미사용 복제. 런타임은 evidence.ts.
            const maxScore = asNumber(grade.maxScore); // maxScore. 미사용 복제. 런타임은 evidence.ts.
            const percent = // percent. 미사용 복제. 런타임은 evidence.ts.
                maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0; // 미사용 복제. 런타임은 evidence.ts.
            return { // 반환. 미사용 복제. 런타임은 evidence.ts.
                title: grade.title, // title. 미사용 복제. 런타임은 evidence.ts.
                subject: grade.subject, // subject. 미사용 복제. 런타임은 evidence.ts.
                score, // 미사용 복제. 런타임은 evidence.ts.
                maxScore, // 미사용 복제. 런타임은 evidence.ts.
                percent, // 미사용 복제. 런타임은 evidence.ts.
                assessedAt: formatKstYearMonthDay(grade.assessedAt), // assessedAt. 미사용 복제. 런타임은 evidence.ts.
                className: grade.class?.name ?? null, // className. 미사용 복제. 런타임은 evidence.ts.
            };
        }),
        attendance: { // attendance. 미사용 복제. 런타임은 evidence.ts.
            total, // 미사용 복제. 런타임은 evidence.ts.
            ...counts, // 전개. 미사용 복제. 런타임은 evidence.ts.
            rateLabel, // 미사용 복제. 런타임은 evidence.ts.
        },
        learningRecords: learningRecords.map((record) => ({ // learningRecords. 미사용 복제. 런타임은 evidence.ts.
            typeLabel: LEARNING_TYPE_LABEL[record.type] ?? record.type, // typeLabel. 미사용 복제. 런타임은 evidence.ts.
            title: record.title, // title. 미사용 복제. 런타임은 evidence.ts.
            content: record.content.slice(0, 160), // content. 미사용 복제. 런타임은 evidence.ts.
            recordDate: formatKstYearMonthDay(record.recordDate), // recordDate. 미사용 복제. 런타임은 evidence.ts.
        })),
        wrongNotes: wrongNotes.map((note) => ({ // wrongNotes. 미사용 복제. 런타임은 evidence.ts.
            subjectHint: // subjectHint. 미사용 복제. 런타임은 evidence.ts.
                note.gradeRecord?.subject ?? // 미사용 복제. 런타임은 evidence.ts.
                note.class?.subject ?? // 미사용 복제. 런타임은 evidence.ts.
                note.class?.name ?? // 미사용 복제. 런타임은 evidence.ts.
                null, // 미사용 복제. 런타임은 evidence.ts.
            questionNo: note.questionNo, // questionNo. 미사용 복제. 런타임은 evidence.ts.
            questionText: note.questionText // questionText. 미사용 복제. 런타임은 evidence.ts.
                ? note.questionText.slice(0, 120) // 삼항. 미사용 복제. 런타임은 evidence.ts.
                : null, // 삼항 나머지. 미사용 복제. 런타임은 evidence.ts.
            statusLabel: WRONG_NOTE_STATUS_LABEL[note.status] ?? note.status, // statusLabel. 미사용 복제. 런타임은 evidence.ts.
            explanation: note.explanation // explanation. 미사용 복제. 런타임은 evidence.ts.
                ? note.explanation.slice(0, 120) // 삼항. 미사용 복제. 런타임은 evidence.ts.
                : null, // 삼항 나머지. 미사용 복제. 런타임은 evidence.ts.
        })),
    };
}

/** 미사용 복제. 실제 직렬화는 `evidence.ts`의 `formatEvidenceForPrompt`. */
export function formatEvidenceForPrompt(evidence: ReportEvidence) { // formatEvidenceForPrompt. 미사용 복제. 런타임은 evidence.ts.
    const lines: string[] = ["[기간 내 학습 근거 — 아래 사실만 사용하세요]"]; // 미사용. 실제 직렬화는 evidence.ts.

    if (evidence.grades.length === 0) { // 가드. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 성적: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 성적:"); // 블록 끝.
        for (const grade of evidence.grades) { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
            lines.push( // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
                `  · ${grade.assessedAt} ${grade.subject}「${grade.title}」 ${grade.score}/${grade.maxScore}(${grade.percent}%)` + // 미사용 복제. 런타임은 evidence.ts.
                    (grade.className ? ` · ${grade.className}` : ""), // 미사용 복제. 런타임은 evidence.ts.
            );
        }
    }

    if (evidence.attendance.total === 0) { // 가드. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 출결: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
        const a = evidence.attendance; // a. 미사용 복제. 런타임은 evidence.ts.
        lines.push( // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
            `- 출결: 총 ${a.total}회 · 출석 ${a.present} · 지각 ${a.late} · 결석 ${a.absent} · 공결 ${a.excused} · 조퇴 ${a.earlyLeave}` + // 미사용 복제. 런타임은 evidence.ts.
                (a.rateLabel ? ` · 출석률(지각·조퇴 포함) ${a.rateLabel}` : ""), // 미사용 복제. 런타임은 evidence.ts.
        );
    }

    if (evidence.learningRecords.length === 0) { // 가드. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 학습 기록: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 학습 기록:"); // 블록 끝.
        for (const record of evidence.learningRecords) { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
            lines.push( // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
                `  · ${record.recordDate} [${record.typeLabel}] ${record.title} — ${record.content}`, // 미사용 복제. 런타임은 evidence.ts.
            );
        }
    }

    if (evidence.wrongNotes.length === 0) { // 가드. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 오답: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
        lines.push("- 오답:"); // 블록 끝.
        for (const note of evidence.wrongNotes) { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
            const q = note.questionNo ? `#${note.questionNo} ` : ""; // q. 미사용 복제. 런타임은 evidence.ts.
            const text = note.questionText ?? "(문항 요약 없음)"; // text. 미사용 복제. 런타임은 evidence.ts.
            lines.push( // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
                `  · [${note.statusLabel}] ${note.subjectHint ?? "과목미상"} ${q}${text}` + // 미사용 복제. 런타임은 evidence.ts.
                    (note.explanation ? ` / 지도: ${note.explanation}` : ""), // 미사용 복제. 런타임은 evidence.ts.
            );
        }
    }

    return lines.join("\n"); // 반환. 미사용 복제. 런타임은 evidence.ts.
}

/** 미사용 복제. 실제 요약은 `evidence.ts`의 `formatEvidenceSummary`. */
export function formatEvidenceSummary(evidence: ReportEvidence) { // formatEvidenceSummary. 미사용 복제. 런타임은 evidence.ts.
    const parts: string[] = []; // 미사용. 실제 요약은 evidence.ts.
    parts.push(`성적 ${evidence.grades.length}건`); // formatEvidenceSummary 끝.
    if (evidence.attendance.total > 0) { // 가드. 미사용 복제. 런타임은 evidence.ts.
        parts.push( // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
            `출결 ${evidence.attendance.total}회` + // 미사용 복제. 런타임은 evidence.ts.
                (evidence.attendance.rateLabel // 미사용 복제. 런타임은 evidence.ts.
                    ? `(${evidence.attendance.rateLabel})` // 삼항. 미사용 복제. 런타임은 evidence.ts.
                    : ""), // 삼항 나머지. 미사용 복제. 런타임은 evidence.ts.
        );
    } else { // 블록 시작. 미사용 복제. 런타임은 evidence.ts.
        parts.push("출결 없음"); // 블록 끝.
    }
    parts.push(`학습기록 ${evidence.learningRecords.length}건`); // 블록 끝.
    parts.push(`오답 ${evidence.wrongNotes.length}건`); // 블록 끝.
    return parts.join(" · "); // 반환. 미사용 복제. 런타임은 evidence.ts.
}

/** 미사용 복제. 실제 판정은 `evidence.ts`의 `hasAnyEvidence`. */
export function hasAnyEvidence(evidence: ReportEvidence) { // hasAnyEvidence. 미사용 복제. 런타임은 evidence.ts.
    return ( // 반환. 미사용 복제. 런타임은 evidence.ts.
        evidence.grades.length > 0 || // 미사용. 실제 판정은 evidence.ts.
        evidence.attendance.total > 0 || // 미사용 복제. 런타임은 evidence.ts.
        evidence.learningRecords.length > 0 || // 미사용 복제. 런타임은 evidence.ts.
        evidence.wrongNotes.length > 0 // 미사용 복제. 런타임은 evidence.ts.
    );
}
