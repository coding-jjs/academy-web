/**
 * 재원생 전원 스캔 → 결석·성적 하락 등 신호 4종 → `ChurnCase`.
 * 원장이 이탈 징후를 명단에서 고르지 않아도 큐에 쌓이게 한다.
 *
 * 호출: `features/churn/actions.ts` (원장 "지금 스캔" 액션).
 * 서버 전용 쓰기. 임계값은 `churnThresholdConfig` id=1 (없으면 코드 기본값).
 *
 * 신호:
 * - ATTENDANCE_DROP: 직전 14일 vs 그 앞 14일 출석률 하락 (%p)
 * - CONSECUTIVE_ABSENCE: 오늘 이전 연속 결석
 * - SCORE_DROP: 과목별 최근 두 점 하락
 * - UNPAID_DAYS: ISSUED/OVERDUE 청구의 연체 일수
 *
 * 의도적으로 하지 않는 일:
 * - 신호가 사라진 케이스를 RESOLVED로 닫지 않는다. 원장이 상담/종결한다.
 * - PAUSED/WITHDRAWN 원생은 스캔하지 않는다 — 이미 떠난 학생을 큐에 넣지 않기 위함.
 * - 열린 케이스(DETECTED/COUNSELING/PENDING_REVIEW)가 있으면 새로 만들지 않고 summary만 갱신한다.
 *
 * 관련: `features/churn/*`, `student-lifecycle.ts` (퇴원 시 케이스 닫기), `date-kst.ts`.
 */

import { CHURN_SIGNAL_LABELS } from "@/features/churn/presentation"; // 화면 한글. 케이스가 닫힐 때 쓰는 문구가 아님.
import { OPEN_CHURN_STATUSES } from "@/features/churn/types"; // DETECTED·COUNSELING·PENDING_REVIEW. 새 카드를 만들지 않는다.
import { prisma } from "@/lib/db"; // 원장 스캔 쓰기. PAUSED/WITHDRAWN은 where에서 뺀다.
import { getKstDayRange } from "@/lib/date-kst"; // 오늘은 진행 중이라 창에서 뺀다. 서버 자정이 아님.
import type { Prisma } from "@/generate/prisma/client"; // details JSON. 신호 이력.

/** 한 학생에서 잡힌 신호. value/threshold는 화면·로그에 숫자로 보여 준다. */
export type DetectedSignal = { // 임계 미만이면 배열에 넣지 않는다. 열린 케이스를 닫지 않는다.
    type: // 4종. RESOLVED로 자동 종결하지 않는다.
        | "ATTENDANCE_DROP" // 직전 14일 vs 그 앞 14일 출석률 하락(%p).
        | "SCORE_DROP" // 과목별 최근 두 점 하락. 가장 큰 것만.
        | "CONSECUTIVE_ABSENCE" // 오늘 이전 연속 ABSENT.
        | "UNPAID_DAYS"; // ISSUED/OVERDUE 연체 일수. DRAFT/PAID/CANCELLED는 안 본다.
    value: number | null; // 화면 숫자. 없으면 라벨만.
    threshold: number | null; // id=1 설정. 없으면 15/10/2/3.
    details: Prisma.InputJsonValue; // 창 건수·과목명 등. 카드 summary와 별개.
};

type Threshold = { // churnThresholdConfig id=1. 시드·리셋과 같은 기본값.
    attendanceDropPercentPoint: number; // %p. 기록 0건이면 하락을 계산하지 않는다.
    scoreDropPoints: number; // 과목별 최신 2점.
    consecutiveAbsences: number; // 오늘 이후 회차는 streak에 안 넣는다.
    unpaidDays: number; // 가장 오래된 연체만. 여러 청구여도 숫자 하나.
};

/**
 * 출석률 %. PRESENT/LATE/EXCUSED를 "온 것"으로 친다.
 * 지각·사유결석은 이탈 신호가 아니라 출석 쪽에 두어, 병결만으로 ATTENDANCE_DROP이 뜨지 않게 한다.
 * 기록이 0건이면 null — 분모 0으로 100% 하락이 나오는 것을 막는다.
 */
function attendanceRate( // 재원 ENROLLED만 스캔. 열린 케이스는 summary만.
    rows: { status: string }[], // 한 창(14일). 오늘 회차는 호출부가 이미 뺐다.
): number | null { // 0건이면 null. 100% 하락 왜곡을 막는다.
    if (rows.length === 0) return null; // 기록 0건이면 null. 분모 0으로 100% 하락이 나오는 것을 막는다.

    const good = rows.filter( // PRESENT/LATE/EXCUSED만 분자. ABSENT만 하락.
        (r) => // 지각·사유결석은 이탈이 아니라 출석 쪽.
            r.status === "PRESENT" || // 출석.
            r.status === "LATE" || // 지각. 이탈 신호가 아님.
            r.status === "EXCUSED", // 병결만으로 ATTENDANCE_DROP이 뜨지 않게. EARLY_LEAVE는 이 분자에 없다.
    ).length; // 분자. 분모는 창의 전체 기록.
    return (good / rows.length) * 100; // %. 양쪽 창이 null이 아닐 때만 하락을 본다.
}

/**
 * 한 재원생의 4종 신호를 평가한다. 임계 미만이면 해당 타입을 넣지 않는다.
 */
async function evaluateStudent( // 재원 ENROLLED만 스캔. 열린 케이스는 summary만.
    studentId: string, // ENROLLED만 호출부가 넘긴다. PAUSED/WITHDRAWN은 스캔하지 않는다.
    threshold: Threshold, // id=1. 없으면 15/10/2/3.
    now: Date, // KST 오늘. 진행 중 회차를 창에서 뺀다.
): Promise<DetectedSignal[]> { // 임계 미만은 넣지 않는다. 열린 케이스를 닫지 않는다.
    const { startOfToday } = getKstDayRange(now); // 오늘은 진행 중일 수 있어 창에서 뺀다.

    const recentStart = new Date(startOfToday); // 최근 14일 vs 그 앞 14일. 한 달 창을 반으로 나눠 "갑자기 안 오기 시작"을 본다.
    recentStart.setDate(recentStart.getDate() - 14); // 최근 창 시작. 오늘 미만.
    const prevStart = new Date(startOfToday); // 그 앞 14일 시작.
    prevStart.setDate(prevStart.getDate() - 28); // 28일 전. 한 달 창의 앞쪽.

    const signals: DetectedSignal[] = []; // 임계 미만은 push하지 않는다.

    const attendance = await prisma.attendanceRecord.findMany({ // 오늘은 진행 중일 수 있어 창에서 뺀다. 부분 출석으로 하락이 왜곡되지 않게.
        where: { // 이 원생. 28일 전 ~ 오늘 미만.
            studentId, // ENROLLED 원생.
            session: { // 회차 시작으로 창을 자른다. 출석 행의 createdAt이 아님.
                startsAt: { gte: prevStart, lt: startOfToday }, // 오늘 회차 제외. 부분 출석 왜곡을 막는다.
            },
        },
        select: { // streak·출석률용.
            status: true, // PRESENT/LATE/EXCUSED/ABSENT.
            session: { select: { startsAt: true } }, // 창 분할·streak 최신순.
        },
        orderBy: { session: { startsAt: "desc" } }, // 연속 결석 streak용 최신순.
    });

    const recent = attendance.filter( // 최근 14일.
        (a) => a.session.startsAt >= recentStart, // 오늘 미만은 where가 이미 자름.
    );
    const previous = attendance.filter( // 그 앞 14일.
        (a) => // prevStart 이상 recentStart 미만.
            a.session.startsAt >= prevStart && // 한 달 창 앞쪽.
            a.session.startsAt < recentStart, // 최근 창과 겹치지 않게.
    );

    const recentRate = attendanceRate(recent); // 양쪽 창에 기록이 있을 때만. 임계 %p 이상 하락이면 ATTENDANCE_DROP.
    const prevRate = attendanceRate(previous); // 0건이면 null. 100% 하락 왜곡을 막는다.
    if (recentRate != null && prevRate != null) { // 한쪽 창이 비면 신호를 넣지 않는다.
        const drop = prevRate - recentRate; // %p. 상승이면 음수라 임계에 안 걸린다.
        if (drop >= threshold.attendanceDropPercentPoint) { // id=1 기본 15%p.
            signals.push({ // 열린 케이스가 있으면 summary만 갱신. 여기서 카드를 만들지 않는다.
                type: "ATTENDANCE_DROP", // 직전 14일 vs 그 앞 14일.
                value: Math.round(drop * 10) / 10, // 화면 한 자리.
                threshold: threshold.attendanceDropPercentPoint, // 설정값. 로그에 남긴다.
                details: { // 창 건수. 분모 왜곡을 원장이 보게.
                    recentRate: Math.round(recentRate * 10) / 10, // 최근 %.
                    prevRate: Math.round(prevRate * 10) / 10, // 이전 %.
                    recentCount: recent.length, // 최근 기록 수.
                    prevCount: previous.length, // 이전 기록 수.
                },
            });
        }
    }

    let streak = 0; // 최신순. 오늘 이후는 건너뛰고 ABSENT가 끊기는 순간 streak를 멈춘다.
    for (const row of attendance) { // 최신순. LATE/EXCUSED면 끊긴다.
        if (row.session.startsAt >= startOfToday) continue; // 오늘 이후는 건너뛴다. where가 이미 lt지만 안전망.
        if (row.status === "ABSENT") streak += 1; // 연속 결석. PRESENT면 아래에서 break.
        else break; // 출석·지각·사유결석이면 streak 종료.
    }
    if (streak >= threshold.consecutiveAbsences) { // 기본 2회. 오늘 이전만.
        signals.push({ // CONSECUTIVE_ABSENCE. 열린 카드를 닫지 않는다.
            type: "CONSECUTIVE_ABSENCE", // 오늘 이전 연속 ABSENT.
            value: streak, // 회수.
            threshold: threshold.consecutiveAbsences, // 설정값.
            details: { streak }, // 같은 숫자. 카드 summary용.
        });
    }

    const grades = await prisma.gradeRecord.findMany({ // 최근 40건이면 과목별 최신 2개를 고르기에 충분. 전체 이력을 끌어오지 않는다.
        where: { studentId }, // 이 원생. 재원만 호출됨.
        orderBy: { assessedAt: "desc" }, // 과목별 최신 2점.
        take: 40, // 전체 이력을 끌어오지 않는다.
        select: { // 과목·점수·일자.
            subject: true, // 과목별 그룹.
            score: true, // Decimal → Number.
            assessedAt: true, // 최신순 이미 orderBy.
        },
    });

    const bySubject = new Map<string, { score: number; assessedAt: Date }[]>(); // 과목별 최신순 리스트.
    for (const g of grades) { // 40건을 과목 버킷에.
        const list = bySubject.get(g.subject) ?? []; // 없으면 빈 배열.
        list.push({ score: Number(g.score), assessedAt: g.assessedAt }); // Decimal → number. 최신순 유지.
        bySubject.set(g.subject, list); // 과목 버킷.
    }

    let maxScoreDrop = 0; // 과목별 최신 2점. 가장 큰 하락만 SCORE_DROP으로 넣는다.
    let dropSubject: string | null = null; // 가장 큰 하락 과목. 여러 과목이어도 카드 하나에 하나.
    for (const [subject, list] of bySubject) { // 한 과목 1점이면 건너뛴다.
        if (list.length < 2) continue; // 비교할 이전 점이 없음.
        const newest = list[0]; // 최신.
        const prev = list[1]; // 그 앞.
        const drop = prev.score - newest.score; // 상승이면 음수. max에 안 남는다.
        if (drop > maxScoreDrop) { // 가장 큰 하락만.
            maxScoreDrop = drop; // 점수.
            dropSubject = subject; // 과목명. details에 남긴다.
        }
    }
    if (maxScoreDrop >= threshold.scoreDropPoints && dropSubject) { // 기본 10점. 과목명 필수.
        signals.push({ // SCORE_DROP. 가장 큰 하락만.
            type: "SCORE_DROP", // 과목별 최근 두 점.
            value: Math.round(maxScoreDrop * 10) / 10, // 화면 한 자리.
            threshold: threshold.scoreDropPoints, // 설정값.
            details: { subject: dropSubject }, // 과목명. 여러 과목이어도 하나.
        });
    }

    const unpaidInvoices = await prisma.invoice.findMany({ // DRAFT는 청구 전, PAID/CANCELLED는 끝. ISSUED/OVERDUE만 본다.
        where: { // 이 원생의 미납만.
            studentId, // 재원 원생.
            status: { in: ["ISSUED", "OVERDUE"] }, // DRAFT/PAID/CANCELLED는 안 본다.
        },
        select: { id: true, dueDate: true, title: true, status: true }, // 연체 일수·제목. 가장 오래된 것만 신호에.
    });

    let maxUnpaidDays = 0; // 가장 오래된 연체만. 여러 청구여도 케이스 하나에 숫자 하나.
    let unpaidTitle: string | null = null; // 그 청구 제목.
    for (const inv of unpaidInvoices) { // ISSUED/OVERDUE.
        const due = new Date(inv.dueDate); // date 컬럼. KST 오늘과 일수 비교.
        const days = Math.floor( // 오늘 시작 - 마감. 당일은 0.
            (startOfToday.getTime() - due.getTime()) / (24 * 60 * 60 * 1000), // 일수. 서버 TZ가 아니라 밀리초.
        );
        if (days >= threshold.unpaidDays && days > maxUnpaidDays) { // 기본 3일. 더 오래된 것만 갱신.
            maxUnpaidDays = days; // 최대 연체.
            unpaidTitle = inv.title; // 카드 details.
        }
    }

    if (maxUnpaidDays >= threshold.unpaidDays) { // 가장 오래된 연체만. 여러 청구가 있어도 케이스 하나에 숫자 하나.
        signals.push({ // UNPAID_DAYS. 교사 수납 화면이 아니라 원장 이탈 큐.
            type: "UNPAID_DAYS", // ISSUED/OVERDUE.
            value: maxUnpaidDays, // 일수.
            threshold: threshold.unpaidDays, // 설정값.
            details: { title: unpaidTitle }, // 청구 제목.
        });
    }

    return signals; // 빈 배열이면 열린 케이스 summary를 비우지 않는다.
}

function buildSummary(signals: DetectedSignal[]) { // 카드 한 줄. 원장이 상담/종결할 때까지 유지.
    return signals // 한글 라벨 + 숫자.
        .map((s) => // value 없으면 라벨만.
            s.value != null // 재원 ENROLLED만 스캔. 열린 케이스는 summary만.
                ? `${CHURN_SIGNAL_LABELS[s.type]} (${s.value})` // 화면·케이스 카드에 올릴 "출석률 하락 (22) · 연속 결석 (2)" 한 줄.
                : CHURN_SIGNAL_LABELS[s.type], // 숫자 없는 신호. 거의 없음.
        )
        .join(" · "); // 카드 summary. DETECTED/COUNSELING 갱신에 그대로.
}

/** 스캔 한 번의 집계. 원장 화면에 "N명 스캔, 신규 M"을 보여 줄 때 쓴다. */
export type ChurnDetectResult = { // 원장 액션 응답. 신호가 사라진 케이스를 닫은 건수는 없음.
    scanned: number; // ENROLLED 수. PAUSED/WITHDRAWN 제외.
    created: number; // 새 DETECTED 카드.
    updated: number; // 열린 카드 summary만.
    signalCount: number; // 이번 스캔 push 합. 로그 행 수와 같음.
};

/**
 * 재원 학생 전원을 스캔해 ChurnCase / Signal 생성·갱신.
 * 임계 행이 없으면 15%p / 10점 / 연속 2회 / 3일 — 시드·리셋 스크립트와 같은 기본값.
 */
export async function detectChurnCases( // 재원 ENROLLED만 스캔. 열린 케이스는 summary만.
    now = new Date(), // KST 오늘. 원장 "지금 스캔".
): Promise<ChurnDetectResult> { // 신호가 사라진 케이스를 RESOLVED로 닫지 않는다.
    const thresholdRow = await prisma.churnThresholdConfig.findUnique({ // id=1 행이 없으면 시드와 같은 15%p / 10점 / 연속 2회 / 3일.
        where: { id: 1 }, // 단일 행. 리셋 스크립트가 upsert.
    });

    const threshold: Threshold = { // 시드·리셋과 같은 기본. 원장이 바꾼 값이 있으면 그걸 쓴다.
        attendanceDropPercentPoint: Number( // Decimal → number.
            thresholdRow?.attendanceDropPercentPoint ?? 15, // %p. 기록 0건이면 하락 없음.
        ),
        scoreDropPoints: Number(thresholdRow?.scoreDropPoints ?? 10), // 과목별 최신 2점.
        consecutiveAbsences: thresholdRow?.consecutiveAbsences ?? 2, // 오늘 이전 연속 ABSENT.
        unpaidDays: thresholdRow?.unpaidDays ?? 3, // ISSUED/OVERDUE.
    };

    const students = await prisma.student.findMany({ // 재원만. PAUSED/WITHDRAWN은 이미 떠난 학생을 큐에 넣지 않는다.
        where: { status: "ENROLLED" }, // 휴원·퇴원은 스캔하지 않는다. 퇴원 시 lifecycle이 케이스를 닫는다.
        select: { id: true }, // 신호 평가만. 이름은 카드가 조인.
    });

    let created = 0; // 새 DETECTED. RESOLVED 과거 카드는 다시 열지 않고 새로 만든다.
    let updated = 0; // 열린 카드 summary만. 상태 전이는 원장 상담.
    let signalCount = 0; // 이번 스캔 로그 행.

    for (const student of students) { // 재원 한 명. 신호 없으면 continue.
        const signals = await evaluateStudent(student.id, threshold, now); // 4종. 임계 미만은 배열에 없음.

        if (signals.length === 0) continue; // 신호 없으면 열린 케이스 summary를 비우지 않는다. 원장이 상담/종결한다.

        signalCount += signals.length; // 로그 createMany 건수.
        const summary = buildSummary(signals); // 카드 한 줄.

        const openCase = await prisma.churnCase.findFirst({ // 열린 카드가 있으면 새 카드를 만들지 않는다.
            where: { // 이 원생의 열린 카드.
                studentId: student.id, // 이 원생.
                status: { in: [...OPEN_CHURN_STATUSES] }, // IMPROVED/WITHDRAWN은 열린 카드가 아님. 검토 대기 포함.
            },
            orderBy: { detectedAt: "desc" }, // 가장 최근 열린 카드.
            select: { id: true }, // summary만 갱신.
        });

        let caseId: string; // 신호 로그 FK. 새 카드 또는 열린 카드.

        if (openCase) { // 상담 중이면 요약만. 상태를 COUNSELING에서 바꾸지 않는다.
            await prisma.churnCase.update({ // 상담 중이면 요약만 갈아 끼운다.
                where: { id: openCase.id }, // 열린 카드.
                data: { summary }, // 상태·resolvedAt은 원장 상담/종결.
            });
            caseId = openCase.id; // 로그를 이 카드에 붙인다.
            updated += 1; // 신규 카드가 아님.
        } else { // 열린 카드 없음. 과거 RESOLVED는 다시 열지 않는다.
            const createdCase = await prisma.churnCase.create({ // 새 징후 카드. RESOLVED/IMPROVED 과거 케이스는 다시 열지 않고 새로 만든다.
                data: { // DETECTED. 원장이 상담하면 COUNSELING.
                    studentId: student.id, // 재원 원생.
                    status: "DETECTED", // 큐 진입. 자동 RESOLVED 없음.
                    summary, // 한글 한 줄.
                    detectedAt: now, // 스캔 시각.
                },
                select: { id: true }, // 로그 FK.
            });
            caseId = createdCase.id; // 이번 스캔 로그.
            created += 1; // 신규.
        }

        await prisma.churnSignalLog.createMany({ // 이번 스캔에서 잡힌 신호를 케이스에 붙인다. 이력이 쌓이게.
            data: signals.map((s) => ({ // 한 스캔의 4종. 이전 스캔 로그는 남긴다.
                churnCaseId: caseId, // 열린 카드 또는 새 카드.
                type: s.type, // 4종.
                value: s.value, // 화면 숫자.
                threshold: s.threshold, // 당시 설정.
                details: s.details, // 과목·청구 제목.
                detectedAt: now, // 스캔 시각.
            })),
        });
    }

    return { // 원장 화면 "N명 스캔, 신규 M". 닫은 건수는 없음.
        scanned: students.length, // ENROLLED. PAUSED/WITHDRAWN 제외.
        created, // 새 DETECTED.
        updated, // summary만.
        signalCount, // 로그 행.
    };
}
