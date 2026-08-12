"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";
import { createReportDraft } from "@/features/reports/draft-generator";

type ActionResult =
    | { ok: true; reportId?: string; content?: string; message?: string }
    | { ok: false; message: string };

type StaffSession = {
    user: { id: string; role: string; name?: string | null };
};

async function requireStaffOrTeacher(): Promise<StaffSession | null> {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF")
    ) {
        return null;
    }
    return session as StaffSession;
}

async function requireWriteAiReport(
    session: StaffSession,
): Promise<string | null> {
    const allowed = await userHasPermission(session.user.id, "writeAiReport");
    if (!allowed) {
        return "AI 리포트 작성 권한이 없습니다. 원장에게 권한 부여를 요청하세요.";
    }
    return null;
}

function parseDateOnly(value: string, label: string): Date | null {
    const trimmed = String(value ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return null;
    }
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    void label;
    return date;
}

async function assertCanAccessStudent(
    session: StaffSession,
    studentId: string,
): Promise<string | null> {
    const scope = await getStaffScope(session.user.id);

    const student = await prisma.student.findFirst({
        where: {
            id: studentId,
            ...studentScopeWhere(scope),
        },
        select: { id: true },
    });

    if (!student) {
        return scope.viewAllStudents
            ? "학생을 찾을 수 없습니다."
            : "담당 반 학생만 작성할 수 있습니다.";
    }

    return null;
}

const EDITABLE = new Set(["UNWRITTEN", "DRAFTING", "REJECTED"]);

async function upsertDraft(params: {
    session: StaffSession;
    studentId: string;
    content: string;
    keywords: string[];
    periodStart: Date;
    periodEnd: Date;
}) {
    const existing = await prisma.aiReport.findFirst({
        where: {
            studentId: params.studentId,
            status: { in: ["UNWRITTEN", "DRAFTING", "REJECTED"] },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
    });

    if (existing && EDITABLE.has(existing.status)) {
        return prisma.aiReport.update({
            where: { id: existing.id },
            data: {
                authorUserId: params.session.user.id,
                content: params.content,
                keywords: params.keywords,
                periodStart: params.periodStart,
                periodEnd: params.periodEnd,
                status: "DRAFTING",
                rejectionReason: null,
            },
            select: { id: true },
        });
    }

    return prisma.aiReport.create({
        data: {
            studentId: params.studentId,
            authorUserId: params.session.user.id,
            content: params.content,
            keywords: params.keywords,
            periodStart: params.periodStart,
            periodEnd: params.periodEnd,
            status: "DRAFTING",
        },
        select: { id: true },
    });
}

export async function saveDraftReport(input: {
    studentId: string;
    content: string;
    keywords: string[];
    periodStart: string;
    periodEnd: string;
}): Promise<ActionResult> {
    const session = await requireStaffOrTeacher();
    if (!session) {
        return { ok: false, message: "직원 로그인이 필요합니다." };
    }

    const permError = await requireWriteAiReport(session);
    if (permError) {
        return { ok: false, message: permError };
    }

    const studentId = String(input.studentId ?? "").trim();
    const content = String(input.content ?? "").trim();
    const keywords = Array.isArray(input.keywords)
        ? input.keywords.map(String).filter(Boolean)
        : [];

    if (!studentId) {
        return { ok: false, message: "학생 정보가 없습니다." };
    }
    if (!content) {
        return { ok: false, message: "본문을 입력해 주세요." };
    }

    const periodStart = parseDateOnly(input.periodStart, "시작일");
    const periodEnd = parseDateOnly(input.periodEnd, "종료일");
    if (!periodStart || !periodEnd) {
        return { ok: false, message: "기간 형식이 올바르지 않습니다." };
    }
    if (periodEnd < periodStart) {
        return { ok: false, message: "종료일이 시작일보다 빠를 수 없습니다." };
    }

    const accessError = await assertCanAccessStudent(session, studentId);
    if (accessError) {
        return { ok: false, message: accessError };
    }

    const report = await upsertDraft({
        session,
        studentId,
        content,
        keywords,
        periodStart,
        periodEnd,
    });

    revalidatePath("/staff/reports");
    revalidatePath("/director/reports");

    return {
        ok: true,
        reportId: report.id,
        message: "초안을 저장했습니다.",
    };
}

export async function regenerateDraftWithAi(input: {
    studentId: string;
    keywords: string[];
    tone: string;
    periodStart: string;
    periodEnd: string;
}): Promise<ActionResult> {
    const session = await requireStaffOrTeacher();
    if (!session) {
        return { ok: false, message: "직원 로그인이 필요합니다." };
    }

    const permError = await requireWriteAiReport(session);
    if (permError) {
        return { ok: false, message: permError };
    }

    const studentId = String(input.studentId ?? "").trim();
    const keywords = Array.isArray(input.keywords)
        ? input.keywords.map(String).filter(Boolean)
        : [];
    const tone = String(input.tone ?? "격려·칭찬").trim() || "격려·칭찬";

    if (!studentId) {
        return { ok: false, message: "학생 정보가 없습니다." };
    }

    const periodStart = parseDateOnly(input.periodStart, "시작일");
    const periodEnd = parseDateOnly(input.periodEnd, "종료일");
    if (!periodStart || !periodEnd) {
        return { ok: false, message: "기간 형식이 올바르지 않습니다." };
    }

    const accessError = await assertCanAccessStudent(session, studentId);
    if (accessError) {
        return { ok: false, message: accessError };
    }

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { name: true },
    });

    if (!student) {
        return { ok: false, message: "학생을 찾을 수 없습니다." };
    }

    const draft = await createReportDraft({
        studentName: student.name,
        keywords,
        tone,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
    });

    const report = await upsertDraft({
        session,
        studentId,
        content: draft.content,
        keywords,
        periodStart,
        periodEnd,
    });

    revalidatePath("/staff/reports");
    revalidatePath("/director/reports");

    if (draft.usedAi) {
        return {
            ok: true,
            reportId: report.id,
            content: draft.content,
            message: "AI 초안을 생성했습니다.",
        };
    }

    return {
        ok: true,
        reportId: report.id,
        content: draft.content,
        message: draft.fallbackReason
            ? `템플릿 초안을 사용했습니다. (${draft.fallbackReason})`
            : "템플릿 초안을 사용했습니다.",
    };
}

export async function requestReportApproval(input: {
    reportId: string;
}): Promise<ActionResult> {
    const session = await requireStaffOrTeacher();
    if (!session) {
        return { ok: false, message: "직원 로그인이 필요합니다." };
    }

    const permError = await requireWriteAiReport(session);
    if (permError) {
        return { ok: false, message: permError };
    }

    const reportId = String(input.reportId ?? "").trim();
    if (!reportId) {
        return { ok: false, message: "리포트 ID가 없습니다." };
    }

    const report = await prisma.aiReport.findUnique({
        where: { id: reportId },
        select: {
            id: true,
            status: true,
            content: true,
            studentId: true,
            authorUserId: true,
        },
    });

    if (!report) {
        return { ok: false, message: "리포트를 찾을 수 없습니다." };
    }

    const accessError = await assertCanAccessStudent(session, report.studentId);
    if (accessError) {
        return { ok: false, message: accessError };
    }

    if (!EDITABLE.has(report.status) && report.status !== "DRAFTING") {
        return {
            ok: false,
            message: "작성 중이거나 반려된 리포트만 승인 요청할 수 있습니다.",
        };
    }

    if (!report.content.trim()) {
        return {
            ok: false,
            message: "본문이 비어 있어 승인 요청할 수 없습니다.",
        };
    }

    await prisma.aiReport.update({
        where: { id: report.id },
        data: {
            status: "PENDING_APPROVAL",
            authorUserId: session.user.id,
            rejectionReason: null,
        },
    });

    revalidatePath("/staff/reports");
    revalidatePath("/director/reports");

    return { ok: true, message: "승인 요청을 보냈습니다." };
}
