import "server-only"; // 읽기 전용. 연결/해제는 families/actions.

/**
 * 원장 학부모 연결 화면에 쓸 활성 링크·연결 가능 학부모/학생을 읽는다.
 *
 * 호출: `(director)/director/parents/page.tsx`.
 * 학생 후보는 이미 활성 링크가 없는 재원 원생만 올려 중복 연결을 막는다.
 * 학부모 후보는 PARENT + ACTIVE + 온보딩 완료. GUEST로 떨어진 계정은 안 나온다.
 *
 * 의도적으로 하지 않는 일:
 * - endedAt이 있는 과거 링크를 목록에 넣지 않는다.
 * - 연결/해제를 수행하지 않는다 → `families/actions.ts`.
 *
 * 관련: `features/families/types.ts`, `features/families/actions.ts`.
 */

import { prisma } from "@/lib/db"; // findMany만. 링크 create·endedAt은 actions.
import type { // 폼 옵션·활성 목록. 해제 이력 타입은 없다.
    ActiveFamilyLink, // endedAt null만. Unlink 버튼의 linkId.
    LinkableParent, // PARENT+온보딩. GUEST로 떨어진 계정은 없다.
    LinkableStudent, // 재원·활성 링크 없음. 학생당 보호자 1명.
} from "@/features/families/types"; // DirectorParentsScreen이 이 형태로 그린다.

/**
 * 연결 폼 옵션과 현재 활성 링크 목록.
 *
 * @returns `parents`/`students`는 이름순, `activeLinks`는 최근 연결순.
 * @auth 페이지가 DIRECTOR만 통과.
 * @sideEffects 없음.
 */
export async function getDirectorFamilyLinksData(): Promise<{ // 화면 초기값. 쓰기는 link/unlink.
    parents: LinkableParent[]; // 마지막 해제로 GUEST가 된 계정은 빠진다.
    students: LinkableStudent[]; // 이미 활성 보호자가 있으면 후보에서 뺀다.
    activeLinks: ActiveFamilyLink[]; // endedAt null만. 이력 행은 안 올린다.
}> { // 권한을 여기서 검사하지 않는다.
    const [parents, students, linkRecords] = await Promise.all([ // 옵션과 목록을 한 번에.
        prisma.user.findMany({ // 연결 폼 학부모 select.
            where: { // 마지막 링크 해제로 GUEST가 된 계정은 후보에서 빠진다.
                role: "PARENT", // 마지막 링크 해제로 GUEST가 된 계정은 후보에서 빠진다.
                status: "ACTIVE", // BLOCKED는 연결하지 않는다.
                onboardingCompleteAt: { not: null }, // 가입 폼이 끝나야 이름·이메일이 믿을 만하다.
            },
            select: { id: true, name: true, email: true }, // linkParentStudent의 parentUserId.
            orderBy: { name: "asc" }, // 이름순.
        }),
        prisma.student.findMany({ // 연결 폼 학생 select. 학생당 활성 1명.
            where: { // 휴원/퇴원에는 새 보호자를 붙이지 않는다.
                status: "ENROLLED", // 휴원/퇴원에는 새 보호자를 붙이지 않는다.
                user: { is: { role: "STUDENT", status: "ACTIVE" } }, // Google이 붙은 재원 원생만.
                parentLinks: { none: { endedAt: null } }, // 이미 활성 보호자가 있으면 후보에서 뺀다. 학생당 1명.
            },
            select: { id: true, name: true, schoolName: true, grade: true }, // 옵션 라벨.
            orderBy: { name: "asc" }, // 이름순.
        }),
        prisma.parentStudentLink.findMany({ // 해제 이력은 이 화면에 안 올린다. 행 삭제가 아니라 endedAt.
            where: { endedAt: null }, // 해제 이력은 이 화면에 안 올린다. 행 삭제가 아니라 endedAt.
            select: { // Unlink 버튼·연락처.
                id: true, // UnlinkParentStudentButton의 linkId.
                relationship: true, // 어머니/아버지 등.
                linkedAt: true, // 화면 ISO.
                parent: { // 학부모 쪽 표시.
                    select: { name: true, email: true, phone: true }, // 원장 화면. viewParentContact와 별개.
                },
                student: { // 원생 쪽 표시.
                    select: { // 카드만 있으면 email null.
                        name: true, // 원생 이름.
                        schoolName: true, // 학교.
                        grade: true, // 학년.
                        user: { select: { email: true } }, // 카드만 있으면 null.
                    },
                },
            },
            orderBy: { linkedAt: "desc" }, // 최근 연결이 위.
        }),
    ]);

    const activeLinks = linkRecords.map((link) => ({ // Prisma Date·중첩을 화면 타입으로.
        id: link.id, // UnlinkParentStudentButton의 linkId.
        relationship: link.relationship, // 허용 집합 값.
        linkedAt: link.linkedAt.toISOString(), // 화면용 ISO.
        parent: link.parent, // name/email/phone.
        student: { // user가 없으면 email null.
            name: link.student.name, // 원생 이름.
            schoolName: link.student.schoolName, // 학교.
            grade: link.student.grade, // 학년.
            email: link.student.user?.email ?? null, // STUDENT 역할 부여 전 카드는 이메일 없음.
        },
    }));

    return { parents, students, activeLinks }; // 폼 옵션 + 현재 연결. 쓰기는 actions.
}
