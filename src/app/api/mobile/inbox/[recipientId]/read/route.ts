/**
 * `POST /api/mobile/inbox/:recipientId/read`. 한 통 읽음.
 *
 * recipientId는 MessageRecipient.id. messageId가 아니다.
 * PARENT·STUDENT만. 본인 수신 행이 아니면 404.
 *
 * 관련: `features/messages/inbox-read.ts`.
 */

import { markInboxMessageRead } from "@/features/messages/inbox-read";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function POST(
    request: Request,
    context: { params: Promise<{ recipientId: string }> },
) {
    const auth = await requireMobileRole(request, "PARENT", "STUDENT");
    if (!auth.ok) return auth.response;

    const { recipientId } = await context.params;
    const result = await markInboxMessageRead({
        userId: auth.user.id,
        role: auth.user.role,
        recipientId,
    });

    if (!result.ok) {
        const status = result.code === "INVALID_INPUT" ? 400 : 404;
        return Response.json(
            { error: result.code, message: result.message },
            { status },
        );
    }

    return Response.json({ ok: true, message: result.message });
}
