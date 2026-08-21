/**
 * `/teacher/students` 담당 재원생.
 *
 * 연 사람: TEACHER. layout 가드 + page `requireRole("TEACHER")`.
 * 흐름: requireRole → `getStaffScope` → `getStaffStudentsData`(staff-data) →
 * `StaffStudentsScreen`.
 *
 * 직원 `/employee/students`가 같은 Screen을 재사용한다. 상태 전이는 원장만.
 */

import { requireRole } from "@/lib/auth-guard"; // 교사만. 직원 page가 같은 Screen을 재사용한다.
import { getKstRecentRange } from "@/lib/date-kst"; // 최근 14일 출석.
import { // 담당 반·학생 where. 원장 명단이 아니다.
    classScopeWhere, // 담당 활성 반.
    getStaffScope, // 교사 스코프.
    studentScopeWhere, // 담당 재원생.
} from "@/lib/staff-scope"; // 상태 전이는 원장만.
import { getStaffStudentsData } from "@/features/students/staff-data"; // 스코프 안 학생·반 + 최근 출석.
import StaffStudentsScreen from "./StaffStudentsScreen"; // /employee/students 가 재사용. 원장 Screen이 아니다.

export const dynamic = "force-dynamic"; // 재원생·최근 출석이 캐시에 안 남게.

/** 스코프 안 재원생을 교사/직원 공용 Screen에 넘긴다. */
export default async function StaffStudentsPage() { // proxy→layout→page. 상태 전이는 원장만.
    const session = await requireRole("TEACHER"); // 교사만. 직원 page가 같은 Screen을 재사용한다.
    const staffScope = await getStaffScope(session.user.id); // 담당 재원생. 상태 전이는 원장만.
    const { startRecent } = getKstRecentRange(14); // 최근 14일 출석.
    const studentsData = await getStaffStudentsData({ // 스코프 안 학생·반 + 최근 출석.
        studentWhere: { // ENROLLED만. 원장 명단이 아니다.
            status: "ENROLLED", // 재원만. 퇴원·대기는 원장 명단.
            ...studentScopeWhere(staffScope), // 담당 학생. viewAll이면 전체.
        }, // 객체/호출 끝.
        classWhere: { // 담당 활성 반만.
            active: true, // 비활성 반은 빼다.
            ...classScopeWhere(staffScope), // 담당 반.
        }, // 객체/호출 끝.
        recentAttendanceStart: startRecent, // 최근 14일. 전체 출석 이력이 아니다.
    }); // 객체/호출 끝.

    return ( // 교사/직원 공용 Screen. 상태 전이는 원장만.
        <StaffStudentsScreen // /employee/students 가 재사용. 원장 Screen이 아니다.
            viewAllStudents={staffScope.viewAllStudents} // 전체 보기 플래그. 원장 권한 키가 아니다.
            {...studentsData} // 스코프 안 학생·반.
        /> // StaffStudentsScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
