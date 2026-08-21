import "server-only"; // 조회만. 브라우저가 Prisma를 치지 않는다.

/**
 * 원장 승인 큐·직원 작성 목록과 수신 대상 옵션을 조회한다.
 *
 * 호출: `/director/messages`, `/teacher/messages`, `/employee/messages`.
 * 원장은 대기/발송을 보고, 직원은 본인 작성분만 본다(pending은 비움).
 * 직원 화면이 타 직원 승인 큐를 열지 않게 하기 위함이다.
 *
 * 의도적으로 하지 않는 일:
 * - 발송 → `actions.ts`.
 * - 인박스 조회 → `inbox-data.ts`.
 *
 * 관련: `target-filter.ts`, `types.ts`.
 */

import type { Prisma } from "@/generate/prisma/client"; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
import { prisma } from "@/lib/db"; // server-only Prisma. 브라우저가 직접 치지 않는다.
import { MESSAGE_AUDIENCE_LABELS } from "@/features/messages/presentation"; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
import { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    formatTargetNames, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    parseTargetFilter, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
} from "@/features/messages/target-filter"; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
import type { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    MessageListItem, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    MessageRecipientOption, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
} from "@/features/messages/types"; // 작성/승인 목록 조회. PENDING은 recipientCount=0.

const messageListSelect = { // messageListSelect. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    id: true, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    title: true, // 제목. 서버가 길이를 다시 본다.
    content: true, // 쪽지 본문. PENDING은 인박스에 안 나간다.
    status: true, // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
    audience: true, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    rejectionReason: true, // 원장 반려 사유. PENDING에는 없다.
    createdAt: true, // createdAt. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    submittedAt: true, // submittedAt. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    sentAt: true, // sentAt. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    targetFilter: true, // targetFilter. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    targetStudentId: true, // 원생 카드. 승인 때 스코프로 다시 펼친다.
    targetClassId: true, // targetClassId. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    author: { select: { name: true } }, // author. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    sender: { select: { name: true } }, // sender. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    targetStudent: { select: { name: true } }, // targetStudent. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    targetClass: { select: { name: true } }, // targetClass. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    _count: { select: { recipients: true } }, // PENDING은 0. SENT만 수신 행이 있다.
} satisfies Prisma.MessageSelect; // 작성/승인 목록 조회. PENDING은 recipientCount=0.

type MessageRecord = Prisma.MessageGetPayload<{ // MessageRecord 타입. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    select: typeof messageListSelect; // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
}>; // 작성/승인 목록 조회. PENDING은 recipientCount=0.

async function buildTargetSummaries( // buildTargetSummaries. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    messages: MessageRecord[], // messages. 작성/승인 목록 조회. PENDING은 recipientCount=0.
): Promise<Map<string, string>> { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    const summaries = new Map<string, string>(); // summaries. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    const studentIds = new Set<string>(); // studentIds. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    const parentIds = new Set<string>(); // parentIds. 작성/승인 목록 조회. PENDING은 recipientCount=0.

    for (const message of messages) { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        const filter = parseTargetFilter(message.targetFilter); // 칩 필터. 서버 where를 바꾸지 않는다.
        if (filter?.broadcast) { // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            summaries.set(message.id, "전체 발송"); // 목록 요약만. 수신 행을 전원에게 만드는 플래그가 아니다.
            continue; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }
        for (const id of filter?.studentIds ?? []) studentIds.add(id); // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        for (const id of filter?.parentUserIds ?? []) parentIds.add(id); // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        if ( // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            !filter?.studentIds?.length && // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            message.targetStudentId && // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            message.audience === "STUDENT" // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        ) { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            studentIds.add(message.targetStudentId); // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }
    }

    const [students, parents] = await Promise.all([ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        studentIds.size === 0 // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            ? Promise.resolve([]) // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            : prisma.student.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                  where: { id: { in: [...studentIds] } }, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                  select: { id: true, name: true }, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
              }),
        parentIds.size === 0 // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            ? Promise.resolve([]) // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            : prisma.user.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                  where: { id: { in: [...parentIds] } }, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                  select: { id: true, name: true }, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
              }),
    ]);

    const studentNameById = new Map( // studentNameById. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        students.map((student) => [student.id, student.name]), // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    );
    const parentNameById = new Map( // parentNameById. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        parents.map((parent) => [parent.id, parent.name]), // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    );

    for (const message of messages) { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        if (summaries.has(message.id)) continue; // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.

        const filter = parseTargetFilter(message.targetFilter); // 칩 필터. 서버 where를 바꾸지 않는다.

        if (filter?.studentIds?.length) { // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            summaries.set( // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                message.id, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                formatTargetNames( // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    filter.studentIds // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        .map((id) => studentNameById.get(id)) // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        .filter((name): name is string => Boolean(name)), // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                ),
            );
            continue; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }

        if (filter?.parentUserIds?.length) { // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            summaries.set( // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                message.id, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                formatTargetNames( // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    filter.parentUserIds // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        .map((id) => parentNameById.get(id)) // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        .filter((name): name is string => Boolean(name)), // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                ),
            );
            continue; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }

        if (message.targetClass?.name) { // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            summaries.set(message.id, `${message.targetClass.name} 반`); // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            continue; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }

        if (message.targetStudent?.name) { // 가드. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            summaries.set(message.id, message.targetStudent.name); // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            continue; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }

        summaries.set( // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            message.id, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            message.audience // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                ? MESSAGE_AUDIENCE_LABELS[message.audience] // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                : "대상 미지정", // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        );
    }

    return summaries; // 작성/승인 목록 조회. PENDING은 recipientCount=0.
}

async function toMessageListItems( // toMessageListItems. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    messages: MessageRecord[], // messages. 작성/승인 목록 조회. PENDING은 recipientCount=0.
): Promise<MessageListItem[]> { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    const summaries = await buildTargetSummaries(messages); // summaries. 작성/승인 목록 조회. PENDING은 recipientCount=0.

    return messages.map((message) => ({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        id: message.id, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        title: message.title, // 제목. 서버가 길이를 다시 본다.
        content: message.content, // 쪽지 본문. PENDING은 인박스에 안 나간다.
        status: message.status, // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
        audience: message.audience, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
        authorName: message.author?.name ?? message.sender?.name ?? "학원", // authorName. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        rejectionReason: message.rejectionReason, // 원장 반려 사유. PENDING에는 없다.
        createdAt: message.createdAt.toISOString(), // createdAt. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        submittedAt: message.submittedAt?.toISOString() ?? null, // submittedAt. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        sentAt: message.sentAt?.toISOString() ?? null, // sentAt. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        recipientCount: message._count.recipients, // SENT 수신 행 수. PENDING은 0 — 인박스에 아직 없다.
        targetSummary: summaries.get(message.id) ?? "대상 미지정", // targetSummary. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    }));
}

/**
 * 원장 화면: 재원생·활성 반 옵션, 승인 대기, 최근 발송.
 * 학부모 옵션은 ACTIVE 링크만 — 끊긴 보호자는 작곡기에 안 나온다.
 */
export async function getDirectorMessagesData(): Promise<{ // getDirectorMessagesData. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    students: MessageRecipientOption[]; // students. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    classes: MessageRecipientOption[]; // classes. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    pending: MessageListItem[]; // PENDING_APPROVAL. 수신 행이 없어 인박스에 없다.
    mine: MessageListItem[]; // 직원 내 요청 또는 원장 최근 SENT.
}> { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    const [students, classes, pendingMessages, sentMessages] = // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        await Promise.all([ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            prisma.student.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                where: { status: "ENROLLED" }, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                orderBy: { name: "asc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                select: { // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    id: true, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    name: true, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    parentLinks: { // parentLinks. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        where: { endedAt: null }, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        select: { // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                            parent: { // parent. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                select: { // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                    id: true, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                    name: true, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                    status: true, // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
                                },
                            },
                        },
                    },
                },
            }),
            prisma.class.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                where: { active: true }, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                orderBy: { name: "asc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                select: { id: true, name: true }, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            }),
            prisma.message.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                where: { status: "PENDING_APPROVAL" }, // 수신 행이 없는 직원 요청만.
                orderBy: { submittedAt: "desc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                take: 50, // take. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                select: messageListSelect, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            }),
            prisma.message.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                where: { status: "SENT" }, // 원장 즉시 또는 승인 후. 수신 행이 있다.
                orderBy: { sentAt: "desc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                take: 50, // take. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                select: messageListSelect, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            }),
        ]);

    const [pending, mine] = await Promise.all([ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        toMessageListItems(pendingMessages), // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        toMessageListItems(sentMessages), // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    ]);

    return { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        students: students.map((student) => ({ // students. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            id: student.id, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            name: student.name, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            parents: student.parentLinks // parents. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                .filter((link) => link.parent.status === "ACTIVE") // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                .map((link) => ({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    userId: link.parent.id, // PARENT User. 학생 계정은 parents에 넣지 않는다.
                    name: link.parent.name, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                })),
        })),
        classes, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        pending, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        mine, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    };
}

/**
 * 직원 화면: 스코프 where로 학생·반을 제한하고, 본인 작성 쪽지만 mine에 넣는다.
 * pending은 항상 []. 승인 큐는 원장 전용이다.
 */
export async function getStaffMessagesData({ // getStaffMessagesData. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    staffUserId, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    studentWhere, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    classWhere, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
}: { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    staffUserId: string; // staffUserId. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    studentWhere: Prisma.StudentWhereInput; // studentWhere. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    classWhere: Prisma.ClassWhereInput; // classWhere. 작성/승인 목록 조회. PENDING은 recipientCount=0.
}): Promise<{ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    students: MessageRecipientOption[]; // students. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    classes: MessageRecipientOption[]; // classes. 작성/승인 목록 조회. PENDING은 recipientCount=0.
    pending: MessageListItem[]; // PENDING_APPROVAL. 수신 행이 없어 인박스에 없다.
    mine: MessageListItem[]; // 직원 내 요청 또는 원장 최근 SENT.
}> { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
    const [students, classes, staffMessages] = await Promise.all([ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        prisma.student.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            where: studentWhere, // page가 넣은 스코프. 여기서 넓히면 전 원생이 보인다.
            orderBy: { name: "asc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            select: { // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                id: true, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                name: true, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                parentLinks: { // parentLinks. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    where: { endedAt: null }, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    select: { // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                        parent: { // parent. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                            select: { // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                id: true, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                name: true, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                                status: true, // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
                            },
                        },
                    },
                },
            },
        }),
        prisma.class.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            where: classWhere, // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            orderBy: { name: "asc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            select: { id: true, name: true }, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }),
        prisma.message.findMany({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
            where: { // where. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                authorUserId: staffUserId, // 본인 작성분만. 다른 직원 승인 대기는 원장 큐에만 있다.
                status: { in: ["PENDING_APPROVAL", "SENT", "REJECTED"] }, // 직원 요청. 수신 행이 없어 인박스에 없다.
            },
            orderBy: { createdAt: "desc" }, // orderBy. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            take: 50, // take. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            select: messageListSelect, // select. 작성/승인 목록 조회. PENDING은 recipientCount=0.
        }),
    ]);

    return { // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        students: students.map((student) => ({ // students. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            id: student.id, // id. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            name: student.name, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
            parents: student.parentLinks // parents. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                .filter((link) => link.parent.status === "ACTIVE") // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                .map((link) => ({ // 작성/승인 목록 조회. PENDING은 recipientCount=0.
                    userId: link.parent.id, // 학부모 User만. 학생 계정은 체크 목록에 없다.
                    name: link.parent.name, // name. 작성/승인 목록 조회. PENDING은 recipientCount=0.
                })),
        })),
        classes, // 작성/승인 목록 조회. PENDING은 recipientCount=0.
        pending: [], // 화면 탭용 키는 유지하되 직원에게는 비운다. 승인 큐는 원장 전용.
        mine: await toMessageListItems(staffMessages), // 직원 내 요청 또는 원장 최근 SENT.
    };
}
