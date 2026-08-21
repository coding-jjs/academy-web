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

import { userHasPermission } from "@/lib/permission-guard";

/** 한 요청에서 재사용할 스코프. viewAll이면 where가 `{}`. */
export type StaffScope = {
    userId: string;
    viewAllStudents: boolean;
};

/**
 * 로그인 교사/직원의 학생·반 조회 범위.
 * viewAllStudents grant가 켜져 있으면 전 원생, 아니면 본인이 담임인 반만.
 */
export async function getStaffScope(userId: string): Promise<StaffScope> {
    const viewAllStudents = await userHasPermission(
        userId,
        "viewAllStudents",
    );
    return { userId, viewAllStudents };
}

/**
 * `Student.findMany` where에 spread.
 * 담당 반 필터는 ACTIVE + endedAt null만 — 끝난 수강으로 타반 학생을 끌어오지 않는다.
 */
export function studentScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) return {};

    return {
        enrollments: {
            some: {
                status: "ACTIVE" as const,
                endedAt: null,
                class: { teacherUserId: scope.userId },
            },
        },
    };
}

/**
 * 한 학생의 반 목록을 좁힐 때 (`ClassEnrollment` where).
 * viewAll이어도 ACTIVE·미종료만 보여 퇴원 확정 반이 현재 탭에 안 남게 한다.
 */
export function enrollmentScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) {
        return {
            status: "ACTIVE" as const,
            endedAt: null,
        };
    }

    return {
        status: "ACTIVE" as const,
        endedAt: null,
        class: { teacherUserId: scope.userId },
    };
}

/**
 * `Class.findMany` where에 spread.
 * 직원이 담임이 아닌 반도 viewAll이면 보인다. 꺼져 있으면 teacherUserId = 본인만.
 */
export function classScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) return {};
    return { teacherUserId: scope.userId };
}

/**
 * `User`(role=STUDENT) 목록용 — 리포트 페이지처럼 User 기준으로 학생을 고를 때.
 * Student가 아니라 `studentProfile.enrollments`로 스코프한다.
 */
export function studentUserScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) return {};

    return {
        studentProfile: {
            is: {
                enrollments: {
                    some: {
                        status: "ACTIVE" as const,
                        endedAt: null,
                        class: { teacherUserId: scope.userId },
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
export function classSessionScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) return {};
    return { class: { teacherUserId: scope.userId } };
}
