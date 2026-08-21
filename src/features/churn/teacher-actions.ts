"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ChurnCareNoteState = {
    status: "idle" | "error" | "success";
    message: string;
};

export async function submitChurnCareNote(
    _prev: ChurnCareNoteState,
    formData: FormData,
): Promise<ChurnCareNoteState> {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF")
    ) {
        return { status: "error", message: "선생님 또는 직원 로그인이 필요합니다." };
    }

    const churnCaseId = String(formData.get("churnCaseId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const counseledAtRaw = String(formData.get("counseledAt") ?? "").trim();

    if (!churnCaseId) {
        return { status: "error", message: "이탈 케이스 ID가 없습니다." };
    }
    if (content.length < 2 || content.length > 2000) {
        return {
            status: "error",
            message: "상담 내용은 2~2000자로 입력해 주세요.",
        };
    }

    const counseledAt = counseledAtRaw ? new Date(counseledAtRaw) : new Date();
    if (Number.isNaN(counseledAt.getTime())) {
        return { status: "error", message: "상담 일시가 올바르지 않습니다." };
    }
    if (counseledAt.getTime() > Date.now() + 60_000) {
        return { status: "error", message: "미래 일시로는 등록할 수 없습니다." };
    }

    const row = await prisma.churnCase.findFirst({
        where: {
            id: churnCaseId,
            assignedUserId: session.user.id,
            status: "COUNSELING",
            student: { status: "ENROLLED" },
        },
        select: { id: true, studentId: true },
    });

    if (!row) {
        return {
            status: "error",
            message: "담당 중인 상담 건을 찾을 수 없습니다.",
        };
    }

    try {
        await prisma.$transaction([
            prisma.counselingMemo.create({
                data: {
                    studentId: row.studentId,
                    authorUserId: session.user.id,
                    churnCaseId: row.id,
                    content,
                    counseledAt,
                },
            }),
            prisma.churnCase.update({
                where: { id: row.id },
                data: {
                    status: "PENDING_REVIEW",
                    resolvedAt: null,
                },
            }),
        ]);
    } catch {
        return { status: "error", message: "상담 기록 저장에 실패했습니다." };
    }

    revalidatePath("/teacher/counseling");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/employee/counseling");
    revalidatePath("/employee/dashboard");
    revalidatePath("/director/churn");
    revalidatePath("/director/dashboard");
    revalidatePath("/director/students");

    return {
        status: "success",
        message: "상담을 기록하고 원장 검토를 요청했습니다.",
    };
}
