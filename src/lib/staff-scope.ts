/**
 * 교사/직원이 볼 수 있는 학생·반 Prisma `where` 조각.
 * `viewAllStudents`가 아니면 담당 반 수강생만 붙여 타반 명단·성적이 새지 않게 한다.
 *
 * 호출: 교사/직원 페이지와 `features/{grades,counseling,messages}` data/actions.
 * 먼저 `getStaffScope`로 범위를 만들고, findMany `where`에 spread한다.
 *
 * 서버 전용 읽기. 권한 판정은 `userHasPermission`에 위임하고, 이 파일은 where만 만든다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 스코프는 만들지 않는다. 그 레이아웃은 본인·자녀 id로 직접 필터한다.
 * - 원장에게는 보통 이 헬퍼를 안 쓴다. 원장은 viewAll과 무관하게 전체 쿼리.
 * - 쓰기를 막지 않는다. 저장 액션이 같은 where로 대상을 다시 검증해야 한다.
 *
 * 관련: `permission-guard.ts`, Prisma `Class.teacherUserId` / `ClassEnrollment`.
 */

import { userHasPermission } from "@/lib/permission-guard"; // viewAllStudents grant. JWT 권한을 믿지 않는다.

/** 한 요청에서 재사용할 스코프. viewAll이면 where가 `{}`. */
export type StaffScope = { // data.ts where에 spread. 학부모/학생 스코프는 여기 없다.
    userId: string; // 담임 Class.teacherUserId와 비교.
    viewAllStudents: boolean; // grant. 꺼지면 담당 반만.
};

/**
 * 로그인 교사/직원의 학생·반 조회 범위.
 * viewAllStudents grant가 켜져 있으면 전 원생, 아니면 본인이 담임인 반만.
 */
export async function getStaffScope(userId: string): Promise<StaffScope> { // 한 요청에서 재사용. 원장은 보통 안 탄다.
    const viewAllStudents = await userHasPermission( // viewAll 아니면 담임 반만. CANCELLED 수강 제외.
        userId, // requireRole이 넘긴 DB id.
        "viewAllStudents", // 켜져 있으면 전 원생, 아니면 담임 반만. 원장은 이 헬퍼를 보통 안 탄다.
    );
    return { userId, viewAllStudents }; // where 조각의 입력. 학부모/학생 필터는 레이아웃이 직접.
}

/**
 * `Student.findMany` where에 spread.
 * 담당 반 필터는 ACTIVE + endedAt null만 — 끝난 수강으로 타반 학생을 끌어오지 않는다.
 */
export function studentScopeWhere(scope: StaffScope) { // 타반 명단이 새지 않게. CANCELLED 수강은 현재 명단이 아님.
    if (scope.viewAllStudents) return {}; // 전 원생 조화면 where를 비워 타반 필터를 붙이지 않는다.

    return { // ACTIVE + 미종료 수강만. 끝난 수강으로 타반 학생을 끌어오지 않는다.
        enrollments: { // ClassEnrollment. 퇴원 확정은 CANCELLED+endedAt.
            some: { // 한 반이라도 담임이면 명단에 남긴다.
                status: "ACTIVE" as const, // CANCELLED는 퇴원 확정·수강 해제. 현재 명단에 안 남긴다.
                endedAt: null, // endedAt이 있으면 이력. 현재 탭이 아님.
                class: { teacherUserId: scope.userId }, // 본인이 담임인 반만.
            },
        },
    };
}

/**
 * 한 학생의 반 목록을 좁힐 때 (`ClassEnrollment` where).
 * viewAll이어도 ACTIVE·미종료만 보여 퇴원 확정 반이 현재 탭에 안 남게 한다.
 */
export function enrollmentScopeWhere(scope: StaffScope) { // 현재 수강 탭. CANCELLED+endedAt은 이력.
    if (scope.viewAllStudents) { // viewAll이어도 끝난 수강은 현재 탭에 안 남긴다.
        return { // viewAll이어도 ACTIVE·미종료만. 퇴원 확정 반이 현재 탭에 안 남게.
            status: "ACTIVE" as const, // CANCELLED는 퇴원 확정.
            endedAt: null, // endedAt이 있으면 이력.
        };
    }

    return { // 본인이 담임인 반의 현재 수강만.
        status: "ACTIVE" as const, // CANCELLED는 현재 탭이 아님.
        endedAt: null, // 미종료만.
        class: { teacherUserId: scope.userId }, // 담임 반만. 타반 성적이 새지 않게.
    };
}

/**
 * `Class.findMany` where에 spread.
 * 직원이 담임이 아닌 반도 viewAll이면 보인다. 꺼져 있으면 teacherUserId = 본인만.
 */
export function classScopeWhere(scope: StaffScope) { // 반 목록. 학부모/학생은 이 헬퍼를 안 탄다.
    if (scope.viewAllStudents) return {}; // 직원이 담임이 아닌 반도 viewAll이면 보인다.
    return { teacherUserId: scope.userId }; // 꺼져 있으면 본인 담임 반만.
}

/**
 * `User`(role=STUDENT) 목록용 — 리포트 페이지처럼 User 기준으로 학생을 고를 때.
 * Student가 아니라 `studentProfile.enrollments`로 스코프한다.
 */
export function studentUserScopeWhere(scope: StaffScope) { // User 기준. Student.findMany가 아님.
    if (scope.viewAllStudents) return {}; // User 기준 목록도 viewAll이면 필터 없음.

    return { // Student가 아니라 studentProfile.enrollments로 담당 반을 좁힌다.
        studentProfile: { // User → Student 1:1. 없는 프로필은 목록에서 빠진다.
            is: { // 현재 수강만.
                enrollments: { // ACTIVE + 미종료. CANCELLED는 현재 명단이 아님.
                    some: { // 한 반이라도 담임이면.
                        status: "ACTIVE" as const, // 퇴원 확정 수강은 제외.
                        endedAt: null, // 이력 수강 제외.
                        class: { teacherUserId: scope.userId }, // 담임 반만.
                    },
                },
            },
        },
    };
}

/**
 * `ClassSession.findMany` — 회차 목록을 반의 담임으로 좁힌다.
 * 출석 화면이 다른 교사 회차를 기본 목록에 올리지 않게 한다.
 */
export function classSessionScopeWhere(scope: StaffScope) { // 출석 화면 기본 목록. 타반 회차를 숨긴다.
    if (scope.viewAllStudents) return {}; // viewAll이면 다른 교사 회차도 목록에 올린다.
    return { class: { teacherUserId: scope.userId } }; // 출석 화면이 타반 회차를 기본 목록에 올리지 않게.
}
