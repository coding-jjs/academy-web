/**
 * `GET /api/mobile/parent/inbox`. 학부모 쪽지함.
 *
 * 웹 `/parent/inbox`와 같다. 읽음 쓰기는 `/api/mobile/inbox/...`.
 * PENDING_APPROVAL은 수신 행이 없어 이 목록에 안 나온다.
 *
 * 관련: `features/messages/inbox-data.ts`.
 */

import { getParentInboxData } from "@/features/messages/inbox-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const data = await getParentInboxData(auth.user.id);
    return Response.json(data);
}
