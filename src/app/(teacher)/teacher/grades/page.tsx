/**
 * `/teacher/grades` 교사 성적.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → 권한 키(`ownClassAttendanceGrade` /
 * `otherTeacherAttendanceGrade`) → 없으면 빈 Screen+안내 →
 * 있으면 staff-scope `getGradesManagementData` → features `GradesManagementScreen`.
 *
 * 원장 성적 page와 Screen을 공유하되 조회 범위를 담당 반으로 자른다.
 */

import { requireRole } from "@/lib/auth-guard"; // 교사만.
import { getKstDayRange } from "@/lib/date-kst"; // 오늘 KST. 이후 평가일은 막는다.
import { getGradesManagementData } from "@/features/grades/data"; // 스코프 안 성적·오답.
import { userHasPermission } from "@/lib/permission-guard"; // 담당/타반 성적 키. 둘 다 없으면 빈 Screen.
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope"; // 담당 반. 원장 page는 전체 ENROLLED.
import GradesManagementScreen from "@/features/grades/GradesManagementScreen"; // 원장 grades page와 같은 Screen. 범위만 담당 반.

export const dynamic = "force-dynamic"; // 성적·권한이 캐시에 안 남게.

/** 권한과 스코프를 반영한 성적 관리 Screen을 연다. */
export default async function StaffGradesPage() { // proxy→layout→page. 직원 성적 URL 없음.
    const session = await requireRole("TEACHER"); // 교사만.
    const { day: todayKst } = getKstDayRange(); // 오늘 KST. 이후 평가일은 막는다.

    const [canOwn, canOther] = await Promise.all([ // 담당/타반 성적 키. 둘 다 없으면 빈 Screen.
        userHasPermission(session.user.id, "ownClassAttendanceGrade"), // 담당 반 성적.
        userHasPermission(session.user.id, "otherTeacherAttendanceGrade"), // 타 교사 반 성적.
    ]); // 구문 끝.
    const canManage = canOwn || canOther; // 하나라도 있으면 편집. 원장 page는 무조건 canManage.

    if (!canManage) { // 권한 없음. 원장 성적 page와 Screen만 공유.
        return ( // 빈 목록+안내. 데이터 로더를 타지 않는다.
            <GradesManagementScreen // features Screen. 교사 전용 Screen 파일이 아니다.
                students={[]} // 빈 명단. 권한 없이 성적을 읽지 않는다.
                grades={[]} // 빈 성적.
                wrongNotes={[]} // 빈 오답.
                canManage={false} // 편집 불가.
                maxAssessedDate={todayKst} // 오늘 KST. 빈 Screen에도 같은 상한을 둔다.
                deniedMessage="성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요." // 안내. 원장 permissions.
            /> // 빈 GradesManagementScreen 끝.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    const scope = await getStaffScope(session.user.id); // 담당 반. 원장 page는 전체 ENROLLED.
    const studentWhere = { // 담당 반 재원생만.
        status: "ENROLLED" as const, // 재원만.
        ...studentScopeWhere(scope), // 담당 학생. viewAll이면 전체.
    }; // 블록 끝.

    const gradesData = await getGradesManagementData({ // 스코프 안 성적·오답.
        studentWhere, // 담당 재원생.
        gradeWhere: { student: studentWhere }, // 같은 범위의 성적만.
        wrongNoteWhere: { student: studentWhere }, // 같은 범위의 오답만.
    }); // 객체/호출 끝.

    return ( // 편집 가능. 오늘 이후 평가일은 maxAssessedDate.
        <GradesManagementScreen // 원장 grades page와 같은 Screen. 범위만 담당 반.
            {...gradesData} // 스코프 안 성적·오답.
            canManage // 권한 키가 있어서 편집.
            maxAssessedDate={todayKst} // 오늘 KST 이후 평가일은 막는다.
        /> // GradesManagementScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
