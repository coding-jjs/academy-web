"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AbsenceState = {
    status: "idle" | "error" | "success";
    message: string;
};

export async function requestAbsence(
    _prev: AbsenceState,
    formData: FormData,
): Promise<AbsenceState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARENT") {
        return { status: "error", message: "학부모 로그인이 필요합니다." };
    }

    const studentId = String(formData.get("studentId") ?? "").trim();
    const sessionId = String(formData.get("sessionId") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();

    if (!studentId || !sessionId) {
        return { status: "error", message: "수업 일정을 선택해 주세요." };
    }
    if (reason.length < 2 || reason.length > 300) {
        return { status: "error", message: "사유는 2~300자로 입력해 주세요." };
    }

    const link = await prisma.parentStudentLink.findFirst({
        where: {
            parentUserId: session.user.id,
            studentId,
            endedAt: null,
        },
        select: { id: true },
    });
    if (!link) {
        return { status: "error", message: "연결된 자녀가 아닙니다." };
    }

    const classSession = await prisma.classSession.findFirst({
        where: {
            id: sessionId,
            startsAt: { gte: new Date() },
            status: "SCHEDULED",
            class: {
                enrollments: {
                    some: {
                        studentId,
                        status: "ACTIVE",
                        endedAt: null,
                    },
                },
            },
        },
        select: { id: true },
    });
    if (!classSession) {
        return {
            status: "error",
            message: "신청 가능한 예정 수업을 찾을 수 없습니다.",
        };
    }

    try {
        await prisma.absenceRequest.upsert({
            where: {
                studentId_sessionId: { studentId, sessionId },
            },
            create: {
                studentId,
                sessionId,
                requestedBy: session.user.id,
                reason,
            },
            update: {
                reason,
                requestedBy: session.user.id,
                cancelledAt: null,
            },
        });

        revalidatePath("/parent/attendance");
        return {
            status: "success",
            message: "사유 결석이 접수되었습니다. 담당 교사가 승인하면 공결로 반영됩니다.",
        };
    } catch {
        return { status: "error", message: "신청에 실패했습니다." };
    }
}