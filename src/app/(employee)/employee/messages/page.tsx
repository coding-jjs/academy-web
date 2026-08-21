/**
 * `/employee/messages` 직원 쪽지.
 *
 * 연 사람: STAFF. layout 가드 + page `requireRole("STAFF")`.
 * 흐름: 교사 messages page와 같다 — `sendMessage` 권한 →
 * `getStaffMessagesData` → features `MessagesScreen` (`mode=staff`).
 *
 * 교사 Screen 파일을 import하지 않는다. 권한이 없으면 빈 화면+안내만.
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

/** 직원 권한·스코프로 쪽지 Screen을 연다. */
export default async function EmployeeMessagesPage() {
    const session = await requireRole("STAFF");
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
