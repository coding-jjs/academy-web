/**
 * `/employee/students` 직원 원생 라우트.
 *
 * 연 사람: STAFF. layout 가드 + page `requireRole("STAFF")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffStudentsData` →
 * 교사 `StaffStudentsScreen` 재사용.
 *
 * UI는 교사와 같고 조회 범위만 staff-scope로 바뀐다.
 * 원생 상태 전이는 원장 `/director/students` 몫이다.
 */

import { requireRole } from "@/lib/auth-guard"; // 직원만. 교사 Screen을 재사용한다.
import { getKstRecentRange } from "@/lib/date-kst"; // 최근 14일 출석.
import { // 직원 스코프 where. 상태 전이는 원장 몫.
    classScopeWhere, // 담당 활성 반만.
    getStaffScope, // 직원 스코프.
    studentScopeWhere, // 담당 재원생.
} from "@/lib/staff-scope"; // 원장 명단이 아니다.
import { getStaffStudentsData } from "@/features/students/staff-data"; // 직원 스코프 재원생. UI는 교사와 같고 where만 다르다.
import StaffStudentsScreen from "@/app/(teacher)/teacher/students/StaffStudentsScreen"; // /teacher/students 와 같은 Screen. 원장 Screen이 아니다.

export const dynamic = "force-dynamic"; // 재원생이 캐시에 안 남게.

/** 직원 스코프 재원생을 교사 Screen에 넘긴다. */
export default async function EmployeeStudentsPage() { // proxy→layout→page. 상태 전이는 원장 몫.
    const session = await requireRole("STAFF"); // 직원만. 교사 Screen을 재사용한다.
    const staffScope = await getStaffScope(session.user.id); // 직원 스코프. 상태 전이는 원장 몫.
    const { startRecent } = getKstRecentRange(14); // 최근 14일 출석.
    const studentsData = await getStaffStudentsData({ // 직원 스코프 재원생. UI는 교사와 같고 where만 다르다.
        studentWhere: { // ENROLLED만. 원장 명단·상태 전이가 아니다.
            status: "ENROLLED", // 재원만.
            ...studentScopeWhere(staffScope), // 담당 학생.
        }, // 객체/호출 끝.
        classWhere: { // 담당 활성 반만.
            active: true, // 비활성 반 제외.
            ...classScopeWhere(staffScope), // 담당 반.
        }, // 객체/호출 끝.
        recentAttendanceStart: startRecent, // 최근 14일.
    }); // 객체/호출 끝.

    return ( // 교사 StaffStudentsScreen 재사용. 상태 전이는 원장 몫.
        <StaffStudentsScreen // /teacher/students 와 같은 Screen. 원장 Screen이 아니다.
            viewAllStudents={staffScope.viewAllStudents} // 전체 보기 플래그.
            {...studentsData} // 스코프 안 학생·반.
        /> // StaffStudentsScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
