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

import { CHURN_SIGNAL_LABELS } from "@/features/churn/presentation";
import { OPEN_CHURN_STATUSES } from "@/features/churn/types";
import { prisma } from "@/lib/db";
import { getKstDayRange } from "@/lib/date-kst";
import type { Prisma } from "@/generate/prisma/client";

/** 한 학생에서 잡힌 신호. value/threshold는 화면·로그에 숫자로 보여 준다. */
export type DetectedSignal = {
    type:
        | "ATTENDANCE_DROP"
        | "SCORE_DROP"
        | "CONSECUTIVE_ABSENCE"
        | "UNPAID_DAYS";
    value: number | null;
    threshold: number | null;
    details: Prisma.InputJsonValue;
};

type Threshold = {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
};

/**
 * 출석률 %. PRESENT/LATE/EXCUSED를 "온 것"으로 친다.
 * 지각·사유결석은 이탈 신호가 아니라 출석 쪽에 두어, 병결만으로 ATTENDANCE_DROP이 뜨지 않게 한다.
 * 기록이 0건이면 null — 분모 0으로 100% 하락이 나오는 것을 막는다.
 */
function attendanceRate(
    rows: { status: string }[],
): number | null {
    if (rows.length === 0) return null;

    const good = rows.filter(
        (r) =>
            r.status === "PRESENT" ||
            r.status === "LATE" ||
            r.status === "EXCUSED",
    ).length;
    return (good / rows.length) * 100;
}

/**
 * 한 재원생의 4종 신호를 평가한다. 임계 미만이면 해당 타입을 넣지 않는다.
 */
async function evaluateStudent(
    studentId: string,
    threshold: Threshold,
    now: Date,
): Promise<DetectedSignal[]> {
    const { startOfToday } = getKstDayRange(now);

    const recentStart = new Date(startOfToday);
    recentStart.setDate(recentStart.getDate() - 14);
    const prevStart = new Date(startOfToday);
    prevStart.setDate(prevStart.getDate() - 28);

    const signals: DetectedSignal[] = [];

    const attendance = await prisma.attendanceRecord.findMany({
        where: {
            studentId,
            session: {
                startsAt: { gte: prevStart, lt: startOfToday },
            },
        },
        select: {
            status: true,
            session: { select: { startsAt: true } },
        },
        orderBy: { session: { startsAt: "desc" } },
    });

    const recent = attendance.filter(
        (a) => a.session.startsAt >= recentStart,
    );
    const previous = attendance.filter(
        (a) =>
            a.session.startsAt >= prevStart &&
            a.session.startsAt < recentStart,
    );

    const recentRate = attendanceRate(recent);
    const prevRate = attendanceRate(previous);
    if (recentRate != null && prevRate != null) {
        const drop = prevRate - recentRate;
        if (drop >= threshold.attendanceDropPercentPoint) {
            signals.push({
                type: "ATTENDANCE_DROP",
                value: Math.round(drop * 10) / 10,
                threshold: threshold.attendanceDropPercentPoint,
                details: {
                    recentRate: Math.round(recentRate * 10) / 10,
                    prevRate: Math.round(prevRate * 10) / 10,
                    recentCount: recent.length,
                    prevCount: previous.length,
                },
            });
        }
    }

    let streak = 0;
    for (const row of attendance) {
        if (row.session.startsAt >= startOfToday) continue;
        if (row.status === "ABSENT") streak += 1;
        else break;
    }
    if (streak >= threshold.consecutiveAbsences) {
        signals.push({
            type: "CONSECUTIVE_ABSENCE",
            value: streak,
            threshold: threshold.consecutiveAbsences,
            details: { streak },
        });
    }

    const grades = await prisma.gradeRecord.findMany({
        where: { studentId },
        orderBy: { assessedAt: "desc" },
        take: 40,
        select: {
            subject: true,
            score: true,
            assessedAt: true,
        },
    });

    const bySubject = new Map<string, { score: number; assessedAt: Date }[]>();
    for (const g of grades) {
        const list = bySubject.get(g.subject) ?? [];
        list.push({ score: Number(g.score), assessedAt: g.assessedAt });
        bySubject.set(g.subject, list);
    }

    let maxScoreDrop = 0;
    let dropSubject: string | null = null;
    for (const [subject, list] of bySubject) {
        if (list.length < 2) continue;
        const newest = list[0];
        const prev = list[1];
        const drop = prev.score - newest.score;
        if (drop > maxScoreDrop) {
            maxScoreDrop = drop;
            dropSubject = subject;
        }
    }
    if (maxScoreDrop >= threshold.scoreDropPoints && dropSubject) {
        signals.push({
            type: "SCORE_DROP",
            value: Math.round(maxScoreDrop * 10) / 10,
            threshold: threshold.scoreDropPoints,
            details: { subject: dropSubject },
        });
    }

    const unpaidInvoices = await prisma.invoice.findMany({
        where: {
            studentId,
            status: { in: ["ISSUED", "OVERDUE"] },
        },
        select: { id: true, dueDate: true, title: true, status: true },
    });

    let maxUnpaidDays = 0;
    let unpaidTitle: string | null = null;
    for (const inv of unpaidInvoices) {
        const due = new Date(inv.dueDate);
        const days = Math.floor(
            (startOfToday.getTime() - due.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (days >= threshold.unpaidDays && days > maxUnpaidDays) {
            maxUnpaidDays = days;
            unpaidTitle = inv.title;
        }
    }

    if (maxUnpaidDays >= threshold.unpaidDays) {
        signals.push({
            type: "UNPAID_DAYS",
            value: maxUnpaidDays,
            threshold: threshold.unpaidDays,
            details: { title: unpaidTitle },
        });
    }

    return signals;
}

function buildSummary(signals: DetectedSignal[]) {
    return signals
        .map((s) =>
            s.value != null
                ? `${CHURN_SIGNAL_LABELS[s.type]} (${s.value})`
                : CHURN_SIGNAL_LABELS[s.type],
        )
        .join(" · ");
}

/** 스캔 한 번의 집계. 원장 화면에 "N명 스캔, 신규 M"을 보여 줄 때 쓴다. */
export type ChurnDetectResult = {
    scanned: number;
    created: number;
    updated: number;
    signalCount: number;
};

/**
 * 재원 학생 전원을 스캔해 ChurnCase / Signal 생성·갱신.
 * 임계 행이 없으면 15%p / 10점 / 연속 2회 / 3일 — 시드·리셋 스크립트와 같은 기본값.
 */
export async function detectChurnCases(
    now = new Date(),
): Promise<ChurnDetectResult> {
    const thresholdRow = await prisma.churnThresholdConfig.findUnique({
        where: { id: 1 },
    });

    const threshold: Threshold = {
        attendanceDropPercentPoint: Number(
            thresholdRow?.attendanceDropPercentPoint ?? 15,
        ),
        scoreDropPoints: Number(thresholdRow?.scoreDropPoints ?? 10),
        consecutiveAbsences: thresholdRow?.consecutiveAbsences ?? 2,
        unpaidDays: thresholdRow?.unpaidDays ?? 3,
    };

    const students = await prisma.student.findMany({
        where: { status: "ENROLLED" },
        select: { id: true },
    });

    let created = 0;
    let updated = 0;
    let signalCount = 0;

    for (const student of students) {
        const signals = await evaluateStudent(student.id, threshold, now);

        if (signals.length === 0) continue;

        signalCount += signals.length;
        const summary = buildSummary(signals);

        const openCase = await prisma.churnCase.findFirst({
            where: {
                studentId: student.id,
                status: { in: [...OPEN_CHURN_STATUSES] },
            },
            orderBy: { detectedAt: "desc" },
            select: { id: true },
        });

        let caseId: string;

        if (openCase) {
            await prisma.churnCase.update({
                where: { id: openCase.id },
                data: { summary },
            });
            caseId = openCase.id;
            updated += 1;
        } else {
            const createdCase = await prisma.churnCase.create({
                data: {
                    studentId: student.id,
                    status: "DETECTED",
                    summary,
                    detectedAt: now,
                },
                select: { id: true },
            });
            caseId = createdCase.id;
            created += 1;
        }

        await prisma.churnSignalLog.createMany({
            data: signals.map((s) => ({
                churnCaseId: caseId,
                type: s.type,
                value: s.value,
                threshold: s.threshold,
                details: s.details,
                detectedAt: now,
            })),
        });
    }

    return {
        scanned: students.length,
        created,
        updated,
        signalCount,
    };
}
