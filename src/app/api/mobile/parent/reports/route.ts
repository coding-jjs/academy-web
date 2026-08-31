/**
 * `GET /api/mobile/parent/reports`. 발송된 학습 리포트.
 *
 * SENT만. 초안·승인 대기는 웹과 같이 숨긴다. 학생 앱에는 이 주소가 없다.
 *
 * 관련: `features/reports/parent-data.ts`.
 */

import { getParentReportChildren } from "@/features/reports/parent-data";
import { requireMobileRole } from "@/lib/mobile-auth";

export async function GET(request: Request) {
    const auth = await requireMobileRole(request, "PARENT");
    if (!auth.ok) return auth.response;

    const children = await getParentReportChildren(auth.user.id);
    return Response.json({ children });
}
