import "server-only"; // 서버 전용. 클라이언트 번들에 안 넣는다.

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

import { prisma } from "@/lib/db"; // 의존성. 런타임 근거. evidence 2.ts가 아님.
import { formatKstYearMonthDay } from "@/lib/date-kst"; // 의존성. 런타임 근거. evidence 2.ts가 아님.

/** 기간 조회 결과를 프롬프트·템플릿·UI 요약이 같이 쓰는 사실 묶음. */
export type ReportEvidence = { // 화면 DTO. 런타임 근거. evidence 2.ts가 아님.
    grades: Array<{ // grades. 런타임 근거. evidence 2.ts가 아님.
        title: string; // 평가명.
        subject: string; // subject. 런타임 근거. evidence 2.ts가 아님.
        score: number; // Decimal을 number로 통일한 값.
        maxScore: number; // maxScore. 런타임 근거. evidence 2.ts가 아님.
        percent: number; // 소수 1자리 %. maxScore=0이면 0.
        assessedAt: string; // KST YYYY-MM-DD.
        className: string | null; // className. 런타임 근거. evidence 2.ts가 아님.
    }>; // 런타임 근거. evidence 2.ts가 아님.
    attendance: { // attendance. 런타임 근거. evidence 2.ts가 아님.
        total: number; // CANCELLED 세션은 분모에서 뺀다.
        present: number; // present. 런타임 근거. evidence 2.ts가 아님.
        late: number; // late. 런타임 근거. evidence 2.ts가 아님.
        absent: number; // absent. 런타임 근거. evidence 2.ts가 아님.
        excused: number; // excused. 런타임 근거. evidence 2.ts가 아님.
        earlyLeave: number; // earlyLeave. 런타임 근거. evidence 2.ts가 아님.
        rateLabel: string | null; // 출석·지각·조퇴를 출석으로. 0건이면 null.
    };
    learningRecords: Array<{ // learningRecords. 런타임 근거. evidence 2.ts가 아님.
        typeLabel: string; // typeLabel. 런타임 근거. evidence 2.ts가 아님.
        title: string; // title. 런타임 근거. evidence 2.ts가 아님.
        content: string; // 160자로 자른 본문.
        recordDate: string; // recordDate. 런타임 근거. evidence 2.ts가 아님.
    }>; // 런타임 근거. evidence 2.ts가 아님.
    wrongNotes: Array<{ // wrongNotes. 런타임 근거. evidence 2.ts가 아님.
        subjectHint: string | null; // subjectHint. 런타임 근거. evidence 2.ts가 아님.
        questionNo: string | null; // questionNo. 런타임 근거. evidence 2.ts가 아님.
        questionText: string | null; // 120자.
        statusLabel: string; // statusLabel. 런타임 근거. evidence 2.ts가 아님.
        explanation: string | null; // explanation. 런타임 근거. evidence 2.ts가 아님.
    }>; // 런타임 근거. evidence 2.ts가 아님.
};

const LEARNING_TYPE_LABEL: Record<string, string> = { // LEARNING_TYPE_LABEL: Record<string, string> 시작. 런타임 근거. evidence 2.ts가 아님.
    CLASS_NOTE: "수업 기록", // CLASS_NOTE. 런타임 근거. evidence 2.ts가 아님.
    HOMEWORK: "숙제", // HOMEWORK. 런타임 근거. evidence 2.ts가 아님.
    LIFE_RECORD: "생활·태도", // LIFE_RECORD. 런타임 근거. evidence 2.ts가 아님.
};

const WRONG_NOTE_STATUS_LABEL: Record<string, string> = { // WRONG_NOTE_STATUS_LABEL: Record<string, string> 시작. 런타임 근거. evidence 2.ts가 아님.
    OPEN: "미해결", // OPEN. 런타임 근거. evidence 2.ts가 아님.
    REVIEWED: "검토됨", // REVIEWED. 런타임 근거. evidence 2.ts가 아님.
    MASTERED: "완벽 이해", // MASTERED. 런타임 근거. evidence 2.ts가 아님.
};

/** YYYY-MM-DD를 그날 00:00 UTC로. Date 컬럼(성적·학습기록) 비교용. */
function toDateOnlyUtc(isoDate: string) { // toDateOnlyUtc. 런타임 근거. evidence 2.ts가 아님.
    return new Date(`${isoDate}T00:00:00.000Z`); // 시각을 붙이지 않으면 로컬 TZ로 파싱되어 하루가 밀릴 수 있다.
}

/**
 * periodEnd 다음날 00:00 UTC.
 * 출결 session.startsAt·오답 createdAt처럼 timestamptz는 `lt` 배타 상한을 쓴다.
 */
function dayAfterUtc(isoDate: string) { // dayAfterUtc. 런타임 근거. evidence 2.ts가 아님.
    const date = toDateOnlyUtc(isoDate); // periodEnd 포함을 피하려고 다음날 00:00을 배타 경계로 쓴다.
    date.setUTCDate(date.getUTCDate() + 1); // dayAfterUtc 끝.
    return date; // lt 비교용. Date 컬럼(성적)은 lte periodEnd를 쓴다.
}

/** Prisma Decimal·number·string을 JS number로. percent 계산 전에 통일한다. */
function asNumber(value: { toNumber?: () => number } | number | string) { // asNumber. 런타임 근거. evidence 2.ts가 아님.
    if (typeof value === "number") return value; // 이미 JS number.
    if (typeof value === "string") return Number(value); // 가드. 런타임 근거. evidence 2.ts가 아님.
    if (typeof value?.toNumber === "function") return value.toNumber(); // Prisma Decimal.
    return Number(value); // percent 계산 전에 통일한다.
}

/**
 * 학생·기간으로 성적·출결·학습기록·오답을 병렬 조회해 `ReportEvidence`로 만든다.
 * 성적/학습기록은 Date 포함(`lte`), 출결/오답은 timestamptz 배타(`lt` 다음날).
 */
export async function getReportEvidence(input: { // getReportEvidence. 런타임 근거. evidence 2.ts가 아님.
    studentId: string; // studentId. 런타임 근거. evidence 2.ts가 아님.
    periodStart: string; // periodStart. 런타임 근거. evidence 2.ts가 아님.
    periodEnd: string; // periodEnd. 런타임 근거. evidence 2.ts가 아님.
}): Promise<ReportEvidence> { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
    const periodStart = toDateOnlyUtc(input.periodStart); // Date 컬럼은 당일 00:00 포함(lte).
    const periodEnd = toDateOnlyUtc(input.periodEnd); // periodEnd. 런타임 근거. evidence 2.ts가 아님.
    const periodEndExclusive = dayAfterUtc(input.periodEnd); // timestamptz는 다음날 00:00 미만(lt).

    const [grades, attendanceRows, learningRecords, wrongNotes] = // [grades, attendanceRows, learningRecords, wrongNotes]. 런타임 근거. evidence 2.ts가 아님.
        await Promise.all([ // 런타임 근거는 이 파일뿐이다. `evidence 2.ts`는 미사용 중복이라 여기서 고친다.
            prisma.gradeRecord.findMany({ // 최근 12건만. 프롬프트 길이를 막고 최신 평가를 우선한다.
                where: { // 필터. 런타임 근거. evidence 2.ts가 아님.
                    studentId: input.studentId, // studentId. 런타임 근거. evidence 2.ts가 아님.
                    assessedAt: { gte: periodStart, lte: periodEnd }, // Date 컬럼. 당일 포함.
                },
                orderBy: { assessedAt: "desc" }, // orderBy 필드. 런타임 근거. evidence 2.ts가 아님.
                take: 12, // 조회 상한.
                select: { // select 필드. 런타임 근거. evidence 2.ts가 아님.
                    title: true, // title 선택.
                    subject: true, // subject 선택.
                    score: true, // score 선택.
                    maxScore: true, // maxScore 선택.
                    assessedAt: true, // assessedAt 선택.
                    class: { select: { name: true } }, // class. 런타임 근거. evidence 2.ts가 아님.
                },
            }),
            prisma.attendanceRecord.findMany({ // CANCELLED 세션은 분모에서 뺀다. 기간 끝은 다음날 00:00 미만.
                where: { // 필터. 런타임 근거. evidence 2.ts가 아님.
                    studentId: input.studentId, // studentId. 런타임 근거. evidence 2.ts가 아님.
                    session: { // session. 런타임 근거. evidence 2.ts가 아님.
                        startsAt: { // startsAt. 런타임 근거. evidence 2.ts가 아님.
                            gte: periodStart, // gte. 런타임 근거. evidence 2.ts가 아님.
                            lt: periodEndExclusive, // timestamptz 배타 상한.
                        },
                        status: { in: ["SCHEDULED", "COMPLETED"] }, // 취소 회차는 출석률에 넣지 않는다.
                    },
                },
                select: { status: true }, // select 필드. 런타임 근거. evidence 2.ts가 아님.
            }),
            prisma.learningRecord.findMany({ // 최근 8건. 본문은 아래에서 160자로 잘라 장문 프롬프트를 막는다.
                where: { // 필터. 런타임 근거. evidence 2.ts가 아님.
                    studentId: input.studentId, // studentId. 런타임 근거. evidence 2.ts가 아님.
                    recordDate: { gte: periodStart, lte: periodEnd }, // recordDate. 런타임 근거. evidence 2.ts가 아님.
                },
                orderBy: { recordDate: "desc" }, // orderBy 필드. 런타임 근거. evidence 2.ts가 아님.
                take: 8, // 조회 상한.
                select: { // select 필드. 런타임 근거. evidence 2.ts가 아님.
                    type: true, // type 선택.
                    title: true, // title 선택.
                    content: true, // content 선택.
                    recordDate: true, // recordDate 선택.
                },
            }),
            prisma.wrongNote.findMany({ // timestamptz createdAt은 다음날 00:00 미만. 문항 본문은 120자로 자른다.
                where: { // 필터. 런타임 근거. evidence 2.ts가 아님.
                    studentId: input.studentId, // studentId. 런타임 근거. evidence 2.ts가 아님.
                    createdAt: { // createdAt. 런타임 근거. evidence 2.ts가 아님.
                        gte: periodStart, // gte. 런타임 근거. evidence 2.ts가 아님.
                        lt: periodEndExclusive, // lt. 런타임 근거. evidence 2.ts가 아님.
                    },
                },
                orderBy: { createdAt: "desc" }, // orderBy 필드. 런타임 근거. evidence 2.ts가 아님.
                take: 8, // 조회 상한.
                select: { // select 필드. 런타임 근거. evidence 2.ts가 아님.
                    questionNo: true, // questionNo 선택.
                    questionText: true, // questionText 선택.
                    explanation: true, // explanation 선택.
                    status: true, // status 선택.
                    class: { select: { subject: true, name: true } }, // class. 런타임 근거. evidence 2.ts가 아님.
                    gradeRecord: { select: { subject: true, title: true } }, // gradeRecord. 런타임 근거. evidence 2.ts가 아님.
                },
            }),
        ]);

    const counts = { // counts 시작. 런타임 근거. evidence 2.ts가 아님.
        present: 0, // PRESENT/LATE/ABSENT/EXCUSED/EARLY_LEAVE 건수.
        late: 0, // late. 런타임 근거. evidence 2.ts가 아님.
        absent: 0, // absent. 런타임 근거. evidence 2.ts가 아님.
        excused: 0, // excused. 런타임 근거. evidence 2.ts가 아님.
        earlyLeave: 0, // earlyLeave. 런타임 근거. evidence 2.ts가 아님.
    };
    for (const row of attendanceRows) { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
        if (row.status === "PRESENT") counts.present += 1; // 가드. 런타임 근거. evidence 2.ts가 아님.
        else if (row.status === "LATE") counts.late += 1; // 분기. 런타임 근거. evidence 2.ts가 아님.
        else if (row.status === "ABSENT") counts.absent += 1; // 분기. 런타임 근거. evidence 2.ts가 아님.
        else if (row.status === "EXCUSED") counts.excused += 1; // 분기. 런타임 근거. evidence 2.ts가 아님.
        else if (row.status === "EARLY_LEAVE") counts.earlyLeave += 1; // 분기. 런타임 근거. evidence 2.ts가 아님.
    }
    const total = attendanceRows.length; // 분모. 0이면 출석률은 null.
    const attended = counts.present + counts.late + counts.earlyLeave; // 출석·지각·조퇴를 출석으로 친다. 결석·공결은 분모만.
    const rateLabel = // rateLabel. 런타임 근거. evidence 2.ts가 아님.
        total > 0 ? `${Math.round((attended / total) * 100)}%` : null; // 원장 홈 출석률과 달리 조퇴를 포함한다.

    return { // Decimal→number, 날짜는 KST YYYY-MM-DD. 없는 축은 빈 배열·total 0으로 둔다.
        grades: grades.map((grade) => { // grades. 런타임 근거. evidence 2.ts가 아님.
            const score = asNumber(grade.score); // score. 런타임 근거. evidence 2.ts가 아님.
            const maxScore = asNumber(grade.maxScore); // maxScore. 런타임 근거. evidence 2.ts가 아님.
            const percent = // percent. 런타임 근거. evidence 2.ts가 아님.
                maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0; // 소수 1자리 %. maxScore=0이면 나눗셈을 피한다.
            return { // 반환. 런타임 근거. evidence 2.ts가 아님.
                title: grade.title, // title. 런타임 근거. evidence 2.ts가 아님.
                subject: grade.subject, // subject. 런타임 근거. evidence 2.ts가 아님.
                score, // 런타임 근거. evidence 2.ts가 아님.
                maxScore, // 런타임 근거. evidence 2.ts가 아님.
                percent, // 런타임 근거. evidence 2.ts가 아님.
                assessedAt: formatKstYearMonthDay(grade.assessedAt), // assessedAt. 런타임 근거. evidence 2.ts가 아님.
                className: grade.class?.name ?? null, // className. 런타임 근거. evidence 2.ts가 아님.
            };
        }),
        attendance: { // attendance. 런타임 근거. evidence 2.ts가 아님.
            total, // 런타임 근거. evidence 2.ts가 아님.
            ...counts, // 전개. 런타임 근거. evidence 2.ts가 아님.
            rateLabel, // 런타임 근거. evidence 2.ts가 아님.
        },
        learningRecords: learningRecords.map((record) => ({ // learningRecords. 런타임 근거. evidence 2.ts가 아님.
            typeLabel: LEARNING_TYPE_LABEL[record.type] ?? record.type, // typeLabel. 런타임 근거. evidence 2.ts가 아님.
            title: record.title, // title. 런타임 근거. evidence 2.ts가 아님.
            content: record.content.slice(0, 160), // 프롬프트 토큰을 줄이고 초안이 장문이 되지 않게 한다.
            recordDate: formatKstYearMonthDay(record.recordDate), // recordDate. 런타임 근거. evidence 2.ts가 아님.
        })),
        wrongNotes: wrongNotes.map((note) => ({ // wrongNotes. 런타임 근거. evidence 2.ts가 아님.
            subjectHint: // subjectHint. 런타임 근거. evidence 2.ts가 아님.
                note.gradeRecord?.subject ?? // 성적 기록이 있으면 그걸, 없으면 반 과목·반 이름.
                note.class?.subject ?? // 런타임 근거. evidence 2.ts가 아님.
                note.class?.name ?? // 런타임 근거. evidence 2.ts가 아님.
                null, // 런타임 근거. evidence 2.ts가 아님.
            questionNo: note.questionNo, // questionNo. 런타임 근거. evidence 2.ts가 아님.
            questionText: note.questionText // questionText. 런타임 근거. evidence 2.ts가 아님.
                ? note.questionText.slice(0, 120) // 삼항. 런타임 근거. evidence 2.ts가 아님.
                : null, // 삼항 나머지. 런타임 근거. evidence 2.ts가 아님.
            statusLabel: WRONG_NOTE_STATUS_LABEL[note.status] ?? note.status, // statusLabel. 런타임 근거. evidence 2.ts가 아님.
            explanation: note.explanation // explanation. 런타임 근거. evidence 2.ts가 아님.
                ? note.explanation.slice(0, 120) // 삼항. 런타임 근거. evidence 2.ts가 아님.
                : null, // 삼항 나머지. 런타임 근거. evidence 2.ts가 아님.
        })),
    };
}

/**
 * Gemini 프롬프트에 붙일 사실 블록.
 * "아래 사실만 사용하세요" 머리말로, 근거 밖 창작을 막는다.
 */
export function formatEvidenceForPrompt(evidence: ReportEvidence) { // formatEvidenceForPrompt. 런타임 근거. evidence 2.ts가 아님.
    const lines: string[] = ["[기간 내 학습 근거 — 아래 사실만 사용하세요]"]; // 근거 밖 점수·출결 창작을 막는다.

    if (evidence.grades.length === 0) { // 가드. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 성적: 기간 내 기록 없음"); // 없으면 빈 칸이 아니라 "기록 없음".
    } else { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 성적:"); // 블록 끝.
        for (const grade of evidence.grades) { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
            lines.push( // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
                `  · ${grade.assessedAt} ${grade.subject}「${grade.title}」 ${grade.score}/${grade.maxScore}(${grade.percent}%)` + // 런타임 근거. evidence 2.ts가 아님.
                    (grade.className ? ` · ${grade.className}` : ""), // 런타임 근거. evidence 2.ts가 아님.
            );
        }
    }

    if (evidence.attendance.total === 0) { // 가드. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 출결: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
        const a = evidence.attendance; // a. 런타임 근거. evidence 2.ts가 아님.
        lines.push( // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
            `- 출결: 총 ${a.total}회 · 출석 ${a.present} · 지각 ${a.late} · 결석 ${a.absent} · 공결 ${a.excused} · 조퇴 ${a.earlyLeave}` + // 런타임 근거. evidence 2.ts가 아님.
                (a.rateLabel ? ` · 출석률(지각·조퇴 포함) ${a.rateLabel}` : ""), // 런타임 근거. evidence 2.ts가 아님.
        );
    }

    if (evidence.learningRecords.length === 0) { // 가드. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 학습 기록: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 학습 기록:"); // 블록 끝.
        for (const record of evidence.learningRecords) { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
            lines.push( // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
                `  · ${record.recordDate} [${record.typeLabel}] ${record.title} — ${record.content}`, // 런타임 근거. evidence 2.ts가 아님.
            );
        }
    }

    if (evidence.wrongNotes.length === 0) { // 가드. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 오답: 기간 내 기록 없음"); // 블록 끝.
    } else { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
        lines.push("- 오답:"); // 블록 끝.
        for (const note of evidence.wrongNotes) { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
            const q = note.questionNo ? `#${note.questionNo} ` : ""; // q. 런타임 근거. evidence 2.ts가 아님.
            const text = note.questionText ?? "(문항 요약 없음)"; // text. 런타임 근거. evidence 2.ts가 아님.
            lines.push( // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
                `  · [${note.statusLabel}] ${note.subjectHint ?? "과목미상"} ${q}${text}` + // 런타임 근거. evidence 2.ts가 아님.
                    (note.explanation ? ` / 지도: ${note.explanation}` : ""), // 런타임 근거. evidence 2.ts가 아님.
            );
        }
    }

    return lines.join("\n"); // draft-generator가 시스템 규칙 뒤에 붙인다.
}

/** 교사 화면에 보여줄 건수 한 줄. AI 본문이 아니라 근거 규모만 알린다. */
export function formatEvidenceSummary(evidence: ReportEvidence) { // formatEvidenceSummary. 런타임 근거. evidence 2.ts가 아님.
    const parts: string[] = []; // parts. 런타임 근거. evidence 2.ts가 아님.
    parts.push(`성적 ${evidence.grades.length}건`); // formatEvidenceSummary 끝.
    if (evidence.attendance.total > 0) { // 가드. 런타임 근거. evidence 2.ts가 아님.
        parts.push( // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
            `출결 ${evidence.attendance.total}회` + // 런타임 근거. evidence 2.ts가 아님.
                (evidence.attendance.rateLabel // 런타임 근거. evidence 2.ts가 아님.
                    ? `(${evidence.attendance.rateLabel})` // 삼항. 런타임 근거. evidence 2.ts가 아님.
                    : ""), // 삼항 나머지. 런타임 근거. evidence 2.ts가 아님.
        );
    } else { // 블록 시작. 런타임 근거. evidence 2.ts가 아님.
        parts.push("출결 없음"); // 0회면 "없음".
    }
    parts.push(`학습기록 ${evidence.learningRecords.length}건`); // 블록 끝.
    parts.push(`오답 ${evidence.wrongNotes.length}건`); // 블록 끝.
    return parts.join(" · "); // 교사 화면 안내. 학부모 본문이 아니다.
}

/** 네 축 중 하나라도 있으면 템플릿이 요약 문단을 붙인다. 전부 없으면 키워드 문장만. */
export function hasAnyEvidence(evidence: ReportEvidence) { // hasAnyEvidence. 런타임 근거. evidence 2.ts가 아님.
    return ( // 반환. 런타임 근거. evidence 2.ts가 아님.
        evidence.grades.length > 0 || // 네 축 중 하나라도 있으면 템플릿이 요약 문단을 붙인다.
        evidence.attendance.total > 0 || // 런타임 근거. evidence 2.ts가 아님.
        evidence.learningRecords.length > 0 || // 런타임 근거. evidence 2.ts가 아님.
        evidence.wrongNotes.length > 0 // 런타임 근거. evidence 2.ts가 아님.
    );
}
