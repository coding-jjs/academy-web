import "server-only";

/**
 * 학부모·학생 인박스 읽음 처리의 실제 쓰기. 인증은 호출 측이 한다.
 *
 * 호출:
 * - `inbox-actions.ts` (웹 폼, 쿠키 세션)
 * - `app/api/mobile/inbox/...` (앱 Bearer)
 *
 * MessageRecipient를 본인 userId로만 갱신한다. 타 수신자 행은 건드리지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 쪽지 본문 삭제. 읽음 시각만 찍는다.
 * - PARENT/STUDENT 역할 검사. Action·API 가드가 한다.
 *
 * 관련: `inbox-data.ts`, `inbox-actions.ts`.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export type InboxReadResult =
    | { ok: true; message: string }
    | {
          ok: false;
          code: "INVALID_INPUT" | "NOT_FOUND";
          message: string;
      };

/**
 * 한 통을 읽음 처리한다. 이미 읽은 행은 그대로 성공으로 둔다.
 *
 * @param recipientId MessageRecipient.id. messageId가 아니다.
 * @auth 역할을 보지 않는다. recipientUserId = userId만 본다.
 */
export async function markInboxMessageRead(input: {
    userId: string;
    role: "PARENT" | "STUDENT";
    recipientId: string;
}): Promise<InboxReadResult> {
    const recipientId = input.recipientId.trim();
    if (!recipientId) {
        return {
            ok: false,
            code: "INVALID_INPUT",
            message: "쪽지를 선택해 주세요.",
        };
    }

    const row = await prisma.messageRecipient.findFirst({
        where: {
            id: recipientId,
            recipientUserId: input.userId,
        },
        select: { id: true, readAt: true },
    });
    if (!row) {
        return {
            ok: false,
            code: "NOT_FOUND",
            message: "쪽지를 찾을 수 없습니다.",
        };
    }

    if (!row.readAt) {
        await prisma.messageRecipient.update({
            where: { id: row.id },
            data: { readAt: new Date() },
        });
    }

    revalidateInbox(input.role);
    return { ok: true, message: "읽음 처리되었습니다." };
}

/**
 * 본인 미읽음 수신 행을 모두 읽음 처리한다.
 */
export async function markAllInboxMessagesRead(input: {
    userId: string;
    role: "PARENT" | "STUDENT";
}): Promise<InboxReadResult> {
    await prisma.messageRecipient.updateMany({
        where: {
            recipientUserId: input.userId,
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    revalidateInbox(input.role);
    return { ok: true, message: "모두 읽음 처리되었습니다." };
}

function revalidateInbox(role: "PARENT" | "STUDENT") {
    const prefix = role === "PARENT" ? "/parent" : "/student";
    revalidatePath(`${prefix}/inbox`);
    revalidatePath(`${prefix}/dashboard`);
}
