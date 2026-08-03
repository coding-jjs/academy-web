"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { detectChurnCases } from "@/lib/churn-detect";
import { prisma } from "@/lib/db";
import { expandParentRecipients } from "@/lib/message-actions";

export type ChurnActionResult =
    | { ok: true; message: string }
    | { ok: false; message: string };

async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

export async function advanceChurnCase(input: {
    churnCaseId: string;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim();
    if (!churnCaseId) {
        return { ok: false, message: "이탈 케이스 ID가 없습니다." };
    }

    const row = await prisma.churnCase.findUnique({
        where: { id: churnCaseId },
        select: { id: true, status: true },
    });

    if (!row) {
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." };
    }

    if (row.status === "DETECTED") {
        await prisma.churnCase.update({
            where: { id: row.id },
            data: {
                status: "COUNSELING",
                assignedUserId: session.user.id,
                resolvedAt: null,
            },
        });
        revalidatePath("/director/churn");
        return { ok: true, message: "상담을 시작했습니다." };
    }

    if (row.status === "COUNSELING") {
        await prisma.churnCase.update({
            where: { id: row.id },
            data: {
                status: "IMPROVED",
                resolvedAt: new Date(),
            },
        });
        revalidatePath("/director/churn");
        return { ok: true, message: "개선으로 처리했습니다." };
    }

    return {
        ok: false,
        message: "이 상태에서는 다음 단계로 진행할 수 없습니다.",
    };
}

export async function sendChurnParentNote(input: {
    churnCaseId: string;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim();
    if (!churnCaseId) {
        return { ok: false, message: "이탈 케이스 ID가 없습니다." };
    }

    const row = await prisma.churnCase.findUnique({
        where: { id: churnCaseId },
        select: {
            id: true,
            status: true,
            summary: true,
            student: {
                select: {
                    id: true,
                    name: true,
                    parentLinks: {
                        where: { endedAt: null },
                        select: { parentUserId: true },
                    },
                },
            },
        },
    });

    if (!row) {
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." };
    }

    if (row.status !== "IMPROVED" && row.status !== "WITHDRAWN") {
        return {
            ok: false,
            message: "개선·퇴원 상태에서만 쪽지를 보낼 수 있습니다.",
        };
    }

    const parentIds = [
        ...new Set(row.student.parentLinks.map((l) => l.parentUserId)),
    ];
    if (parentIds.length === 0) {
        return {
            ok: false,
            message: "연결된 학부모가 없어 쪽지를 보낼 수 없습니다.",
        };
    }

    const recipientIds = await expandParentRecipients(
        parentIds,
        session.user.id,
    );
    if (recipientIds.length === 0) {
        return {
            ok: false,
            message:
                "연결된 학부모/학생 계정이 없어 쪽지를 보낼 수 없습니다.",
        };
    }

    const title = `[이탈 케어] ${row.student.name} 학생 안내`;
    const content = [
        `${row.student.name} 학생 이탈 케어 관련 안내입니다.`,
        row.summary?.trim()
            ? `요약: ${row.summary.trim()}`
            : "최근 출결·학습 상태를 함께 살펴봐 주시면 감사하겠습니다.",
        "궁금한 점이 있으면 학원으로 문의해 주세요.",
    ].join("\n\n");

    const now = new Date();
    await prisma.message.create({
        data: {
            senderUserId: session.user.id,
            authorUserId: session.user.id,
            title,
            content,
            deepLink: "/parent/inbox",
            status: "SENT",
            audience: "PARENT",
            sentAt: now,
            recipients: {
                create: recipientIds.map((recipientUserId) => ({
                    recipientUserId,
                })),
            },
        },
    });

    revalidatePath("/director/churn");
    revalidatePath("/parent/inbox");
    revalidatePath("/parent/student-inbox");
    revalidatePath("/student/inbox");
    revalidatePath("/director/messages");

    return { ok: true, message: "학부모·학생에게 쪽지를 보냈습니다." };
}

export async function saveChurnThreshold(input: {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
}): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const attendanceDropPercentPoint = Number(
        input.attendanceDropPercentPoint,
    );
    const scoreDropPoints = Number(input.scoreDropPoints);
    const consecutiveAbsences = Number(input.consecutiveAbsences);
    const unpaidDays = Number(input.unpaidDays);

    if (
        !Number.isFinite(attendanceDropPercentPoint) ||
        attendanceDropPercentPoint < 0 ||
        attendanceDropPercentPoint > 100
    ) {
        return { ok: false, message: "출석 하락(%p) 값이 올바르지 않습니다." };
    }
    if (!Number.isFinite(scoreDropPoints) || scoreDropPoints < 0) {
        return { ok: false, message: "성적 하락 값이 올바르지 않습니다." };
    }
    if (
        !Number.isInteger(consecutiveAbsences) ||
        consecutiveAbsences < 1 ||
        consecutiveAbsences > 30
    ) {
        return { ok: false, message: "연속 결석 횟수가 올바르지 않습니다." };
    }
    if (
        !Number.isInteger(unpaidDays) ||
        unpaidDays < 1 ||
        unpaidDays > 90
    ) {
        return { ok: false, message: "미납 일수가 올바르지 않습니다." };
    }

    await prisma.churnThresholdConfig.upsert({
        where: { id: 1 },
        create: {
            id: 1,
            attendanceDropPercentPoint,
            scoreDropPoints,
            consecutiveAbsences,
            unpaidDays,
            updatedBy: session.user.id,
        },
        update: {
            attendanceDropPercentPoint,
            scoreDropPoints,
            consecutiveAbsences,
            unpaidDays,
            updatedBy: session.user.id,
        },
    });

    revalidatePath("/director/churn");
    return { ok: true, message: "임계값을 저장했습니다." };
}

export async function runChurnDetection(): Promise<ChurnActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    try {
        const result = await detectChurnCases();
        revalidatePath("/director/churn");
        revalidatePath("/director/dashboard");

        return {
            ok: true,
            message: `감지 완료: 학생 ${result.scanned}명 · 신규 ${result.created} · 갱신 ${result.updated} · 신호 ${result.signalCount}`,
        };
    } catch (error) {
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "이탈 감지 중 오류가 발생했습니다.",
        };
    }
}