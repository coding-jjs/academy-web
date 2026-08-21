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

import { requireRole } from "@/lib/auth-guard"; // 교사만.
import { userHasPermission } from "@/lib/permission-guard"; // sendMessage 없으면 빈 Screen+안내.
import { // 담당 반·학생 where.
    classScopeWhere, // 담당 활성 반. 방송은 승인 요청.
    getStaffScope, // 교사 스코프.
    studentScopeWhere, // 담당 재원생.
} from "@/lib/staff-scope"; // 원장 방송 큐가 아니다.
import { getStaffMessagesData } from "@/features/messages/data"; // 스코프 안 학생·반 + 내 쪽지.
import MessagesScreen from "@/features/messages/MessagesScreen"; // features Screen. 직원 page와 Screen을 공유한다.

export const dynamic = "force-dynamic"; // 쪽지·권한이 캐시에 안 남게.

/** 권한·스코프에 맞는 쪽지 Screen을 연다. */
export default async function StaffMessagesPage() { // proxy→layout→page. 직원 messages와 Screen 공유.
    const session = await requireRole("TEACHER"); // 교사만.
    const canCompose = await userHasPermission(session.user.id, "sendMessage"); // sendMessage 없으면 빈 Screen+안내.

    if (!canCompose) { // 권한 없음. 데이터 로더를 타지 않는다.
        return ( // 빈 목록. 직원 page와 같은 features Screen.
            <MessagesScreen // mode=staff. 교사 Screen 파일이 아니다.
                mode="staff" // 원장 승인 큐 모드가 아니다.
                canCompose={false} // 작성 불가.
                deniedMessage="쪽지 발송 권한이 없습니다. 원장에게 권한 부여를 요청하세요." // 안내. 원장 permissions.
                students={[]} // 빈 수신자.
                classes={[]} // 빈 반.
                pending={[]} // 빈 승인 대기.
                mine={[]} // 빈 내 쪽지.
            /> // 빈 MessagesScreen 끝.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    const staffScope = await getStaffScope(session.user.id); // 담당 반·학생.
    const messagesData = await getStaffMessagesData({ // 스코프 안 학생·반 + 내 쪽지.
        staffUserId: session.user.id, // 내 쪽지 필터.
        studentWhere: { // ENROLLED만. 원장 방송 큐가 아니다.
            status: "ENROLLED", // 재원만.
            ...studentScopeWhere(staffScope), // 담당 학생.
        }, // 객체/호출 끝.
        classWhere: { // 담당 활성 반. 방송은 승인 요청.
            active: true, // 비활성 반 제외.
            ...classScopeWhere(staffScope), // 담당 반.
        }, // 객체/호출 끝.
    }); // 객체/호출 끝.

    return <MessagesScreen mode="staff" canCompose {...messagesData} />; // features MessagesScreen. 직원 page와 Screen을 공유한다.
} // 블록 끝.
