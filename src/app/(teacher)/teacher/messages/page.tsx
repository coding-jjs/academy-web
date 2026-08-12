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
