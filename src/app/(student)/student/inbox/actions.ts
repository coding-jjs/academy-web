"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type InboxActionState = {
    status: "idle" | "error" | "success";
    message: string;
};

export async function markMessageRead(
    _prev: InboxActionState,
    formData: FormData,
): Promise<InboxActionState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
        return { status: "error", message: "학생 로그인이 필요합니다." };
    }

    const recipientId = String(formData.get("recipientId") ?? "").trim();
    if (!recipientId) {
        return { status: "error", message: "쪽지를 선택해 주세요." };
    }

    const row = await prisma.messageRecipient.findFirst({
        where: {
            id: recipientId,
            recipientUserId: session.user.id,
        },
        select: { id: true, readAt: true },
    });

    if (!row) {
        return { status: "error", message: "쪽지를 찾을 수 없습니다." };
    }

    if (!row.readAt) {
        await prisma.messageRecipient.update({
            where: { id: row.id },
            data: { readAt: new Date() },
        });
    }

    revalidatePath("/student/inbox");
    revalidatePath("/student/dashboard");
    return { status: "success", message: "읽음 처리되었습니다." };
}

export async function markAllMessagesRead(): Promise<InboxActionState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
        return { status: "error", message: "학생 로그인이 필요합니다." };
    }

    await prisma.messageRecipient.updateMany({
        where: {
            recipientUserId: session.user.id,
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    revalidatePath("/student/inbox");
    revalidatePath("/student/dashboard");
    return { status: "success", message: "모두 읽음 처리되었습니다." };
}