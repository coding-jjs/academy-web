import { userHasPermission } from "@/lib/permission-guard";

export type StaffScope = {
    userId: string;
    viewAllStudents: boolean;
};

/** 로그인 staff/teacher의 학생·반 조회 범위 */
export async function getStaffScope(userId: string): Promise<StaffScope> {
    const viewAllStudents = await userHasPermission(
        userId,
        "viewAllStudents",
    );
    return { userId, viewAllStudents };
}

/** Student.findMany where 에 spread */
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

/** ClassEnrollment where (학생의 반 목록을 좁힐 때) */
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

/** Class.findMany where 에 spread */
export function classScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) return {};
    return { teacherUserId: scope.userId };
}

/**
 * User(role=STUDENT) 목록용 — reports page 패턴
 * studentProfile.enrollments 로 스코프
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

/** ClassSession.findMany — class 관계로 스코프 */
export function classSessionScopeWhere(scope: StaffScope) {
    if (scope.viewAllStudents) return {};
    return { class: { teacherUserId: scope.userId } };
}
