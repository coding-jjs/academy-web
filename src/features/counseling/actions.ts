"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";

export type CounselingActionState = {
    status: "idle" | "error" | "success";
    message: string;
};

async function requireStaff() {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF")
    ) {
        return null;
    }
    return session;
}

export async function createCounselingMemo(
    _prev: CounselingActionState,
    formData: FormData,
): Promise<CounselingActionState> {
    const session = await requireStaff();
    if (!session) {
        return { status: "error", message: "직원 로그인이 필요합니다." };
    }

    const canEdit = await userHasPermission(
        session.user.id,
        "editLifeCounseling",
    );
    if (!canEdit) {
        return {
            status: "error",
            message:
                "생활 상담 기록 권한이 없습니다. 원장에게 권한 부여를 요청하세요.",
        };
    }

    const studentId = String(formData.get("studentId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const counseledAtRaw = String(formData.get("counseledAt") ?? "").trim();

    if (!studentId) {
        return { status: "error", message: "학생을 선택해 주세요." };
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

    const scope = await getStaffScope(session.user.id);

    const student = await prisma.student.findFirst({
        where: {
            id: studentId,
            status: "ENROLLED",
            ...studentScopeWhere(scope),
        },
        select: { id: true },
    });

    if (!student) {
        return {
            status: "error",
            message: "상담 가능한 학생을 찾을 수 없습니다.",
        };
    }

    try {
        await prisma.counselingMemo.create({
            data: {
                studentId,
                authorUserId: session.user.id,
                content,
                counseledAt,
            },
        });
        revalidatePath("/staff/counseling");
        return { status: "success", message: "상담 기록이 등록되었습니다." };
    } catch {
        return { status: "error", message: "상담 등록에 실패했습니다." };
    }
}

export async function updateInquiryStatus(
    _prev: CounselingActionState,
    formData: FormData,
): Promise<CounselingActionState> {
    const session = await requireStaff();
    if (!session || session.user.role !== "STAFF") {
        return {
            status: "error",
            message: "사무 권한이 필요합니다.",
        };
    }

    const inquiryId = String(formData.get("inquiryId") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const allowed = ["NEW", "IN_PROGRESS", "DONE", "SPAM"] as const;

    if (!inquiryId || !(allowed as readonly string[]).includes(status)) {
        return {
            status: "error",
            message: "문의 상태 값이 올바르지 않습니다.",
        };
    }

    try {
        await prisma.inquiry.update({
            where: { id: inquiryId },
            data: {
                status: status as (typeof allowed)[number],
                assignedUserId: session.user.id,
            },
        });
        revalidatePath("/staff/counseling");
        return { status: "success", message: "문의 상태가 변경되었습니다." };
    } catch {
        return { status: "error", message: "문의 상태 변경에 실패했습니다." };
    }
}
