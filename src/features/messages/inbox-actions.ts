"use server";

/**
 * 학부모·학생 인박스 읽음 처리(단건·모두 읽음).
 *
 * 호출: ParentInboxScreen, StudentInboxScreen / StudentMessagesPanel.
 * MessageRecipient 행을 본인 id로만 갱신해 타 수신자의 읽음 상태를 바꾸지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 쪽지 본문 삭제. 읽음 시각만 찍는다.
 * - 원장/직원 작성 화면 캐시 무효화. 인박스·대시보드만 갱신한다.
 *
 * 관련: `inbox-data.ts`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** `useActionState`용 읽음 처리 결과. */
export type InboxActionState = {
    status: "idle" | "error" | "success";
    message: string;
};

/**
 * 한 통을 읽음 처리한다. recipientId는 수신 행 id이며 본인 것이 아니면 거절한다.
 */
export async function markMessageRead(
    _prev: InboxActionState,
    formData: FormData,
): Promise<InboxActionState> {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "PARENT" && session.user.role !== "STUDENT")
    ) {
        return { status: "error", message: "로그인이 필요합니다." };
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

    revalidateInbox(session.user.role);
    return { status: "success", message: "읽음 처리되었습니다." };
}

/**
 * 본인 미읽음 수신 행을 모두 읽음 처리한다.
 */
export async function markAllMessagesRead(): Promise<InboxActionState> {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "PARENT" && session.user.role !== "STUDENT")
    ) {
        return { status: "error", message: "로그인이 필요합니다." };
    }

    await prisma.messageRecipient.updateMany({
        where: {
            recipientUserId: session.user.id,
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    revalidateInbox(session.user.role);
    return { status: "success", message: "모두 읽음 처리되었습니다." };
}

function revalidateInbox(role: "PARENT" | "STUDENT") {
    const prefix = role === "PARENT" ? "/parent" : "/student";
    revalidatePath(`${prefix}/inbox`);
    revalidatePath(`${prefix}/dashboard`);
}
