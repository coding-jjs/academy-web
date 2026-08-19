"use server"; // Server Action. 브라우저가 Prisma를 직접 치지 않는다.

/**
 * 원장이 승인 대기 리포트를 학부모 Message(SENT)로 발송하거나 반려한다.
 *
 * 호출: `(director)/director/reports/DirectorReportsScreen`.
 * 승인: Message.status=SENT + AiReport.status=SENT 를 한 트랜잭션으로 맞춘다.
 * 반려: Message를 만들지 않고 REJECTED로 되돌린다. 교사가 다시 DRAFTING할 수 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 초안 작성·AI 재생성 → `staff-actions.ts`.
 * - FAILED 재시도·직접 학부모 알림톡은 하지 않는다.
 *
 * 관련: `expandParentRecipients`, `writeAuditLog`.
 */

import { revalidatePath } from "next/cache"; // 큐·받은편지.
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit"; // 승인·반려 로그.
import { auth } from "@/lib/auth"; // JWT 역할.
import { prisma } from "@/lib/db"; // server-only Prisma.
import { expandParentRecipients } from "@/features/messages/recipients"; // 학부모만. 학생 계정 제외.

type ActionResult = // redirect 없이 화면 메시지.
    | { ok: true; message?: string } // 성공해도 redirect 없이 화면이 메시지를 띄운다.
    | { ok: false; message: string }; // 실패 안내.

/** 원장 세션만. 교사·직원은 승인 큐를 돌리지 못한다. */
async function requireDirector() { // staff-actions의 승인 요청과 역할을 나눈다.
    const session = await auth(); // JWT. 교사·직원이 승인·반려를 직접 돌리지 못하게 역할을 다시 본다.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") { // 교사·직원 거절.
        return null; // staff-actions의 승인 요청만 허용. 여기서는 거절.
    }
    return session; // 원장만 Message SENT와 리포트 SENT를 같은 tx에서 맞출 수 있다.
}

/**
 * PENDING_APPROVAL 리포트를 학부모 받은편지에 SENT 메시지로 넣고 리포트도 SENT로 잠근다.
 * 연결된 학부모가 없으면 발송하지 않아, 승인만 되고 수신자가 없는 상태를 막는다.
 */
export async function approveAndSendReport(input: { // 반려와 달리 Message를 만든다.
    reportId: string; // AiReport PK.
}): Promise<ActionResult> { // redirect 없음.
    const session = await requireDirector(); // 원장만. 승인 시 Message SENT와 리포트 SENT를 같은 트랜잭션에서 맞춘다.
    if (!session) { // 교사 거절.
        return { ok: false, message: "원장 권한이 필요합니다." }; // 승인 큐를 안 돌린다.
    }

    const reportId = String(input.reportId ?? "").trim(); // 빈 ID는 조회 전에 거절.
    if (!reportId) { // 빈 키.
        return { ok: false, message: "리포트 ID가 없습니다." }; // DB 조회 전.
    }

    try { // tx 실패 시 부분 발송이 남지 않는다.
        const report = await prisma.aiReport.findUnique({ // 발송 전 검증.
            where: { id: reportId }, // PK.
            select: { // 상태·본문·학부모.
                id: true, // PK.
                status: true, // PENDING_APPROVAL이 아니면 발송하지 않는다.
                content: true, // 빈 초안은 Message를 만들지 않는다.
                studentId: true, // 학부모 링크 조회.
                authorUserId: true, // 쪽지 작성자. 없으면 원장.
                student: { select: { name: true } }, // 쪽지 제목용 표시명.
            },
        });

        if (!report) { // 없는 PK.
            return { ok: false, message: "리포트를 찾을 수 없습니다." }; // 생성하지 않음.
        }

        if (report.status !== "PENDING_APPROVAL") { // DRAFTING·SENT·REJECTED는 이 액션으로 보내지 않는다.
            return { // 상태 불일치.
                ok: false, // 발송 안 함.
                message: "승인 대기 상태의 리포트만 발송할 수 있습니다.", // 큐만.
            };
        }

        if (!report.content.trim()) { // 빈 초안은 Message를 만들지 않는다.
            return { // 본문 없음.
                ok: false, // Message 없음.
                message: "본문이 비어 있어 발송할 수 없습니다.", // 교사 검수.
            };
        }

        const parents = await prisma.parentStudentLink.findMany({ // 활성 링크만.
            where: { // 종료 링크 제외.
                studentId: report.studentId, // 해당 자녀.
                endedAt: null, // 종료된 링크는 수신자가 아니다.
            },
            select: { parentUserId: true }, // PARENT User id. 학생 계정은 넣지 않는다.
        });

        if (parents.length === 0) { // 승인만 되고 수신자가 없는 상태를 막는다.
            return { // 발송 안 함.
                ok: false, // Message 없음.
                message: // 연결 먼저.
                    "연결된 학부모가 없어 발송할 수 없습니다. 학부모 연결 후 다시 시도하세요.", // 안내.
            };
        }

        const parentIds = parents.map((p) => p.parentUserId); // 링크된 학부모만.
        const recipientIds = await expandParentRecipients( // 학부모 id만 수신자로. 연결된 학생 계정은 넣지 않는다.
            parentIds, // PARENT User.
            session.user.id, // 발신자 제외용.
        );

        if (recipientIds.length === 0) { // expand 후 비면.
            return { // 발송 안 함.
                ok: false, // Message 없음.
                message: "연결된 학부모가 없어 발송할 수 없습니다.", // 안내.
            };
        }

        const now = new Date(); // sentAt·approvedAt을 같은 시각으로 맞춘다.
        const metadata = await getAuditRequestMetadata(); // 감사 로그.
        const title = `${report.student.name} 학습 리포트`; // 학부모 받은편지 제목.
        const authorUserId = report.authorUserId || session.user.id; // 초안 작성자. 없으면 승인자.

        await prisma.$transaction(async (tx) => { // 승인 → Message SENT + AiReport SENT를 한 번에. 한쪽만 성공하면 롤백.
            const fresh = await tx.aiReport.findUnique({ // 동시성.
                where: { id: report.id }, // PK.
                select: { status: true }, // 트랜잭션 안에서 다시 읽어 동시 승인·반려를 거절한다.
            });
            if (!fresh || fresh.status !== "PENDING_APPROVAL") { // 이미 처리됨.
                throw new Error( // tx 롤백.
                    "승인 대기 상태의 리포트만 발송할 수 있습니다.", // 메시지.
                );
            }

            await tx.message.create({ // 학부모 받은편지. status=SENT, 리포트에 연결.
                data: { // SENT 같은 tx.
                    title, // 제목.
                    content: report.content, // 초안 본문 그대로. 여기서 다시 쓰지 않는다.
                    deepLink: "/parent/reports", // 학부모 리포트 화면. 학생 inbox 딥링크가 아니다.
                    status: "SENT", // 직원 쪽지처럼 PENDING_APPROVAL을 거치지 않는다.
                    audience: "PARENT", // 학부모.
                    approvedAt: now, // 승인 시각.
                    sentAt: now, // 발송 시각. 리포트 sentAt과 맞춤.
                    sender: { connect: { id: authorUserId } }, // 작성 교사.
                    author: { connect: { id: authorUserId } }, // 작성자.
                    approver: { connect: { id: session.user.id } }, // 원장.
                    report: { connect: { id: report.id } }, // AiReport 연결.
                    recipients: { // PARENT만.
                        create: recipientIds.map((recipientUserId) => ({ // 한 명씩.
                            recipient: { connect: { id: recipientUserId } }, // PARENT User만.
                        })),
                    },
                },
            });

            const updated = await tx.aiReport.updateMany({ // SENT 잠금.
                where: { id: report.id, status: "PENDING_APPROVAL" }, // 동시 반려와 경합하면 count=0.
                data: { // 발송본.
                    status: "SENT", // 초안이 아니라 발송본. 학부모 parent-data는 이 상태만 조회한다.
                    approverUserId: session.user.id, // 원장.
                    approvedAt: now, // Message와 같은 시각.
                    sentAt: now, // Message sentAt과 맞춤.
                    rejectionReason: null, // 승인 시 반려 사유 비움.
                },
            });

            if (updated.count !== 1) { // 경합.
                throw new Error("이미 다른 요청에서 처리된 리포트입니다."); // tx 롤백. 부분 발송이 남지 않는다.
            }

            await writeAuditLog(tx, { // 승인 로그. 수신 인원만 남긴다.
                actorUserId: session.user.id, // 원장.
                action: "REPORT_APPROVED", // 승인.
                targetType: "AI_REPORT", // 대상.
                targetId: report.id, // PK.
                details: { recipientCount: recipientIds.length }, // 인원만.
                metadata, // 요청 메타.
            });
        });
    } catch (error) { // 롤백 후 메시지.
        return { // 부분 발송 없음.
            ok: false, // 실패.
            message: // 사용자 문장.
                error instanceof Error // 검증 메시지 재사용.
                    ? error.message // 동시 처리·검증 메시지.
                    : "승인·발송에 실패했습니다.", // 부분 발송이 남지 않게 tx가 롤백한다.
        };
    }

    revalidatePath("/director/reports"); // 원장 큐.
    revalidatePath("/teacher/reports"); // 교사 편집기 — 잠긴 SENT.
    revalidatePath("/parent/reports"); // 학부모 SENT 목록.
    revalidatePath("/parent/inbox"); // 받은편지.
    revalidatePath("/student/inbox"); // 학생 받은편지는 수신자가 없어도 경로를 맞춰 둔다.
    revalidatePath("/director/messages"); // 원장 쪽지 목록에 발송본이 보이게.

    return { ok: true, message: "승인·발송 완료" }; // redirect 없이 화면이 message를 띄운다.
}

/**
 * 승인 대기 리포트를 REJECTED로 되돌린다. Message는 만들지 않는다(초안 워크플로 유지).
 * 반려 사유는 교사 편집기에 보여, 수정 후 다시 승인 요청하게 한다.
 */
export async function rejectReport(input: { // 승인 경로와 달리 쪽지 없음.
    reportId: string; // AiReport PK.
    rejectionReason: string; // 필수. 교사 편집기.
}): Promise<ActionResult> { // redirect 없음.
    const session = await requireDirector(); // 원장만. 반려는 Message를 만들지 않고 REJECTED로만 되돌린다.
    if (!session) { // 교사 거절.
        return { ok: false, message: "원장 권한이 필요합니다." }; // 반려 안 함.
    }

    const reportId = String(input.reportId ?? "").trim(); // PK.
    const rejectionReason = String(input.rejectionReason ?? "").trim(); // 사유 필수. 교사가 수정 후 다시 승인 요청하게 한다.

    if (!reportId) { // 빈 키.
        return { ok: false, message: "리포트 ID가 없습니다." }; // 조회 전.
    }
    if (!rejectionReason) { // 사유 없음.
        return { ok: false, message: "반려 사유를 입력해 주세요." }; // Message 없이 거절만.
    }

    const metadata = await getAuditRequestMetadata(); // 감사.
    const updated = await prisma.$transaction(async (tx) => { // PENDING_APPROVAL만 REJECTED. 쪽지(Message)는 생성하지 않는다.
        const result = await tx.aiReport.updateMany({ // SENT는 안 되돌림.
            where: { id: reportId, status: "PENDING_APPROVAL" }, // SENT는 되돌리지 않는다.
            data: { // REJECTED.
                status: "REJECTED", // SENT가 아니라 교사의 EDITABLE 집합. 다시 저장·승인요청 가능.
                rejectionReason, // 교사 편집기에 보여 준다.
                approverUserId: session.user.id, // 반려한 원장.
                approvedAt: null, // 발송 시각을 남기지 않는다.
                sentAt: null, // 발송 아님.
            },
        });

        if (result.count === 1) { // 성공 시에만 로그.
            await writeAuditLog(tx, { // 반려 사유를 남긴다. 학부모 받은편지에는 아무것도 안 간다.
                actorUserId: session.user.id, // 원장.
                action: "REPORT_REJECTED", // 반려.
                targetType: "AI_REPORT", // 대상.
                targetId: reportId, // PK.
                details: { rejectionReason }, // 사유.
                metadata, // 요청 메타.
            });
        }

        return result.count; // 0이면 이미 처리됨.
    });

    if (updated !== 1) { // 경합·없음.
        return { // 학부모 쪽지 없음.
            ok: false, // 실패.
            message: "리포트가 없거나 이미 다른 요청에서 처리되었습니다.", // 안내.
        };
    }

    revalidatePath("/director/reports"); // 원장 큐.
    revalidatePath("/teacher/reports"); // 교사 편집기만. 학부모 화면은 건드리지 않는다(쪽지가 없으므로).

    return { ok: true, message: "반려 처리 완료" }; // Message 없음.
}
