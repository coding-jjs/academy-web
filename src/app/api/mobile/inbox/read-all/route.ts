/**
 * `POST /api/mobile/inbox/read-all`. 본인 미읽음 전부 읽음.
 *
 * 관련: `features/messages/inbox-read.ts`.
 */

import { markAllInboxMessagesRead } from "@/features/messages/inbox-read";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function POST(request: Request) {
    const auth = await requireMobileRole(request, "PARENT", "STUDENT");
    if (!auth.ok) return auth.response;

    const result = await markAllInboxMessagesRead({
        userId: auth.user.id,
        role: auth.user.role,
    });

    if (!result.ok) {
        return Response.json(
            { error: result.code, message: result.message },
            { status: 400 },
        );
    }

    return Response.json({ ok: true, message: result.message });
}
