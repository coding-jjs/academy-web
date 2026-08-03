import { prisma } from "@/lib/db";
import { getKstDayRange } from "@/lib/date-kst";

export type DetectedSignal = {
    type:
        | "ATTENDANCE_DROP"
        | "SCORE_DROP"
        | "CONSECUTIVE_ABSENCE"
        | "UNPAID_DAYS";
    value: number | null;
    threshold: number | null;
    details: Record<string, unknown>;
};

type Threshold = {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
};

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
    const labels: Record<DetectedSignal["type"], string> = {
        ATTENDANCE_DROP: "출석 하락",
        SCORE_DROP: "성적 하락",
        CONSECUTIVE_ABSENCE: "연속 결석",
        UNPAID_DAYS: "미납",
    };
    return signals
        .map((s) =>
            s.value != null
                ? `${labels[s.type]} (${s.value})`
                : labels[s.type],
        )
        .join(" · ");
}

export type ChurnDetectResult = {
    scanned: number;
    created: number;
    updated: number;
    signalCount: number;
};

/** 재원 학생 전원을 스캔해 ChurnCase / Signal 생성·갱신 */
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
                status: { in: ["DETECTED", "COUNSELING"] },
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