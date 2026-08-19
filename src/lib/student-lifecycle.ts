/**
 * 원생 `ENROLLED` ↔ `PAUSED` ↔ `WITHDRAWN` 전이.
 * 퇴원 시 이탈 케이스를 닫고, 유예가 끝나면 연결된 User·수강·학부모 링크를 확정 정리한다.
 *
 * 호출:
 * - `features/students/director-actions.ts` → `transitionStudentStatus` (원장이 상태 변경)
 * - `account-access.getUsableAccount` → `finalizeExpiredWithdrawalsForUser`
 *   (로그인·페이지 가드 시점에 유예 만료를 확정)
 *
 * 서버 전용 쓰기. 호출부가 연 트랜잭션(`tx`)에 붙여 학생 update와 audit가 한 커밋이 되게 한다.
 * 확정 함수만 `prisma.$transaction`을 직접 연다 (로그인 경로에는 바깥 tx가 없음).
 *
 * 의도적으로 하지 않는 일:
 * - Student/User 행을 DELETE하지 않는다. 출석·청구 이력을 그대로 남긴다.
 * - 수강은 delete가 아니라 `CANCELLED` + `endedAt` — 과거 출석 회차 FK를 지탱한다.
 * - 원장·교사·직원 User는 건드리지 않는다. 원생 퇴원이 직원 로그인을 끄면 안 된다.
 * - 유예 중에는 로그인을 막지 않는다. 당일까지 학부모/학생이 조회할 수 있게 한다.
 *
 * 관련: `date-kst.ts` (유예 끝), `account-access.ts`, `audit.ts`, `churn-detect.ts`.
 */

import type { Prisma, StudentStatus } from "@/generate/prisma/client"; // ENROLLED/PAUSED/WITHDRAWN. UserStatus와 별개.
import { // 이름만 가져온다. 역할 가드는 proxy·requireRole.
    writeAuditLog, // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
    type AuditRequestMetadata, // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
} from "@/lib/audit"; // 같은 tx에 넣어 롤백되면 로그만 남는 일을 막는다.
import { isPastWithdrawalGrace } from "@/lib/date-kst"; // 당일 KST까지 조회 유지. 다음날 00:00부터 확정.
import { prisma } from "@/lib/db"; // 확정 함수만 직접 $transaction. 전이는 호출부 tx.

/**
 * 원생 상태를 바꾸고 부수 효과를 적용한다. 같으면 no-op (`changed: false`).
 *
 * WITHDRAWN: `withdrawnAt=now`, 열린 이탈 케이스를 WITHDRAWN으로 닫음 (큐에 남기지 않음).
 * 그 외(재원/휴원): `withdrawnAt=null`로 유예 시계를 지우고,
 * 연결된 User가 GUEST/STUDENT이면 STUDENT+ACTIVE로 살린다 (로그인 복구).
 */
export async function transitionStudentStatus( // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
    tx: Prisma.TransactionClient, // 호출부가 연 tx. 학생 update와 audit가 한 커밋.
    input: { // 원장 director-actions. Student/User를 DELETE하지 않는다.
        studentId: string; // Student.id. User.id가 아님.
        status: StudentStatus; // ENROLLED↔PAUSED↔WITHDRAWN.
        actorUserId: string; // 원장 User.id. audit actor.
        metadata: AuditRequestMetadata; // IP/UA. jwt 경로는 빈 메타.
        now: Date; // withdrawnAt. 재원이면 null로 유예 시계를 지운다.
    },
) { // 같으면 no-op. 출석·청구 이력 행은 남긴다.
    const student = await tx.student.findUnique({ // 같은 tx에서 현재 상태를 읽는다. 호출부 update와 audit가 한 커밋이 되게.
        where: { id: input.studentId }, // 없는 학생은 아래에서 throw.
        select: { // 최소 컬럼. 출석 이력은 안 지운다.
            id: true, // Student.id.
            name: true, // audit 추적용. 화면 카피가 아님.
            userId: true, // 연결된 학생 User만 복구. 직원 계정과 혼동하지 않는다.
            status: true, // ENROLLED↔PAUSED↔WITHDRAWN.
        },
    });

    if (!student) { // 없는 학생은 전이하지 않는다.
        throw new Error("학생을 찾을 수 없습니다."); // audit를 남기지 않는다.
    }

    if (student.status === input.status) { // 같으면 no-op. audit를 남기지 않는다.
        return { student, changed: false }; // 부수 효과 없음. 유예 시계도 안 건드린다.
    }

    await tx.student.update({ // 퇴원 시각은 WITHDRAWN일 때만. 재원이면 null로 유예 시계를 지운다.
        where: { id: student.id }, // Student 행은 DELETE하지 않는다.
        data: { // 상태 + 유예 시계.
            status: input.status, // ENROLLED/PAUSED/WITHDRAWN.
            withdrawnAt: input.status === "WITHDRAWN" ? input.now : null, // 재원·휴원이면 유예 시계를 지운다.
        },
    });

    if (input.status === "WITHDRAWN") { // 이탈 큐에 남기지 않는다. 유예 중 로그인은 막지 않는다.
        await tx.churnCase.updateMany({ // 미해결 케이스를 WITHDRAWN으로 닫아 큐에 남지 않게 한다.
            where: { // 이 원생의 열린 카드만.
                studentId: student.id, // 이 원생만.
                status: { in: ["DETECTED", "COUNSELING"] }, // IMPROVED는 이미 끝난 카드. 다시 열지 않는다.
            },
            data: { // 큐에서 빼되 행은 남긴다.
                status: "WITHDRAWN", // 상담/종결이 아니라 퇴원 종결.
                resolvedAt: input.now, // 닫힌 시각. 원장이 상담한 것과 구분.
            },
        });
    } else if (student.userId) { // 재원/휴원. 연결된 학생 User만 살린다.
        await tx.user.updateMany({ // GUEST/STUDENT만 STUDENT+ACTIVE. 직원 계정과 원생 프로필을 혼동하지 않는다.
            where: { // 원장·교사·직원 User는 건드리지 않는다.
                id: student.userId, // 연결된 학생 User만.
                role: { in: ["GUEST", "STUDENT"] }, // 직원 역할을 덮지 않는다.
            },
            data: { role: "STUDENT", status: "ACTIVE" }, // 로그인 복구. WITHDRAWN User를 살린다.
        });
    }

    await writeAuditLog(tx, { // 퇴원/재원/그 외 상태 변경을 구분해 남긴다.
        actorUserId: input.actorUserId, // 원장. 시스템이 자동 확정하는 경로가 아님.
        action: // 퇴원/재원/그 외를 구분해 원장이 추후 추적.
            input.status === "WITHDRAWN" // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
                ? "STUDENT_WITHDRAWN" // 퇴원. 유예 확정은 STUDENT_WITHDRAWAL_FINALIZED.
                : student.status === "WITHDRAWN" // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
                  ? "STUDENT_REENROLLED" // 퇴원 → 재원. 유예 시계는 위에서 null.
                  : "STUDENT_STATUS_CHANGED", // ENROLLED↔PAUSED 등.
        targetType: "STUDENT", // User가 아님.
        targetId: student.id, // Student.id.
        details: { // 이전/다음 상태. 페이지 뷰는 남기지 않는다.
            previousStatus: student.status, // 전이 전.
            nextStatus: input.status, // 전이 후.
            linkedUserId: student.userId, // 학생 User. 직원과 혼동하지 않게.
        },
        metadata: input.metadata, // IP/UA.
    });

    return { student, changed: true }; // Student 행은 DELETE하지 않는다.
}

/**
 * 퇴원 확정: 연결된 학생 User를 GUEST+WITHDRAWN, 수강을 CANCELLED, 학부모 링크를 종료한다.
 * 유예 검사는 하지 않는다 — 호출부(`finalizeExpiredWithdrawalsForUser`)가 이미 날짜를 봤다.
 *
 * 학부모는 남은 활성 링크가 0일 때만 WITHDRAWN. 다른 자녀가 재원이면 로그인을 유지한다.
 * 수강을 delete하지 않는 이유: 출석·성적 FK와 청구 이력을 그대로 남긴다.
 */
export async function finalizeStudentWithdrawal( // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
    tx: Prisma.TransactionClient, // 로그인 경로는 finalizeExpiredWithdrawalsForUser가 연다.
    input: { // 유예 검사는 호출부가 이미 했다.
        studentId: string; // WITHDRAWN 원생만.
        actorUserId: string; // 로그인 중인 userId. 시스템이 자동 확정해도 actor.
        metadata: AuditRequestMetadata; // jwt면 빈 IP/UA.
        now: Date; // endedAt. 수강 delete가 아님.
    },
) { // Student/User 행은 DELETE하지 않는다.
    const student = await tx.student.findUnique({ // WITHDRAWN이 아니면 확정하지 않는다. 유예 검사는 호출부가 이미 했다.
        where: { id: input.studentId }, // Student.id.
        select: { // 최소. 출석 이력은 안 지운다.
            id: true, // Student.
            userId: true, // 연결된 학생 User만 GUEST+WITHDRAWN.
            status: true, // WITHDRAWN이 아니면 아래에서 no-op.
            withdrawnAt: true, // 호출부가 유예를 이미 봄. 여기선 안 본다.
        },
    });

    if (!student || student.status !== "WITHDRAWN") { // ENROLLED/PAUSED는 건드리지 않는다.
        return { student, finalized: false }; // ENROLLED/PAUSED는 건드리지 않는다.
    }

    if (student.userId) { // 연결된 학생 User만. 원장·교사·직원은 건드리지 않는다.
        await tx.user.updateMany({ // 연결된 학생 User만 GUEST+WITHDRAWN. 직원 역할은 건드리지 않는다.
            where: { // 원장·교사·직원 User는 건드리지 않는다.
                id: student.userId, // 연결된 학생 User만.
                role: { in: ["STUDENT", "GUEST"] }, // 직원 역할을 덮지 않는다.
            },
            data: { role: "GUEST", status: "WITHDRAWN" }, // 로그인 불가. 행은 남긴다. BLOCKED와 별개.
        });
    }

    await tx.classEnrollment.updateMany({ // delete가 아니라 CANCELLED. 출석·성적 FK와 청구 이력을 남긴다.
        where: { // 현재 수강만. 이미 CANCELLED인 이력은 건드리지 않는다.
            studentId: student.id, // 이 원생.
            status: "ACTIVE", // 현재 수강만.
            endedAt: null, // 미종료만. 이력은 그대로.
        },
        data: { // delete가 아님. 과거 출석 회차 FK를 지탱.
            status: "CANCELLED", // 수강 해제. delete가 아님.
            endedAt: input.now, // 종료 시각. staff-scope는 endedAt null만 현재 탭.
        },
    });

    const activeLinks = await tx.parentStudentLink.findMany({ // 이 자녀 링크를 끊고, 남은 활성 링크가 0일 때만 학부모도 WITHDRAWN.
        where: { studentId: student.id, endedAt: null }, // 이미 끊긴 링크는 학부모 확정 대상이 아님.
        select: { id: true, parentUserId: true }, // 학부모 User.id. 다른 자녀 링크를 세기 위해.
    });

    if (activeLinks.length > 0) { // 이 자녀 링크를 끊는다. 다른 자녀가 재원이면 학부모 로그인 유지.
        await tx.parentStudentLink.updateMany({ // 이 자녀만. 다른 자녀 링크는 그대로.
            where: { // 방금 읽은 활성 링크만.
                id: { in: activeLinks.map((link) => link.id) }, // 이 자녀 링크만.
                endedAt: null, // 이미 끊긴 것은 덮지 않는다.
            },
            data: { // 링크 종료. DELETE가 아님.
                endedAt: input.now, // 종료 시각.
                endedBy: input.actorUserId, // 로그인 중인 userId. 시스템이 자동 확정해도 actor.
                endReason: "학생 퇴원", // 원장이 수동으로 끊은 것과 구분.
            },
        });

        for (const parentUserId of new Set( // 같은 학부모가 여러 링크면 한 번만.
            activeLinks.map((link) => link.parentUserId), // 학부모 User.id.
        )) { // 남은 활성 링크가 0일 때만 WITHDRAWN.
            const remainingLinks = await tx.parentStudentLink.count({ // 다른 자녀가 재원이면 학부모 로그인을 유지한다.
                where: { parentUserId, endedAt: null }, // 다른 자녀가 재원이면 학부모 로그인을 유지한다.
            });
            if (remainingLinks === 0) { // 다른 자녀가 없으면 학부모 로그인 불가.
                await tx.user.updateMany({ // PARENT만. 직원 역할을 덮지 않는다.
                    where: { id: parentUserId, role: "PARENT" }, // PARENT만. 직원 역할을 덮지 않는다.
                    data: { role: "GUEST", status: "WITHDRAWN" }, // 로그인 불가. 행은 남긴다.
                });
            }
        }
    }

    await writeAuditLog(tx, { // 시스템이 자동 확정해도 actor는 로그인 중인 userId.
        actorUserId: input.actorUserId, // jwt/페이지 가드를 탄 userId.
        action: "STUDENT_WITHDRAWAL_FINALIZED", // 전이 STUDENT_WITHDRAWN과 구분.
        targetType: "STUDENT", // User가 아님.
        targetId: student.id, // Student.id.
        details: { linkedUserId: student.userId }, // 학생 User. 학부모는 위에서 따로.
        metadata: input.metadata, // jwt면 빈 IP/UA.
    });

    return { student, finalized: true }; // jwt 콜백이 User를 다시 읽어 WITHDRAWN을 반영하게.
}

/**
 * 이 User가 학생으로 묶였거나, 아직 안 끊긴 학부모 링크로 퇴원생을 보고 있으면
 * 유예가 끝난 원생만 확정한다. 로그인 가드가 매 요청 호출하므로 배치 잡을 기다리지 않는다.
 *
 * @returns 하나라도 확정했으면 true. jwt 콜백이 User를 다시 읽어 WITHDRAWN을 반영하게 한다.
 * actor는 로그인 중인 userId — 시스템이 자동 확정해도 "누가 들어와서 트리거됐는지"를 남긴다.
 */
export async function finalizeExpiredWithdrawalsForUser( // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
    userId: string, // 로그인 중인 User. 원장·교사·직원은 원생 퇴원과 안 묶인다.
    now = new Date(), // 유예 비교. 당일 KST까지는 건너뛴다.
    metadata?: AuditRequestMetadata, // 없으면 빈 IP/UA. jwt 콜백.
) { // 배치 잡을 기다리지 않는다. getUsableAccount가 매 요청 호출.
    const [studentProfile, parentWithdrawnLinks] = await Promise.all([ // 본인이 퇴원생이거나, 아직 안 끊긴 학부모 링크로 퇴원생을 보고 있는 경우.
        prisma.student.findFirst({ // 본인이 퇴원생. ENROLLED/PAUSED는 여기 없음.
            where: { userId, status: "WITHDRAWN" }, // 퇴원만. 유예는 아래에서 날짜로.
            select: { id: true, withdrawnAt: true }, // 유예 비교용.
        }),
        prisma.parentStudentLink.findMany({ // 아직 안 끊긴 링크로 퇴원생을 보는 학부모.
            where: { // 이미 끊긴 링크는 학부모 확정 대상이 아님.
                parentUserId: userId, // 이 학부모.
                endedAt: null, // 이미 끊긴 링크는 학부모 확정 대상이 아님.
                student: { status: "WITHDRAWN" }, // 재원 자녀는 확정 대상이 아님.
            },
            select: { // 자녀 id·퇴원 시각.
                student: { select: { id: true, withdrawnAt: true } }, // 유예 비교용.
            },
        }),
    ]);

    const dueStudentIds = new Set<string>(); // KST 당일까지는 건너뛴다. 로그인 가드가 매 요청 호출하므로 배치를 기다리지 않는다.
    if ( // ENROLLED↔PAUSED↔WITHDRAWN. 수강은 CANCELLED+endedAt.
        studentProfile && // 본인이 퇴원생.
        isPastWithdrawalGrace(studentProfile.withdrawnAt, now) // 다음날 00:00 KST부터. 당일 저녁 조회는 유지.
    ) { // 본인 원생 유예 만료.
        dueStudentIds.add(studentProfile.id); // 확정 대상.
    }
    for (const link of parentWithdrawnLinks) { // 학부모 경로. 자녀마다 유예가 다를 수 있다.
        if (isPastWithdrawalGrace(link.student.withdrawnAt, now)) { // 당일까지는 건너뛴다.
            dueStudentIds.add(link.student.id); // 확정 대상. 다른 재원 자녀는 여기 없음.
        }
    }

    if (dueStudentIds.size === 0) return false; // 확정할 원생이 없으면 jwt가 User를 다시 읽을 필요가 없다.

    const auditMetadata = metadata ?? { // jwt 콜백처럼 headers가 없으면 빈 메타.
        ipAddress: null, // jwt 경로. 확정 자체를 막지 않는다.
        userAgent: null, // jwt 콜백처럼 headers가 없으면 빈 메타.
    };

    await prisma.$transaction(async (tx) => { // 로그인 경로에는 바깥 tx가 없어서 여기서 연다.
        for (const studentId of dueStudentIds) { // 유예가 끝난 원생만. 당일은 조회 유지.
            await finalizeStudentWithdrawal(tx, { // 수강 CANCELLED+endedAt. User는 GUEST+WITHDRAWN.
                studentId, // WITHDRAWN 원생.
                actorUserId: userId, // 시스템이 자동 확정해도 "누가 들어와서 트리거됐는지".
                metadata: auditMetadata, // jwt면 빈 IP/UA.
                now, // endedAt.
            });
        }
    });

    return true; // jwt 콜백이 User를 다시 읽어 WITHDRAWN을 반영하게.
}
