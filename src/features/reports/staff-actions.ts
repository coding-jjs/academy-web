"use server";

/**
 * 교사·직원이 담당 범위 학생의 리포트 초안을 저장·재생성하고 승인을 요청한다.
 *
 * 호출: `(teacher)/teacher/reports/components/ReportEditor.tsx`.
 * writeAiReport 권한과 스태프 스코프를 확인한 뒤, 편집 가능 상태만 DRAFTING으로 올리고
 * PENDING_APPROVAL로 넘긴다. AI 초안은 Gemini 없으면 템플릿(`draft-generator`).
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 발송 → 원장 `approveAndSendReport` (Message SENT).
 * - 근거 조회는 `evidence.ts`만. `evidence 2.ts`는 쓰지 않는다.
 *
 * 관련: `draft-generator.ts`, `staff-scope`, `userHasPermission`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";
import { createReportDraft } from "@/features/reports/draft-generator";
import {
    formatEvidenceSummary,
    getReportEvidence,
} from "@/features/reports/evidence";

type ActionResult =
    | {
          ok: true;
          reportId?: string;
          content?: string;
          message?: string;
          evidenceSummary?: string;
      }
    | { ok: false; message: string };

type StaffSession = {
    user: { id: string; role: string; name?: string | null };
};

/** TEACHER 또는 STAFF만. 원장은 이 액션이 아니라 승인 큐를 쓴다. */
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

/** `writeAiReport` 권한이 없으면 저장·재생성·승인요청을 모두 막는다. */
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

/** 스코프 밖 학생은 작성 불가. viewAllStudents면 "없음", 아니면 담당반 안내. */
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

/**
 * 편집 가능 행을 갱신하거나, forceNew면 새 DRAFTING 행을 만든다.
 * PENDING_APPROVAL·SENT는 덮지 않아 승인 큐·발송본을 보호한다.
 */
async function upsertDraft(params: {
    session: StaffSession;
    studentId: string;
    content: string;
    keywords: string[];
    periodStart: Date;
    periodEnd: Date;
    forceNew?: boolean;
    reportId?: string;
}) {
    if (params.reportId && !params.forceNew) {
        const existing = await prisma.aiReport.findFirst({
            where: {
                id: params.reportId,
                studentId: params.studentId,
                status: { in: ["UNWRITTEN", "DRAFTING", "REJECTED"] },
            },
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
    }

    if (!params.forceNew) {
        const existing = await prisma.aiReport.findFirst({
            where: {
                studentId: params.studentId,
                status: { in: ["UNWRITTEN", "DRAFTING", "REJECTED"] },
            },
            orderBy: { updatedAt: "desc" },
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

/**
 * 교사 입력 본문을 DRAFTING으로 저장한다. AI를 호출하지 않는다.
 */
export async function saveDraftReport(input: {
    studentId: string;
    content: string;
    keywords: string[];
    periodStart: string;
    periodEnd: string;
    forceNew?: boolean;
    reportId?: string;
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
    const reportId = String(input.reportId ?? "").trim() || undefined;

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
        forceNew: Boolean(input.forceNew),
        reportId,
    });

    revalidatePath("/teacher/reports");
    revalidatePath("/director/reports");

    return {
        ok: true,
        reportId: report.id,
        message: input.forceNew
            ? "새 기간 초안을 저장했습니다."
            : "초안을 저장했습니다.",
    };
}

/**
 * 근거를 모아 초안을 만든다. Gemini가 있으면 AI, 없으면 템플릿(`createReportDraft`).
 */
export async function regenerateDraftWithAi(input: {
    studentId: string;
    keywords: string[];
    tone: string;
    periodStart: string;
    periodEnd: string;
    forceNew?: boolean;
    reportId?: string;
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
    if (periodEnd < periodStart) {
        return { ok: false, message: "종료일이 시작일보다 빠를 수 없습니다." };
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

    const evidence = await getReportEvidence({
        studentId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
    });
    const evidenceSummary = formatEvidenceSummary(evidence);

    const draft = await createReportDraft({
        studentName: student.name,
        keywords,
        tone,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        evidence,
    });

    const report = await upsertDraft({
        session,
        studentId,
        content: draft.content,
        keywords,
        periodStart,
        periodEnd,
        forceNew: Boolean(input.forceNew),
        reportId: String(input.reportId ?? "").trim() || undefined,
    });

    revalidatePath("/teacher/reports");
    revalidatePath("/director/reports");

    const verb = input.forceNew ? "신규 초안을 만들었습니다" : "AI 초안을 생성했습니다";

    if (draft.usedAi) {
        return {
            ok: true,
            reportId: report.id,
            content: draft.content,
            evidenceSummary,
            message: `${verb}. (근거: ${evidenceSummary})`,
        };
    }

    return {
        ok: true,
        reportId: report.id,
        content: draft.content,
        evidenceSummary,
        message: draft.fallbackReason
            ? `템플릿 초안을 사용했습니다. (${draft.fallbackReason} · 근거: ${evidenceSummary})`
            : `템플릿 초안을 사용했습니다. (근거: ${evidenceSummary})`,
    };
}

/**
 * DRAFTING·REJECTED 초안을 PENDING_APPROVAL로 올려 원장 큐에 넣는다.
 * 발송(SENT)은 하지 않는다. 원장 승인 액션이 Message를 만든다.
 */
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

    revalidatePath("/teacher/reports");
    revalidatePath("/director/reports");

    return { ok: true, message: "승인 요청을 보냈습니다." };
}
