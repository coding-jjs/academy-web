"use server"; // 원장 쓰기. GUEST 대기 목록 읽기는 director-data.

/**
 * 원장이 온보딩을 마친 GUEST에게 업무 역할을 부여한다.
 *
 * 호출: `(director)/director/users/RoleAssignmentForm.tsx`가 form action으로 제출한다.
 * STUDENT는 새 원생을 만들지 않고 `userId`가 비어 있는 기존 학생 카드에만 연결한다.
 * TEACHER/STAFF/PARENT는 User.role만 바꾸고 Student 행은 건드리지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - DIRECTOR를 부여하지 않는다 → `assignableRoles`에 없음.
 * - GUEST가 아닌 계정의 역할을 바꾸지 않는다 → where에 role=GUEST.
 * - JWT를 직접 갱신하지 않는다 → 다음 요청의 jwt 콜백이 DB를 다시 읽는다.
 *
 * 관련: `features/users/director-data.ts`, `lib/audit.ts`, Prisma Student.userId.
 */

import { revalidatePath } from "next/cache"; // 대기 큐·원생 카드·학부모 후보를 다시 읽게.
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit"; // USER_ROLE_ASSIGNED. 트랜잭션 안에서만.
import { auth } from "@/lib/auth"; // JWT. layout이 DIRECTOR를 걸렀어도 쓰기는 여기서 다시 본다.
import { prisma } from "@/lib/db"; // User.role 갱신 + STUDENT면 빈 카드에 userId.

const assignableRoles = ["TEACHER", "STAFF", "PARENT", "STUDENT"] as const; // DIRECTOR는 이 폼으로 승격하지 않는다.

type AssignableRole = (typeof assignableRoles)[number]; // 폼 문자열을 이 집합으로만 좁힌다.

/**
 * GUEST → 업무 역할. STUDENT면 빈 학생 카드(userId: null)에 연결한다.
 *
 * @param formData `userId`, `role`, STUDENT일 때만 `studentId`.
 * @returns void. 실패는 throw. 성공 시 원장 사용자·원생·학부모·리포트 경로를 재검증한다.
 * @auth DIRECTOR만. 그 외는 throw.
 * @sideEffects User.role 갱신, STUDENT면 Student.userId 연결, USER_ROLE_ASSIGNED 감사 로그.
 */
export async function assignUserRole(formData: FormData) { // 신규 Student create가 아니다. 빈 카드에만 붙인다.
    const session = await auth(); // JWT. proxy·layout이 DIRECTOR를 걸렀어도 쓰기는 여기서 역할을 다시 본다.

    if (!session?.user || session.user.role !== "DIRECTOR") { // TEACHER/STAFF가 이 액션 URL을 직접 쳐도 거절.
        throw new Error("역할을 부여할 권한이 없습니다."); // TEACHER/STAFF가 이 액션 URL을 직접 쳐도 거절.
    }

    const userId = formData.get("userId"); // 대기 GUEST User.id. 이미 역할이 있으면 where가 거절.
    const requestedRole = formData.get("role"); // TEACHER/STAFF/PARENT/STUDENT만 아래에서 통과.
    const studentId = formData.get("studentId"); // STUDENT일 때만 필수. 기존 카드 id이며 신규 생성이 아니다.

    if (typeof userId !== "string" || !userId) { // hidden이 비면 Prisma를 치지 않는다.
        throw new Error("사용자 정보가 올바르지 않습니다."); // 빈 userId. 대기 큐 행이 아님.
    }

    if ( // DIRECTOR·GUEST·임의 문자열은 assignableRoles 밖.
        typeof requestedRole !== "string" || // 폼이 문자열이 아니면 거절.
        !assignableRoles.includes(requestedRole as AssignableRole) // DIRECTOR는 이 폼으로 올리지 않는다.
    ) { // 허용 역할만. GUEST로 되돌리지도 않는다.
        throw new Error("부여할 수 없는 역할입니다."); // DIRECTOR·GUEST·임의 문자열 거절.
    }

    if ( // STUDENT는 카드 없이 역할만 올리면 원생이 비는 계정이 된다.
        requestedRole === "STUDENT" && // TEACHER/STAFF/PARENT는 studentId를 보지 않는다.
        (typeof studentId !== "string" || !studentId) // 기존 카드 id. 신규 Student create가 아니다.
    ) { // userId:null 카드를 고르지 않으면 거절.
        throw new Error("연결할 기존 학생을 선택해 주세요."); // STUDENT는 카드 없이 역할만 올리면 원생이 비는 계정이 된다.
    }

    const metadata = await getAuditRequestMetadata(); // IP·UA. 트랜잭션 안에서 감사 로그에 붙인다.
    await prisma.$transaction(async (tx) => { // GUEST 갱신과 카드 연결을 한 트랜잭션. 레이스면 count=0.
        const targetUser = await tx.user.findFirst({ // 이미 역할이 있거나 차단이면 거절.
            where: { id: userId, role: "GUEST", status: "ACTIVE" }, // 이미 역할이 있거나 차단이면 거절.
            select: { // studentProfile이 있으면 STUDENT 재연결을 막는다.
                id: true, // User.id. 아래 updateMany where와 같다.
                studentProfile: { select: { id: true } }, // 이미 카드가 있으면 STUDENT 재연결을 막는다.
            },
        });

        if (!targetUser) { // 대기 큐에 없는 계정. 동시 부여로 이미 GUEST가 아닐 수 있다.
            throw new Error("역할을 부여할 수 없는 사용자입니다."); // 온보딩 미완료·BLOCKED·이미 역할 있음.
        }

        if (requestedRole === "STUDENT" && targetUser.studentProfile) { // 두 번째 Student 행을 만들지 않는다.
            throw new Error( // 재원은 원생 관리에서. 여기서는 빈 카드만 붙인다.
                "이미 학생 프로필이 연결된 계정입니다. 학생 관리에서 재원 상태로 변경해 주세요.", // 두 번째 Student 행을 만들지 않는다.
            );
        }

        const userResult = await tx.user.updateMany({ // 동시 부여 레이스에서 두 번째가 0건이 되게.
            where: { // GUEST+ACTIVE만. 이미 올라간 역할은 덮지 않는다.
                id: userId, // 대기 큐의 그 행.
                role: "GUEST", // 동시 부여 레이스에서 두 번째 update가 0건이 되게.
                status: "ACTIVE", // BLOCKED는 역할을 올리지 않는다.
            },
            data: { // JWT는 다음 요청 jwt 콜백이 DB를 다시 읽는다.
                role: requestedRole as AssignableRole, // JWT는 다음 요청 jwt 콜백이 DB를 다시 읽는다.
            },
        });

        if (userResult.count === 0) { // 레이스로 이미 GUEST가 아님. 카드 연결 전에 중단.
            throw new Error("역할을 부여할 수 없는 사용자입니다."); // 트랜잭션 롤백. 카드 userId도 안 붙는다.
        }

        if (requestedRole === "STUDENT") { // TEACHER/STAFF/PARENT는 원생 카드를 건드리지 않는다.
            const studentResult = await tx.student.updateMany({ // 신규 create가 아니다. 빈 카드에만 붙인다.
                where: { // 이미 Google이 붙은 카드·퇴원 카드는 거절.
                    id: studentId as string, // 폼이 고른 기존 카드. userId:null 후보.
                    userId: null, // 이미 다른 Google이 붙은 카드에는 덮지 않는다.
                    status: { in: ["ENROLLED", "PAUSED"] }, // 퇴원 카드에는 로그인 계정을 붙이지 않는다.
                },
                data: { userId }, // 신규 Student create가 아니다.
            });

            if (studentResult.count === 0) { // 이미 연결됐거나 퇴원. User.role은 롤백된다.
                throw new Error( // 다른 계정이 붙었거나 연결 불가 상태.
                    "이미 다른 계정에 연결됐거나 연결할 수 없는 학생입니다.", // userId:null이 아니거나 WITHDRAWN.
                );
            }
        }

        await writeAuditLog(tx, { // USER_ROLE_ASSIGNED. 같은 트랜잭션에 남겨 롤백과 맞춘다.
            actorUserId: session.user.id, // 원장. 대상 GUEST가 아니다.
            action: "USER_ROLE_ASSIGNED", // 역할 부여. 학부모 링크와 다른 액션.
            targetType: "USER", // 대상은 User. Student가 아니다.
            targetId: userId, // 역할이 올라간 GUEST.
            details: { // previous는 항상 GUEST. where가 그렇게 막는다.
                previousRole: "GUEST", // where가 GUEST만 통과시키므로 직전은 항상 GUEST.
                nextRole: requestedRole, // TEACHER/STAFF/PARENT/STUDENT.
                studentId: // TEACHER/STAFF/PARENT는 원생 카드를 건드리지 않는다.
                    requestedRole === "STUDENT" // 카드 id. 없으면 null.
                        ? (studentId as string) // 붙인 기존 카드.
                        : null, // TEACHER/STAFF/PARENT는 원생 카드를 건드리지 않는다.
            },
            metadata, // IP·UA.
        });
    });

    revalidatePath("/director/users"); // 대기 큐에서 빠진 GUEST.
    revalidatePath("/director/students"); // googleLinked가 바뀐 원생 카드.
    revalidatePath("/director/parents"); // PARENT 부여 후 연결 후보.
    revalidatePath("/director/reports"); // 역할이 리포트 작성 권한에 영향.
}
