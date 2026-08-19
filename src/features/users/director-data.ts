import "server-only"; // 읽기 전용. 역할 쓰기는 actions.assignUserRole.

/**
 * 원장 역할 부여 화면에 쓸 GUEST 대기 목록과 연결 가능 원생을 읽는다.
 *
 * 호출: `(director)/director/users/page.tsx`가 서버에서 불러
 * `DirectorUsersScreen`에 넘긴다.
 *
 * 온보딩을 끝낸 ACTIVE GUEST만 보여 주고,
 * 학생 후보는 userId가 없는 재원/휴원 카드다 (퇴원·이미 연결된 카드 제외).
 *
 * 의도적으로 하지 않는 일:
 * - 역할을 바꾸지 않는다 → `assignUserRole`.
 * - 미온보딩 GUEST를 넣지 않는다 → 가입 폼이 끝나지 않은 계정.
 *
 * 관련: `features/users/types.ts`, `features/users/actions.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. User.role 갱신은 actions.
import type { // 화면 대기 큐·연결 후보. Prisma User 전체가 아니다.
    PendingRoleUser, // 온보딩 끝낸 ACTIVE GUEST.
    UnlinkedStudentOption, // userId:null 재원/휴원 카드.
} from "@/features/users/types"; // RoleAssignmentForm이 이 형태로 그린다.

/**
 * 역할 부여 화면의 대기 GUEST와 연결 가능 학생 카드.
 *
 * @returns `users`는 최신 가입 순. `unlinkedStudents`는 이름순.
 * @auth 페이지 레이아웃이 DIRECTOR만 통과시킨다. 이 함수는 역할 재검사하지 않는다.
 * @sideEffects 없음. 읽기 전용.
 */
export async function getPendingRoleUsersData(): Promise<{ // 화면 초기값. assignUserRole이 쓴 뒤 revalidate.
    users: PendingRoleUser[]; // 온보딩 끝낸 ACTIVE GUEST. 이미 역할 있는 계정은 없다.
    unlinkedStudents: UnlinkedStudentOption[]; // userId:null. STUDENT 부여 시 이 카드에만 붙인다.
}> { // 권한을 여기서 검사하지 않는다. 페이지가 DIRECTOR만 통과.
    const [userRecords, unlinkedStudents] = await Promise.all([ // 대기 큐와 빈 카드를 한 번에 읽는다.
        prisma.user.findMany({ // 역할은 안 바꾼다. 미온보딩 GUEST는 가입 폼이 끝나지 않았다.
            where: { // 이미 TEACHER 등인 계정은 대기 큐가 아니다.
                role: "GUEST", // 이미 TEACHER/STAFF/PARENT/STUDENT인 계정은 대기 큐가 아니다.
                status: "ACTIVE", // BLOCKED는 역할을 부여하지 않는다.
                onboardingCompleteAt: { not: null }, // 가입 폼이 끝나 이름·연락처가 채워진 상태만.
            },
            select: { // 주소·학교까지. 역할 부여 전에 원장이 확인한다.
                id: true, // RoleAssignmentForm hidden userId.
                name: true, // 온보딩 이름. 출석 명단에 그대로.
                email: true, // Google 이메일.
                phone: true, // 온보딩 전화.
                address: true, // 학원 연락용.
                schoolName: true, // STUDENT 부여 전에도 온보딩 학교를 보여 준다.
                grade: true, // 1~12 문자열. 유치원/재수는 null.
                createdAt: true, // 화면 joinedAt ISO로 바꾼다.
                studentProfile: { select: { id: true } }, // 이미 카드가 있으면 STUDENT 부여 UI를 막는다.
            },
            orderBy: { createdAt: "desc" }, // 최신 가입이 위. 원장이 방금 온 사람을 먼저 본다.
        }),
        prisma.student.findMany({ // 신규 Student를 만들지 않는다. 빈 카드만 후보.
            where: { // 이미 Google이 붙은 카드·퇴원 카드는 후보가 아니다.
                userId: null, // 이미 Google이 붙은 카드는 후보가 아니다. 신규 Student를 만들지 않는다.
                status: { in: ["ENROLLED", "PAUSED"] }, // 퇴원 카드에는 STUDENT 역할을 붙이지 않는다.
            },
            select: { // 연결 옵션 라벨용. User.name과 아직 다를 수 있다.
                id: true, // assignUserRole이 이 카드에 userId를 붙인다.
                name: true, // 원생 카드 이름.
                schoolName: true, // 카드에 적힌 학교.
                grade: true, // 카드 학년.
                status: true, // ENROLLED/PAUSED만. WITHDRAWN은 where가 뺀다.
            },
            orderBy: { name: "asc" }, // 이름순. 대기 GUEST와 정렬 기준이 다르다.
        }),
    ]);

    return { // ISO·불리언만. Prisma Date·관계를 그대로 넘기지 않는다.
        users: userRecords.map((user) => ({ // hasStudentProfile이 true면 폼이 STUDENT를 숨긴다.
            id: user.id, // Form hidden. assignUserRole의 userId.
            name: user.name, // 온보딩 이름.
            email: user.email, // Google 이메일.
            phone: user.phone, // 온보딩 전화.
            address: user.address, // 학원 연락용.
            schoolName: user.schoolName, // STUDENT 부여 전 학교 표시.
            grade: user.grade, // 1~12 또는 null.
            joinedAt: user.createdAt.toISOString(), // 화면용 ISO. Prisma Date를 그대로 넘기지 않는다.
            hasStudentProfile: Boolean(user.studentProfile), // true면 RoleAssignmentForm이 STUDENT 연결을 숨긴다.
        })),
        unlinkedStudents, // userId:null 재원/휴원. assignUserRole이 이 id에 User를 붙인다.
    };
}
