"use server";

/**
 * 직원·원장 상담 메모 작성과 문의 상태 변경.
 *
 * 호출: `CounselingMemoPanel`이 createCounselingMemo,
 * `DirectorStudentCounseling`이 createDirectorCounselingMemo,
 * `InquiryManagementPanel`이 updateInquiryStatus를 제출한다.
 *
 * 직원은 editLifeCounseling과 스코프 안 재원생만, 원장은 전 학생에 메모를 남긴다.
 * 문의 상태 변경은 STAFF만 — 교사는 상담 메모만 작성한다.
 *
 * 의도적으로 하지 않는 일:
 * - 게스트 문의 생성 → `inquiries/actions.ts`.
 * - 메모 수정·삭제. 추가만 한다.
 *
 * 관련: `staff-data.ts`, `director-data.ts`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";

/** `useActionState`가 매 제출마다 주고받는 UI 상태. idle은 초기값이며 이 파일은 직접 반환하지 않는다. */
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

function parseCounselingMemoInput(formData: FormData): {
    studentId: string;
    content: string;
    counseledAt: Date;
} | { error: string } {
    const studentId = String(formData.get("studentId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const counseledAtRaw = String(formData.get("counseledAt") ?? "").trim();

    if (!studentId) {
        return { error: "학생을 선택해 주세요." };
    }
    if (content.length < 2 || content.length > 2000) {
        return { error: "상담 내용은 2~2000자로 입력해 주세요." };
    }

    const counseledAt = counseledAtRaw ? new Date(counseledAtRaw) : new Date();
    if (Number.isNaN(counseledAt.getTime())) {
        return { error: "상담 일시가 올바르지 않습니다." };
    }
    if (counseledAt.getTime() > Date.now() + 60_000) {
        return { error: "미래 일시로는 등록할 수 없습니다." };
    }

    return { studentId, content, counseledAt };
}

/**
 * 교사·직원이 스코프 안 재원생에게 상담 메모를 남긴다.
 * editLifeCounseling이 없으면 거절한다. 원장 전용 액션과 경로를 나눈다.
 */
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

    const parsed = parseCounselingMemoInput(formData);
    if ("error" in parsed) {
        return { status: "error", message: parsed.error };
    }

    const { studentId, content, counseledAt } = parsed;
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
        revalidatePath("/teacher/counseling");
        revalidatePath("/employee/counseling");
        return { status: "success", message: "상담 기록이 등록되었습니다." };
    } catch {
        return { status: "error", message: "상담 등록에 실패했습니다." };
    }
}

/**
 * 원장이 학생 관리 화면에서 상담 메모를 남긴다.
 * 스코프·editLifeCounseling을 보지 않고, 재원 여부와 관계없이 학생 id만 확인한다.
 */
export async function createDirectorCounselingMemo(
    _prev: CounselingActionState,
    formData: FormData,
): Promise<CounselingActionState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return { status: "error", message: "원장 권한이 필요합니다." };
    }

    const parsed = parseCounselingMemoInput(formData);
    if ("error" in parsed) {
        return { status: "error", message: parsed.error };
    }

    const { studentId, content, counseledAt } = parsed;

    const student = await prisma.student.findFirst({
        where: { id: studentId },
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
        revalidatePath("/director/students");
        revalidatePath("/teacher/counseling");
        revalidatePath("/employee/counseling");
        return { status: "success", message: "상담 기록이 등록되었습니다." };
    } catch {
        return { status: "error", message: "상담 등록에 실패했습니다." };
    }
}

/**
 * 사무(STAFF)가 게스트 입학 문의 상태를 바꾼다.
 * 교사(TEACHER)는 거절한다 — 문의 큐는 직원 상담 화면에만 연다.
 * 상태를 바꾼 사람을 assignedUserId에 남겨 담당자를 추적한다.
 */
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
        revalidatePath("/teacher/counseling");
        revalidatePath("/employee/counseling");
        return { status: "success", message: "문의 상태가 변경되었습니다." };
    } catch {
        return { status: "error", message: "문의 상태 변경에 실패했습니다." };
    }
}
