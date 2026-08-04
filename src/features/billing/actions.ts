"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";

export type BillingActionResult =
    | { ok: true; message: string; invoiceId?: string }
    | { ok: false; message: string };

type Actor =
    | { kind: "director"; userId: string }
    | { kind: "staff"; userId: string };

async function requireBillingActor(): Promise<
    Actor | { error: string }
> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." };
    }

    const role = session.user.role;
    const userId = session.user.id;

    if (role === "DIRECTOR") {
        return { kind: "director", userId };
    }

    if (role === "STAFF" || role === "TEACHER") {
        const allowed = await userHasPermission(userId, "billing");
        if (!allowed) {
            return {
                error: "결제/청구 관리 권한이 없습니다. 원장에게 권한 부여를 요청하세요.",
            };
        }
        return { kind: "staff", userId };
    }

    return { error: "청구 관리 권한이 없습니다." };
}

function parseDateOnly(value: string): Date | null {
    const trimmed = String(value ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

async function assertCanAccessStudent(
    actor: Actor,
    studentId: string,
): Promise<string | null> {
    if (actor.kind === "director") {
        const student = await prisma.student.findFirst({
            where: { id: studentId },
            select: { id: true },
        });
        return student ? null : "학생을 찾을 수 없습니다.";
    }

    const scope = await getStaffScope(actor.userId);
    const student = await prisma.student.findFirst({
        where: {
            id: studentId,
            ...studentScopeWhere(scope),
        },
        select: { id: true },
    });

    return student
        ? null
        : scope.viewAllStudents
          ? "학생을 찾을 수 없습니다."
          : "담당 반 학생만 청구할 수 있습니다.";
}

async function resolveActiveParentUserId(
    studentId: string,
): Promise<string | null> {
    const link = await prisma.parentStudentLink.findFirst({
        where: {
            studentId,
            endedAt: null,
        },
        orderBy: { linkedAt: "desc" },
        select: { parentUserId: true },
    });
    return link?.parentUserId ?? null;
}

function revalidateBilling() {
    revalidatePath("/director/billing");
    revalidatePath("/staff/billing");
    revalidatePath("/parent/payments");
    revalidatePath("/director/dashboard");
}

export async function createInvoice(input: {
    studentId: string;
    title: string;
    itemName: string;
    amount: number;
    dueDate: string;
    issueNow: boolean;
}): Promise<BillingActionResult> {
    const actorOrError = await requireBillingActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const studentId = String(input.studentId ?? "").trim();
    const title = String(input.title ?? "").trim();
    const itemName = String(input.itemName ?? "").trim() || title;
    const amount = Number(input.amount);
    const dueDate = parseDateOnly(input.dueDate);

    if (!studentId) {
        return { ok: false, message: "학생을 선택해 주세요." };
    }
    if (!title || title.length > 120) {
        return { ok: false, message: "제목을 1~120자로 입력해 주세요." };
    }
    if (!Number.isInteger(amount) || amount <= 0) {
        return { ok: false, message: "금액은 1원 이상 정수여야 합니다." };
    }
    if (!dueDate) {
        return { ok: false, message: "납기일 형식이 올바르지 않습니다." };
    }

    const accessError = await assertCanAccessStudent(actor, studentId);
    if (accessError) {
        return { ok: false, message: accessError };
    }

    const parentUserId = await resolveActiveParentUserId(studentId);
    if (!parentUserId) {
        return {
            ok: false,
            message:
                "연결된 학부모가 없습니다. 원장 화면에서 학부모–학생을 먼저 연결하세요.",
        };
    }

    const issueNow = Boolean(input.issueNow);
    const invoice = await prisma.invoice.create({
        data: {
            studentId,
            parentUserId,
            title,
            items: [{ name: itemName, amount }],
            totalAmount: amount,
            dueDate,
            status: issueNow ? "ISSUED" : "DRAFT",
            issuedAt: issueNow ? new Date() : null,
        },
        select: { id: true },
    });

    revalidateBilling();

    return {
        ok: true,
        invoiceId: invoice.id,
        message: issueNow
            ? "청구서를 발행했습니다. 학부모 결제 화면에 표시됩니다."
            : "청구서 초안을 저장했습니다.",
    };
}

export async function issueInvoice(input: {
    invoiceId: string;
}): Promise<BillingActionResult> {
    const actorOrError = await requireBillingActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const invoiceId = String(input.invoiceId ?? "").trim();
    if (!invoiceId) {
        return { ok: false, message: "청구서 ID가 없습니다." };
    }

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
            id: true,
            status: true,
            studentId: true,
        },
    });

    if (!invoice) {
        return { ok: false, message: "청구서를 찾을 수 없습니다." };
    }

    const accessError = await assertCanAccessStudent(actor, invoice.studentId);
    if (accessError) {
        return { ok: false, message: accessError };
    }

    if (invoice.status !== "DRAFT") {
        return { ok: false, message: "초안 상태의 청구서만 발행할 수 있습니다." };
    }

    await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
            status: "ISSUED",
            issuedAt: new Date(),
        },
    });

    revalidateBilling();
    return { ok: true, message: "청구서를 발행했습니다." };
}

export async function cancelInvoice(input: {
    invoiceId: string;
}): Promise<BillingActionResult> {
    const actorOrError = await requireBillingActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const invoiceId = String(input.invoiceId ?? "").trim();
    if (!invoiceId) {
        return { ok: false, message: "청구서 ID가 없습니다." };
    }

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
            id: true,
            status: true,
            studentId: true,
        },
    });

    if (!invoice) {
        return { ok: false, message: "청구서를 찾을 수 없습니다." };
    }

    const accessError = await assertCanAccessStudent(actor, invoice.studentId);
    if (accessError) {
        return { ok: false, message: accessError };
    }

    if (
        invoice.status !== "DRAFT" &&
        invoice.status !== "ISSUED" &&
        invoice.status !== "OVERDUE"
    ) {
        return {
            ok: false,
            message: "초안·발행·연체 상태만 취소할 수 있습니다.",
        };
    }

    await prisma.$transaction([
        prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: "CANCELLED" },
        }),
        prisma.payment.updateMany({
            where: {
                invoiceId: invoice.id,
                status: "PENDING",
            },
            data: {
                status: "CANCELLED",
                failureCode: "INVOICE_CANCELLED",
                failureMessage: "청구서가 취소되어 결제가 무효화되었습니다.",
                cancelledAt: new Date(),
            },
        }),
    ]);

    revalidateBilling();
    return { ok: true, message: "청구서를 취소했습니다." };
}
