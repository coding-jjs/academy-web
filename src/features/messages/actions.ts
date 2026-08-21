"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

/**
 * 쪽지 즉시 발송·승인 요청·승인·반려.
 *
 * 호출: `MessageComposer`가 원장 즉시 발송 / 직원 승인 요청을,
 * `MessageListPanel`이 승인·일괄 승인·반려를 호출한다.
 *
 * 원장은 SENT로 바로 넣고 수신 행을 만든다.
 * 직원 요청은 PENDING_APPROVAL만 만들고, 원장 승인 후에야 SENT·수신 행이 생긴다.
 * 미승인 방송이 학부모/학생 인박스에 나가지 않게 하기 위함이다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 읽음 처리 → `inbox-actions.ts`.
 * - 수신 User id 계산 → `recipients.ts`.
 *
 * 관련: `recipients.ts`, `target-filter.ts`, `data.ts`.
 */

import { revalidatePath } from "next/cache"; // 화면 캐시. 역할 경로만.
import { getAuditRequestMetadata, writeAuditLog } from "@/lib/audit"; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
import { auth } from "@/lib/auth"; // JWT 세션. 폼에서 userId를 받지 않는다.
import { prisma } from "@/lib/db"; // server-only Prisma. 브라우저가 직접 치지 않는다.
import { userHasPermission } from "@/lib/permission-guard"; // 권한 키. 역할만으로는 부족.
import { getStaffScope } from "@/lib/staff-scope"; // 직원 스코프. 원장은 전 원생.
import { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    resolveRecipientUserIds, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    type MessageAudience as Audience, // MessageAudience 타입. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
} from "@/features/messages/recipients"; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
import type { MessageTargetFilter } from "@/features/messages/types"; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
import { parseTargetFilter } from "@/features/messages/target-filter"; // 저장된 필터 파싱. 빈 객체로 전원 발송 금지.
import { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    Prisma, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    type MessageAudience, // MessageAudience 타입. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
} from "@/generate/prisma/client"; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

/** 쪽지 저장 결과. 성공해도 redirect하지 않고 화면이 메시지를 띄운다. */
export type MessageActionResult = // MessageActionResult 타입. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    | { ok: true; message?: string; messageId?: string; recipientCount?: number } // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    | { ok: false; message: string }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

function revalidateMessagePaths() { // revalidateMessagePaths. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    revalidatePath("/director/messages"); // 원장 즉시 발송·승인 큐.
    revalidatePath("/teacher/messages"); // 교사 승인 요청 목록.
    revalidatePath("/employee/messages"); // 직원 승인 요청 목록.
    revalidatePath("/parent/inbox"); // SENT + 수신 행이 있어야 학부모 인박스에 보인다.
    revalidatePath("/student/inbox"); // 학생은 /student/ deepLink만.
    revalidatePath("/parent/dashboard"); // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    revalidatePath("/student/dashboard"); // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
}

async function requireDirector() { // requireDirector. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await auth(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") return null; // 즉시 발송·승인·반려는 원장만.
    return session; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
}

async function requireStaffWithSendPermission() { // requireStaffWithSendPermission. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await auth(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if ( // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        !session?.user?.id || // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF") // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    ) { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return null; // 역할만으로는 부족.
    }
    const allowed = await userHasPermission(session.user.id, "sendMessage"); // 권한 키. 역할만으로는 부족.
    if (!allowed) return null; // 꺼진 직원은 승인 큐에 올리지 못한다.
    return session; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
}

/**
 * 원장이 학부모 또는 학생에게 즉시 발송한다.
 * status=SENT, sentAt/approvedAt를 지금으로 두고 수신 행을 같이 만든다.
 * 직원 승인 큐(`submitMessageForApproval`)와 달리 대기 상태를 거치지 않는다.
 */
export async function directorSendMessage(input: { // directorSendMessage. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    title: string; // 제목. 서버가 길이를 다시 본다.
    content: string; // 쪽지 본문. PENDING은 인박스에 안 나간다.
    audience: "PARENT" | "STUDENT" | Audience; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    targetStudentId?: string; // 원생 카드. 승인 때 스코프로 다시 펼친다.
    targetClassId?: string; // targetClassId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    targetStudentIds?: string[]; // 학생 체크 목록. 학부모 User id가 아니다.
    targetParentUserIds?: string[]; // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    broadcast?: boolean; // 목록 요약 '전체 발송'. 수신 전원 플래그가 아니다.
}): Promise<MessageActionResult> { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." }; // 직원은 submitMessageForApproval을 탄다.

    const title = String(input.title ?? "").trim(); // 제목. 서버가 길이를 다시 본다.
    const content = String(input.content ?? "").trim(); // 쪽지 본문. PENDING은 인박스에 안 나간다.
    const audience = input.audience; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    if (!title) return { ok: false, message: "제목을 입력해 주세요." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (!content) return { ok: false, message: "본문을 입력해 주세요." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (audience !== "PARENT" && audience !== "STUDENT") { // 학부모 분기. 학생 계정 수신과 나눈다.
        return { ok: false, message: "수신 대상이 올바르지 않습니다." }; // ALL/STAFF는 이 작곡기가 보내지 않는다.
    }

    const targetStudentIds = [ // 학생 체크 목록. 학부모 User id가 아니다.
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (input.targetStudentIds ?? []) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .map((id) => String(id ?? "").trim()) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .filter(Boolean), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ),
    ]; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const targetParentUserIds = [ // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (input.targetParentUserIds ?? []) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .map((id) => String(id ?? "").trim()) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .filter(Boolean), // 학부모는 userId. 학생 계정 id가 아니다.
        ),
    ]; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const targetStudentId = input.targetStudentId?.trim() || null; // 원생 카드. 승인 때 스코프로 다시 펼친다.
    const targetClassId = input.targetClassId?.trim() || null; // targetClassId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    if ( // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience === "STUDENT" && // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentIds.length === 0 && // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        !targetStudentId && // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        !targetClassId // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    ) { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "학생을 선택해 주세요." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }
    if ( // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience === "PARENT" && // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetParentUserIds.length === 0 && // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        !targetStudentId && // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        !targetClassId // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    ) { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "학부모를 선택해 주세요." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const resolved = await resolveRecipientUserIds({ // 수신 User id. 학부모는 학생 계정 제외.
        actorUserId: session.user.id, // actorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentId, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetClassId, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentIds: // 학생 체크 목록. 학부모 User id가 아니다.
            audience === "STUDENT" && targetStudentIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                ? targetStudentIds // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                : null, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetParentUserIds: // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            audience === "PARENT" && targetParentUserIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                ? targetParentUserIds // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                : null, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        scope: null, // 원장은 전 원생. PARENT면 학생 계정은 빼고 학부모만.
    });
    if (!resolved.ok) return resolved; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (resolved.userIds.length === 0) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "수신 대상이 없습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const targetFilter: MessageTargetFilter | null = // targetFilter. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience === "STUDENT" && targetStudentIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                  studentIds: targetStudentIds, // studentIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                  ...(input.broadcast ? { broadcast: true } : {}), // 목록 요약 "전체 발송". 수신 행은 resolved.userIds로 만든다.
              }
            : audience === "PARENT" && targetParentUserIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
              ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    parentUserIds: targetParentUserIds, // 학부모 User. 학생 계정이 섞이면 거절.
                    ...(input.broadcast ? { broadcast: true } : {}), // 전개. 알 수 없는 키를 통과시키지 않는다.
                }
              : null; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    const representativeStudentId = // representativeStudentId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentIds[0] ?? targetStudentId ?? null; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const now = new Date(); // now. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const metadata = await getAuditRequestMetadata(); // metadata. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const created = await prisma.$transaction(async (tx) => { // created. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        const message = await tx.message.create({ // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            data: { // data. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                title, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                content, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                deepLink: null, // 학생은 /student/만. 학부모 경로를 막는다.
                status: "SENT", // 대기 없이 SENT. 직원 PENDING_APPROVAL과 달리 수신 create가 있다.
                audience: audience as MessageAudience, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
                sentAt: now, // sentAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                approvedAt: now, // approvedAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                targetFilter: // targetFilter. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    targetFilter === null // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                        ? Prisma.JsonNull // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                        : (targetFilter as Prisma.InputJsonValue), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                sender: { connect: { id: session.user.id } }, // sender. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                author: { connect: { id: session.user.id } }, // author. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                approver: { connect: { id: session.user.id } }, // approver. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                ...(representativeStudentId // 전개. 알 수 없는 키를 통과시키지 않는다.
                    ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                          targetStudent: { // targetStudent. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                              connect: { id: representativeStudentId }, // connect. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                          },
                      }
                    : {}), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                ...(targetClassId // 전개. 알 수 없는 키를 통과시키지 않는다.
                    ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                          targetClass: { // targetClass. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                              connect: { id: targetClassId }, // connect. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                          },
                      }
                    : {}), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                recipients: { // recipients. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    create: resolved.userIds.map((recipientUserId) => ({ // create. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                        recipient: { connect: { id: recipientUserId } }, // 지금 만든다. PENDING 직원 요청은 승인 전까지 이 create가 없다.
                    })),
                },
            },
            select: { id: true }, // select. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        });

        await writeAuditLog(tx, { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            actorUserId: session.user.id, // actorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            action: "MESSAGE_SENT", // action. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            targetType: "MESSAGE", // targetType. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            targetId: message.id, // targetId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            details: { // details. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                audience, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                recipientCount: resolved.userIds.length, // SENT만 수신 행 수. PENDING은 0.
            },
            metadata, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        });

        return message; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    });

    revalidateMessagePaths(); // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ok: true, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        message: `${resolved.userIds.length}명에게 발송했습니다.`, // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        messageId: created.id, // Message 행. 인박스 recipientId와 다르다.
        recipientCount: resolved.userIds.length, // 학부모/학생 인박스에 바로 보인다.
    };
}

/**
 * 직원이 원장 승인 큐에 올린다.
 * PENDING_APPROVAL만 만들고 수신 행은 만들지 않는다 — 승인 전에 인박스에 뜨면 안 된다.
 * 수신자 수는 미리 계산해 "예상 수신 N명" 안내에만 쓴다.
 */
export async function submitMessageForApproval(input: { // submitMessageForApproval. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    title: string; // 제목. 서버가 길이를 다시 본다.
    content: string; // 쪽지 본문. PENDING은 인박스에 안 나간다.
    audience: "PARENT" | "STUDENT"; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    targetStudentId?: string; // 원생 카드. 승인 때 스코프로 다시 펼친다.
    targetClassId?: string; // targetClassId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    targetStudentIds?: string[]; // 학생 체크 목록. 학부모 User id가 아니다.
    targetParentUserIds?: string[]; // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    broadcast?: boolean; // 목록 요약 '전체 발송'. 수신 전원 플래그가 아니다.
}): Promise<MessageActionResult> { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await requireStaffWithSendPermission(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ok: false, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            message: "쪽지 발송 권한이 없습니다. 원장에게 권한 부여를 요청하세요.", // 원장 즉시 발송과 경로를 나눈다.
        };
    }

    const title = String(input.title ?? "").trim(); // 제목. 서버가 길이를 다시 본다.
    const content = String(input.content ?? "").trim(); // 쪽지 본문. PENDING은 인박스에 안 나간다.
    const audience = input.audience; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    if (!title) return { ok: false, message: "제목을 입력해 주세요." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (!content) return { ok: false, message: "본문을 입력해 주세요." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (audience !== "PARENT" && audience !== "STUDENT") { // 학부모 분기. 학생 계정 수신과 나눈다.
        return { ok: false, message: "수신 대상이 올바르지 않습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const targetStudentIds = [ // 학생 체크 목록. 학부모 User id가 아니다.
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (input.targetStudentIds ?? []) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .map((id) => String(id ?? "").trim()) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .filter(Boolean), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ),
    ]; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const targetParentUserIds = [ // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (input.targetParentUserIds ?? []) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .map((id) => String(id ?? "").trim()) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .filter(Boolean), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ),
    ]; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const targetStudentId = input.targetStudentId?.trim() || null; // 원생 카드. 승인 때 스코프로 다시 펼친다.
    const targetClassId = input.targetClassId?.trim() || null; // targetClassId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    if (audience === "STUDENT" && targetStudentIds.length === 0 && !targetStudentId && !targetClassId) { // 학생 분기. /student/ 링크만.
        return { ok: false, message: "학생을 선택해 주세요." }; // 직원은 스코프 밖 학생을 고를 수 없다.
    }
    if (audience === "PARENT" && targetParentUserIds.length === 0 && !targetStudentId && !targetClassId) { // 학부모 분기. 학생 계정 수신과 나눈다.
        return { ok: false, message: "학부모를 선택해 주세요." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const scope = await getStaffScope(session.user.id); // 직원 스코프. 원장은 전 원생.
    const resolved = await resolveRecipientUserIds({ // 수신 User id. 학부모는 학생 계정 제외.
        actorUserId: session.user.id, // actorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentId, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetClassId, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentIds: // 학생 체크 목록. 학부모 User id가 아니다.
            audience === "STUDENT" && targetStudentIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                ? targetStudentIds // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                : null, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetParentUserIds: // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            audience === "PARENT" && targetParentUserIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                ? targetParentUserIds // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                : null, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        scope, // 작성자 스코프. PARENT면 학생 계정은 빼고 학부모만. 수는 안내용.
    });
    if (!resolved.ok) return resolved; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (resolved.userIds.length === 0) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "수신 대상이 없습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const targetFilter: MessageTargetFilter | null = // targetFilter. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience === "STUDENT" && targetStudentIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                  studentIds: targetStudentIds, // studentIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                  ...(input.broadcast ? { broadcast: true } : {}), // 전개. 알 수 없는 키를 통과시키지 않는다.
              }
            : audience === "PARENT" && targetParentUserIds.length > 0 // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
              ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    parentUserIds: targetParentUserIds, // 학부모 User. 학생 계정이 섞이면 거절.
                    ...(input.broadcast ? { broadcast: true } : {}), // 전개. 알 수 없는 키를 통과시키지 않는다.
                }
              : null; // 승인 시 다시 펼칠 Json. 수신 행은 아직 없다.

    const now = new Date(); // now. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const representativeStudentId = // representativeStudentId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentIds[0] ?? targetStudentId ?? null; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const created = await prisma.message.create({ // created. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        data: { // data. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            title, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            content, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            deepLink: null, // 학생은 /student/만. 학부모 경로를 막는다.
            status: "PENDING_APPROVAL", // 수신 create 없음. MessageRecipient는 approveMessageCore에서 생긴다.
            audience: audience as MessageAudience, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
            submittedAt: now, // submittedAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            targetFilter: // targetFilter. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                targetFilter === null // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    ? Prisma.JsonNull // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    : (targetFilter as Prisma.InputJsonValue), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            sender: { connect: { id: session.user.id } }, // sender. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            author: { connect: { id: session.user.id } }, // author. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ...(representativeStudentId // 전개. 알 수 없는 키를 통과시키지 않는다.
                ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                      targetStudent: { // targetStudent. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                          connect: { id: representativeStudentId }, // connect. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                      },
                  }
                : {}), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ...(targetClassId // 전개. 알 수 없는 키를 통과시키지 않는다.
                ? { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                      targetClass: { // targetClass. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                          connect: { id: targetClassId }, // connect. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                      },
                  }
                : {}), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        },
        select: { id: true }, // select. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    });

    revalidateMessagePaths(); // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ok: true, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        message: `승인 요청했습니다. (예상 수신 ${resolved.userIds.length}명)`, // 인박스에는 아직 안 나간다.
        messageId: created.id, // Message 행. 인박스 recipientId와 다르다.
        recipientCount: resolved.userIds.length, // SENT만 수신 행 수. PENDING은 0.
    };
}

/**
 * 원장이 대기 쪽지 한 건을 승인·발송한다. 실제 전환은 `approveMessageCore`.
 */
export async function approveMessage(input: { // approveMessage. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    messageId: string; // Message 행. 인박스 recipientId와 다르다.
}): Promise<MessageActionResult> { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." }; // 직원이 타 작성 건을 승인하지 못하게.
    const result = await approveMessageCore(session.user.id, input.messageId); // result. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (result.ok) revalidateMessagePaths(); // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    return result; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
}

/**
 * 원장이 고른 대기 쪽지를 순서대로 승인한다.
 * 일부만 실패해도 성공 건은 발송된 채로 두고, 메시지를 합쳐 돌려준다.
 */
export async function approveMessages(input: { // approveMessages. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    messageIds: string[]; // messageIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
}): Promise<MessageActionResult> { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    const messageIds = [ // messageIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ...new Set( // 전개. 알 수 없는 키를 통과시키지 않는다.
            (input.messageIds ?? []) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .map((id) => String(id ?? "").trim()) // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                .filter(Boolean), // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ),
    ]; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (messageIds.length === 0) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "승인할 쪽지를 선택해 주세요." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    let successCount = 0; // successCount. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    let failureCount = 0; // failureCount. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const failureMessages: string[] = []; // failureMessages. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    for (const messageId of messageIds) { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        const result = await approveMessageCore(session.user.id, messageId); // 한 건 실패가 나머지를 막지 않는다. 성공 건은 발송된 채.
        if (result.ok) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            successCount += 1; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        } else { // else. 로직은 그대로.
            failureCount += 1; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            if (result.message) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                failureMessages.push(result.message); // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            }
        }
    }

    if (successCount > 0) revalidateMessagePaths(); // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    if (failureCount === 0) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ok: true, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            message: `${successCount}건 승인·발송 완료`, // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        };
    }

    if (successCount === 0) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ok: false, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            message: // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                failureMessages[0] ?? // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                "선택한 쪽지를 승인·발송하지 못했습니다.", // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        };
    }

    return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ok: true, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        message: `${successCount}건 승인·발송 완료, ${failureCount}건 실패`, // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    };
}

async function approveMessageCore( // approveMessageCore. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    approverUserId: string, // approverUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    messageIdInput: string, // messageIdInput. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
): Promise<MessageActionResult> { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const messageId = String(messageIdInput ?? "").trim(); // Message 행. 인박스 recipientId와 다르다.
    if (!messageId) return { ok: false, message: "쪽지 ID가 없습니다." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    const row = await prisma.message.findUnique({ // 저장 행. 삭제는 없다.
        where: { id: messageId }, // where. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        select: { // select. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            id: true, // id. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            status: true, // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
            title: true, // 제목. 서버가 길이를 다시 본다.
            content: true, // 쪽지 본문. PENDING은 인박스에 안 나간다.
            audience: true, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
            targetStudentId: true, // 원생 카드. 승인 때 스코프로 다시 펼친다.
            targetClassId: true, // targetClassId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            targetFilter: true, // targetFilter. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            authorUserId: true, // authorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            senderUserId: true, // senderUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        },
    });

    if (!row) return { ok: false, message: "쪽지를 찾을 수 없습니다." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (row.status !== "PENDING_APPROVAL") { // 직원 요청. 수신 행이 없어 인박스에 없다.
        return { ok: false, message: "승인 대기 상태만 처리할 수 있습니다." }; // 이미 SENT면 수신 행을 또 만들지 않는다.
    }
    if ( // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        !row.audience || // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        (row.audience !== "PARENT" && row.audience !== "STUDENT") // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    ) { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "수신 대상 정보가 올바르지 않습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const authorId = row.authorUserId ?? row.senderUserId; // authorId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (!authorId) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "작성자 정보가 없습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const targetFilter = parseTargetFilter(row.targetFilter); // targetFilter. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    const scope = await getStaffScope(authorId); // 원장 스코프가 아니라 작성자 스코프로 다시 펼친다.
    const resolved = await resolveRecipientUserIds({ // 수신 User id. 학부모는 학생 계정 제외.
        actorUserId: authorId, // actorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        audience: row.audience, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
        targetStudentId: row.targetStudentId, // 원생 카드. 승인 때 스코프로 다시 펼친다.
        targetClassId: row.targetClassId, // targetClassId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        targetStudentIds: targetFilter?.studentIds ?? null, // 학생 체크 목록. 학부모 User id가 아니다.
        targetParentUserIds: targetFilter?.parentUserIds ?? null, // targetParentUserIds. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        scope, // PARENT면 학생 계정 제외.
    });
    if (!resolved.ok) return resolved; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (resolved.userIds.length === 0) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "수신 대상이 없습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const now = new Date(); // now. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const metadata = await getAuditRequestMetadata(); // metadata. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    try { // 실패 시 범용 메시지. 스키마를 노출하지 않는다.
        await prisma.$transaction(async (tx) => { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            await tx.messageRecipient.createMany({ // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                data: resolved.userIds.map((recipientUserId) => ({ // data. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    messageId: row.id, // Message 행. 인박스 recipientId와 다르다.
                    recipientUserId, // 이때 처음으로 MessageRecipient가 생긴다. 인박스는 SENT + recipient 기준.
                })),
                skipDuplicates: true, // skipDuplicates. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            });

            const updated = await tx.message.updateMany({ // updated. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                where: { id: row.id, status: "PENDING_APPROVAL" }, // 다른 탭에서 이미 처리된 건은 count=0.
                data: { // data. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    status: "SENT", // 원장 즉시 또는 승인 후. 수신 행이 있다.
                    approverUserId: approverUserId, // approverUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    approvedAt: now, // approvedAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    sentAt: now, // sentAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    rejectionReason: null, // 원장 반려 사유. PENDING에는 없다.
                    senderUserId: authorId, // senderUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                },
            });

            if (updated.count !== 1) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                throw new Error("이미 다른 요청에서 처리된 쪽지입니다."); // 중단. 부분 저장하지 않는다.
            }

            await writeAuditLog(tx, { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                actorUserId: approverUserId, // actorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                action: "MESSAGE_APPROVED", // action. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                targetType: "MESSAGE", // targetType. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                targetId: row.id, // targetId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                details: { recipientCount: resolved.userIds.length }, // details. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                metadata, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            });
        });
    } catch (error) { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ok: false, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            message: // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                error instanceof Error // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    ? error.message // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                    : "승인·발송에 실패했습니다.", // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        };
    }

    return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        ok: true, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        message: `승인·발송 완료 (${resolved.userIds.length}명)`, // 이제 인박스에 보인다. 캐시 무효화는 호출부가 한다.
        recipientCount: resolved.userIds.length, // SENT만 수신 행 수. PENDING은 0.
    };
}

/**
 * 원장이 대기 쪽지를 반려한다. 수신 행은 만들지 않은 채 REJECTED만 남긴다.
 */
export async function rejectMessage(input: { // rejectMessage. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    messageId: string; // Message 행. 인박스 recipientId와 다르다.
    rejectionReason: string; // 원장 반려 사유. PENDING에는 없다.
}): Promise<MessageActionResult> { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) return { ok: false, message: "원장 권한이 필요합니다." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).

    const messageId = String(input.messageId ?? "").trim(); // Message 행. 인박스 recipientId와 다르다.
    const rejectionReason = String(input.rejectionReason ?? "").trim(); // 원장 반려 사유. PENDING에는 없다.
    if (!messageId) return { ok: false, message: "쪽지 ID가 없습니다." }; // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    if (!rejectionReason) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { ok: false, message: "반려 사유를 입력해 주세요." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    }

    const metadata = await getAuditRequestMetadata(); // metadata. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    const updated = await prisma.$transaction(async (tx) => { // updated. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        const result = await tx.message.updateMany({ // result. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            where: { id: messageId, status: "PENDING_APPROVAL" }, // 직원 요청. 수신 행이 없어 인박스에 없다.
            data: { // data. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                status: "REJECTED", // 수신 create 없음. 인박스에 안 나간다.
                rejectionReason, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                approverUserId: session.user.id, // approverUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                approvedAt: null, // approvedAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                sentAt: null, // sentAt. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            },
        });

        if (result.count === 1) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            await writeAuditLog(tx, { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                actorUserId: session.user.id, // actorUserId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                action: "MESSAGE_REJECTED", // action. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                targetType: "MESSAGE", // targetType. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                targetId: messageId, // targetId. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                details: { rejectionReason }, // details. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
                metadata, // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            });
        }

        return result.count; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    });

    if (updated !== 1) { // 가드. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        return { // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            ok: false, // ok. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
            message: "쪽지가 없거나 이미 다른 요청에서 처리되었습니다.", // message. 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
        };
    }

    revalidateMessagePaths(); // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
    return { ok: true, message: "반려 처리했습니다." }; // 원장 SENT+수신 행. 직원 PENDING_APPROVAL은 수신 행 없음(승인 전).
}
