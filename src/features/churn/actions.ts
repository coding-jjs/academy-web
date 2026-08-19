"use server"; // Server Action. 브라우저가 Prisma를 직접 치지 않는다.

/**
 * 원장 이탈 케어: 케이스 상태 전이, 학부모 쪽지, 임계값 저장, 감지 실행.
 *
 * 호출: `(director)/director/churn/DirectorChurnScreen`.
 * 감지 로직(신호 4종, ENROLLED 스캔)은 `@/lib/churn-detect`에 두고,
 * 이 파일은 권한 확인 후 화면이 호출하는 명령만 노출한다.
 *
 * 의도적으로 하지 않는 일:
 * - 교사가 케이스를 진행시키지 않는다. 원장만.
 * - WITHDRAWN으로의 전이는 이 파일의 advance에 없다 (상담→개선만).
 *
 * 관련: `data.ts`, `presentation.ts`.
 */

import { revalidatePath } from "next/cache"; // 의존성. 원장 이탈. ENROLLED 4신호.
import { auth } from "@/lib/auth"; // 의존성. 원장 이탈. ENROLLED 4신호.
import { detectChurnCases } from "@/lib/churn-detect"; // 의존성. 원장 이탈. ENROLLED 4신호.
import { prisma } from "@/lib/db"; // 의존성. 원장 이탈. ENROLLED 4신호.
import { expandParentRecipients } from "@/features/messages/recipients"; // 의존성. 원장 이탈. ENROLLED 4신호.

/** 화면이 성공/실패 메시지만 받게 맞춘 결과. redirect하지 않는다. */
export type ChurnActionResult = // 화면 DTO. 원장 이탈. ENROLLED 4신호.
    | { ok: true; message: string } // 블록 끝. 원장 이탈. ENROLLED 4신호.
    | { ok: false; message: string }; // 원장 이탈. ENROLLED 4신호.

/** 원장만. 교사·직원은 이탈 큐를 진행시키지 못한다. */
async function requireDirector() { // requireDirector. 원장 이탈. ENROLLED 4신호.
    const session = await auth(); // JWT. 교사·직원은 이탈 큐를 진행시키지 못한다.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") { // 가드. 원장 이탈. ENROLLED 4신호.
        return null; // data.ts 조회는 페이지 requireRole이 가드. 쓰기는 여기서 다시 본다.
    }
    return session; // 반환. 원장 이탈. ENROLLED 4신호.
}

/**
 * DETECTED→COUNSELING, COUNSELING→IMPROVED.
 * IMPROVED·WITHDRAWN에서는 거절해 쪽지 액션과 역할을 나눈다.
 */
export async function advanceChurnCase(input: { // advanceChurnCase. 원장 이탈. ENROLLED 4신호.
    churnCaseId: string; // churnCaseId. 원장 이탈. ENROLLED 4신호.
}): Promise<ChurnActionResult> { // 블록 시작. 원장 이탈. ENROLLED 4신호.
    const session = await requireDirector(); // 원장만. DETECTED→COUNSELING, COUNSELING→IMPROVED. WITHDRAWN은 이 경로에 없다.
    if (!session) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "원장 권한이 필요합니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim(); // 빈 ID는 조회 전에 거절.
    if (!churnCaseId) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "이탈 케이스 ID가 없습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    const row = await prisma.churnCase.findUnique({ // row 시작. 원장 이탈. ENROLLED 4신호.
        where: { id: churnCaseId }, // 필터. 원장 이탈. ENROLLED 4신호.
        select: { id: true, status: true }, // 현재 상태만. IMPROVED·WITHDRAWN은 쪽지 액션과 역할을 나눈다.
    });

    if (!row) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    if (row.status === "DETECTED") { // 가드. 원장 이탈. ENROLLED 4신호.
        await prisma.churnCase.update({ // 상담 시작. 담당자를 원장으로 찍고 resolvedAt은 비운다.
            where: { id: row.id }, // 필터. 원장 이탈. ENROLLED 4신호.
            data: { // data 필드. 원장 이탈. ENROLLED 4신호.
                status: "COUNSELING", // status. 원장 이탈. ENROLLED 4신호.
                assignedUserId: session.user.id, // assignedUserId. 원장 이탈. ENROLLED 4신호.
                resolvedAt: null, // resolvedAt. 원장 이탈. ENROLLED 4신호.
            },
        });
        revalidatePath("/director/churn"); // 해당 화면 캐시만. redirect 없음.
        return { ok: true, message: "상담을 시작했습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    if (row.status === "COUNSELING") { // 가드. 원장 이탈. ENROLLED 4신호.
        await prisma.churnCase.update({ // 개선 처리. WITHDRAWN은 이 경로로 가지 않는다.
            where: { id: row.id }, // 필터. 원장 이탈. ENROLLED 4신호.
            data: { // data 필드. 원장 이탈. ENROLLED 4신호.
                status: "IMPROVED", // status. 원장 이탈. ENROLLED 4신호.
                resolvedAt: new Date(), // resolvedAt. 원장 이탈. ENROLLED 4신호.
            },
        });
        revalidatePath("/director/churn"); // 해당 화면 캐시만. redirect 없음.
        return { ok: true, message: "개선으로 처리했습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    return { // 반환. 원장 이탈. ENROLLED 4신호.
        ok: false, // ok 선택.
        message: "이 상태에서는 다음 단계로 진행할 수 없습니다.", // IMPROVED·WITHDRAWN은 sendChurnParentNote.
    };
}

/**
 * 개선·퇴원 상태에서만 학부모 Message(SENT)를 보낸다.
 * 상담 전 쪽지는 막는다. 수신자는 연결된 학부모만(학생 계정 제외).
 */
export async function sendChurnParentNote(input: { // sendChurnParentNote. 원장 이탈. ENROLLED 4신호.
    churnCaseId: string; // churnCaseId. 원장 이탈. ENROLLED 4신호.
}): Promise<ChurnActionResult> { // 블록 시작. 원장 이탈. ENROLLED 4신호.
    const session = await requireDirector(); // 원장만. IMPROVED·WITHDRAWN에서만 학부모 Message(SENT).
    if (!session) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "원장 권한이 필요합니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    const churnCaseId = String(input.churnCaseId ?? "").trim(); // churnCaseId. 원장 이탈. ENROLLED 4신호.
    if (!churnCaseId) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "이탈 케이스 ID가 없습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    const row = await prisma.churnCase.findUnique({ // row 시작. 원장 이탈. ENROLLED 4신호.
        where: { id: churnCaseId }, // 필터. 원장 이탈. ENROLLED 4신호.
        select: { // select 필드. 원장 이탈. ENROLLED 4신호.
            id: true, // id 선택.
            status: true, // 상담 전 쪽지는 막는다.
            summary: true, // summary 선택.
            student: { // student. 원장 이탈. ENROLLED 4신호.
                select: { // select 필드. 원장 이탈. ENROLLED 4신호.
                    id: true, // id 선택.
                    name: true, // name 선택.
                    parentLinks: { // parentLinks. 원장 이탈. ENROLLED 4신호.
                        where: { endedAt: null }, // 필터. 원장 이탈. ENROLLED 4신호.
                        select: { parentUserId: true }, // PARENT User. 학생 계정은 수신자가 아니다.
                    },
                },
            },
        },
    });

    if (!row) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "이탈 케이스를 찾을 수 없습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    if (row.status !== "IMPROVED" && row.status !== "WITHDRAWN") { // DETECTED·COUNSELING은 쪽지를 보내지 않는다.
        return { // 반환. 원장 이탈. ENROLLED 4신호.
            ok: false, // ok 선택.
            message: "개선·퇴원 상태에서만 쪽지를 보낼 수 있습니다.", // message. 원장 이탈. ENROLLED 4신호.
        };
    }

    const parentIds = [ // parentIds 시작. 원장 이탈. ENROLLED 4신호.
        ...new Set(row.student.parentLinks.map((l) => l.parentUserId)), // 전개. 원장 이탈. ENROLLED 4신호.
    ]; // 원장 이탈. ENROLLED 4신호.
    if (parentIds.length === 0) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { // 반환. 원장 이탈. ENROLLED 4신호.
            ok: false, // ok 선택.
            message: "연결된 학부모가 없어 쪽지를 보낼 수 없습니다.", // message. 원장 이탈. ENROLLED 4신호.
        };
    }

    const recipientIds = await expandParentRecipients( // 학부모만. 학생 계정은 뺀다.
        parentIds, // 원장 이탈. ENROLLED 4신호.
        session.user.id, // 원장 이탈. ENROLLED 4신호.
    );
    if (recipientIds.length === 0) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { // 반환. 원장 이탈. ENROLLED 4신호.
            ok: false, // ok 선택.
            message: "연결된 학부모가 없어 쪽지를 보낼 수 없습니다.", // message. 원장 이탈. ENROLLED 4신호.
        };
    }

    const title = `[이탈 케어] ${row.student.name} 학생 안내`; // title. 원장 이탈. ENROLLED 4신호.
    const content = [ // 요약이 있으면 그걸, 없으면 출결·학습 안내 문장.
        `${row.student.name} 학생 이탈 케어 관련 안내입니다.`, // 원장 이탈. ENROLLED 4신호.
        row.summary?.trim() // 원장 이탈. ENROLLED 4신호.
            ? `요약: ${row.summary.trim()}` // 삼항. 원장 이탈. ENROLLED 4신호.
            : "최근 출결·학습 상태를 함께 살펴봐 주시면 감사하겠습니다.", // 삼항 나머지. 원장 이탈. ENROLLED 4신호.
        "궁금한 점이 있으면 학원으로 문의해 주세요.", // 원장 이탈. ENROLLED 4신호.
    ].join("\n\n"); // sendChurnParentNote 끝.

    const now = new Date(); // now. 원장 이탈. ENROLLED 4신호.
    await prisma.message.create({ // 초안이 아니라 바로 SENT. 리포트 승인 쪽지와 같이 학부모 받은편지로 간다.
        data: { // data 필드. 원장 이탈. ENROLLED 4신호.
            title, // 원장 이탈. ENROLLED 4신호.
            content, // 원장 이탈. ENROLLED 4신호.
            deepLink: "/parent/inbox", // deepLink. 원장 이탈. ENROLLED 4신호.
            status: "SENT", // status. 원장 이탈. ENROLLED 4신호.
            audience: "PARENT", // audience. 원장 이탈. ENROLLED 4신호.
            sentAt: now, // sentAt. 원장 이탈. ENROLLED 4신호.
            sender: { connect: { id: session.user.id } }, // sender. 원장 이탈. ENROLLED 4신호.
            author: { connect: { id: session.user.id } }, // author. 원장 이탈. ENROLLED 4신호.
            recipients: { // recipients. 원장 이탈. ENROLLED 4신호.
                create: recipientIds.map((recipientUserId) => ({ // create. 원장 이탈. ENROLLED 4신호.
                    recipient: { connect: { id: recipientUserId } }, // recipient. 원장 이탈. ENROLLED 4신호.
                })),
            },
        },
    });

    revalidatePath("/director/churn"); // 해당 화면 캐시만. redirect 없음.
    revalidatePath("/parent/inbox"); // 해당 화면 캐시만. redirect 없음.
    revalidatePath("/student/inbox"); // 해당 화면 캐시만. redirect 없음.
    revalidatePath("/director/messages"); // 해당 화면 캐시만. redirect 없음.

    return { ok: true, message: "학부모에게 쪽지를 보냈습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
}

/**
 * 임계값 id=1을 upsert. 출석 %p 0~100, 연속 결석 1~30, 미납 1~90.
 * 저장만 하고 감지를 자동 실행하지는 않는다 → `runChurnDetection`.
 */
export async function saveChurnThreshold(input: { // saveChurnThreshold. 원장 이탈. ENROLLED 4신호.
    attendanceDropPercentPoint: number; // attendanceDropPercentPoint. 원장 이탈. ENROLLED 4신호.
    scoreDropPoints: number; // scoreDropPoints. 원장 이탈. ENROLLED 4신호.
    consecutiveAbsences: number; // consecutiveAbsences. 원장 이탈. ENROLLED 4신호.
    unpaidDays: number; // unpaidDays. 원장 이탈. ENROLLED 4신호.
}): Promise<ChurnActionResult> { // 블록 시작. 원장 이탈. ENROLLED 4신호.
    const session = await requireDirector(); // 원장만. 저장만 하고 감지를 자동 실행하지는 않는다 → runChurnDetection.
    if (!session) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "원장 권한이 필요합니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    const attendanceDropPercentPoint = Number( // 신호 4종 임계값. 출석 %p 0~100, 연속 결석 1~30, 미납 1~90.
        input.attendanceDropPercentPoint, // 원장 이탈. ENROLLED 4신호.
    );
    const scoreDropPoints = Number(input.scoreDropPoints); // scoreDropPoints. 원장 이탈. ENROLLED 4신호.
    const consecutiveAbsences = Number(input.consecutiveAbsences); // consecutiveAbsences. 원장 이탈. ENROLLED 4신호.
    const unpaidDays = Number(input.unpaidDays); // unpaidDays. 원장 이탈. ENROLLED 4신호.

    if ( // 가드. 원장 이탈. ENROLLED 4신호.
        !Number.isFinite(attendanceDropPercentPoint) || // 원장 이탈. ENROLLED 4신호.
        attendanceDropPercentPoint < 0 || // 원장 이탈. ENROLLED 4신호.
        attendanceDropPercentPoint > 100 // 원장 이탈. ENROLLED 4신호.
    ) { // 블록 시작. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "출석 하락(%p) 값이 올바르지 않습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }
    if (!Number.isFinite(scoreDropPoints) || scoreDropPoints < 0) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "성적 하락 값이 올바르지 않습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }
    if ( // 가드. 원장 이탈. ENROLLED 4신호.
        !Number.isInteger(consecutiveAbsences) || // 원장 이탈. ENROLLED 4신호.
        consecutiveAbsences < 1 || // 원장 이탈. ENROLLED 4신호.
        consecutiveAbsences > 30 // 원장 이탈. ENROLLED 4신호.
    ) { // 블록 시작. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "연속 결석 횟수가 올바르지 않습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }
    if ( // 가드. 원장 이탈. ENROLLED 4신호.
        !Number.isInteger(unpaidDays) || // 원장 이탈. ENROLLED 4신호.
        unpaidDays < 1 || // 원장 이탈. ENROLLED 4신호.
        unpaidDays > 90 // 원장 이탈. ENROLLED 4신호.
    ) { // 블록 시작. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "미납 일수가 올바르지 않습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    await prisma.churnThresholdConfig.upsert({ // 싱글톤 id=1. 감지기(`detectChurnCases`)가 이 값을 읽는다.
        where: { id: 1 }, // 필터. 원장 이탈. ENROLLED 4신호.
        create: { // create. 원장 이탈. ENROLLED 4신호.
            id: 1, // id. 원장 이탈. ENROLLED 4신호.
            attendanceDropPercentPoint, // 원장 이탈. ENROLLED 4신호.
            scoreDropPoints, // 원장 이탈. ENROLLED 4신호.
            consecutiveAbsences, // 원장 이탈. ENROLLED 4신호.
            unpaidDays, // 원장 이탈. ENROLLED 4신호.
            updatedBy: session.user.id, // updatedBy. 원장 이탈. ENROLLED 4신호.
        },
        update: { // update. 원장 이탈. ENROLLED 4신호.
            attendanceDropPercentPoint, // 원장 이탈. ENROLLED 4신호.
            scoreDropPoints, // 원장 이탈. ENROLLED 4신호.
            consecutiveAbsences, // 원장 이탈. ENROLLED 4신호.
            unpaidDays, // 원장 이탈. ENROLLED 4신호.
            updatedBy: session.user.id, // updatedBy. 원장 이탈. ENROLLED 4신호.
        },
    });

    revalidatePath("/director/churn"); // 임계값 폼만. 감지는 별도 버튼(runChurnDetection).
    return { ok: true, message: "임계값을 저장했습니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
}

/**
 * ENROLLED 재원생을 스캔해 신호 4종을 케이스에 쌓는다 (`detectChurnCases`).
 */
export async function runChurnDetection(): Promise<ChurnActionResult> { // runChurnDetection. 원장 이탈. ENROLLED 4신호.
    const session = await requireDirector(); // 원장만. ENROLLED 재원생을 스캔해 신호 4종을 케이스에 쌓는다.
    if (!session) { // 가드. 원장 이탈. ENROLLED 4신호.
        return { ok: false, message: "원장 권한이 필요합니다." }; // 반환. 원장 이탈. ENROLLED 4신호.
    }

    try { // 실패 시 템플릿/롤백. 원장 이탈. ENROLLED 4신호.
        const result = await detectChurnCases(); // ENROLLED 전원 + 신호 4종(출석 하락·성적 하락·연속 결석·미납). 임계값은 DB id=1.
        revalidatePath("/director/churn"); // 이탈 큐.
        revalidatePath("/director/dashboard"); // 원장 홈 열린 이탈 숫자.

        return { // 반환. 원장 이탈. ENROLLED 4신호.
            ok: true, // ok 선택.
            message: `감지 완료: 학생 ${result.scanned}명 · 신규 ${result.created} · 갱신 ${result.updated} · 신호 ${result.signalCount}`, // message. 원장 이탈. ENROLLED 4신호.
        };
    } catch (error) { // 블록 시작. 원장 이탈. ENROLLED 4신호.
        return { // 반환. 원장 이탈. ENROLLED 4신호.
            ok: false, // ok 선택.
            message: // message. 원장 이탈. ENROLLED 4신호.
                error instanceof Error // 원장 이탈. ENROLLED 4신호.
                    ? error.message // 삼항. 원장 이탈. ENROLLED 4신호.
                    : "이탈 감지 중 오류가 발생했습니다.", // 부분 케이스를 화면 메시지로만 알린다.
        };
    }
}
