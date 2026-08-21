/**
 * `/teacher/messages` 교사 쪽지.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `sendMessage` 권한 → 없으면 빈 MessagesScreen →
 * 있으면 staff-scope `getStaffMessagesData` → features `MessagesScreen`
 * (`mode=staff`).
 *
 * 방송은 승인 요청, 스코프 안은 즉시 발송. 직원 messages page와 Screen을 공유한다.
 */

import { requireRole } from "@/lib/auth-guard";
import { userHasPermission } from "@/lib/permission-guard";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";
import { getStaffMessagesData } from "@/features/messages/data";
import MessagesScreen from "@/features/messages/MessagesScreen";

export const dynamic = "force-dynamic";

/** 권한·스코프에 맞는 쪽지 Screen을 연다. */
export default async function StaffMessagesPage() {
    const session = await requireRole("TEACHER");
    const canCompose = await userHasPermission(session.user.id, "sendMessage");

    if (!canCompose) {
        return (
            <MessagesScreen
                mode="staff"
                canCompose={false}
                deniedMessage="쪽지 발송 권한이 없습니다. 원장에게 권한 부여를 요청하세요."
                students={[]}
                classes={[]}
                pending={[]}
                mine={[]}
            />
        );
    }

    const staffScope = await getStaffScope(session.user.id);
    const messagesData = await getStaffMessagesData({
        staffUserId: session.user.id,
        studentWhere: {
            status: "ENROLLED",
            ...studentScopeWhere(staffScope),
        },
        classWhere: {
            active: true,
            ...classScopeWhere(staffScope),
        },
    });

    return <MessagesScreen mode="staff" canCompose {...messagesData} />;
}
