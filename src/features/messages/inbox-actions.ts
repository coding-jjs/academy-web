"use server";

import { auth } from "@/lib/auth";
import {
    markAllInboxMessagesRead,
    markInboxMessageRead,
} from "@/features/messages/inbox-read";

export type InboxActionState = {
    status: "idle" | "error" | "success";
    message: string;
};

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

    const result = await markInboxMessageRead({
        userId: session.user.id,
        role: session.user.role,
        recipientId: String(formData.get("recipientId") ?? ""),
    });

    if (!result.ok) {
        return { status: "error", message: result.message };
    }
    return { status: "success", message: result.message };
}

export async function markAllMessagesRead(): Promise<InboxActionState> {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "PARENT" && session.user.role !== "STUDENT")
    ) {
        return { status: "error", message: "로그인이 필요합니다." };
    }

    const result = await markAllInboxMessagesRead({
        userId: session.user.id,
        role: session.user.role,
    });

    if (!result.ok) {
        return { status: "error", message: result.message };
    }
    return { status: "success", message: result.message };
}
