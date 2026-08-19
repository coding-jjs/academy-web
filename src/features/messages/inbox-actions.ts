"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

/**
 * 학부모·학생 인박스 읽음 처리(단건·모두 읽음).
 *
 * 호출: ParentInboxScreen, StudentInboxScreen / StudentMessagesPanel.
 * MessageRecipient 행을 본인 id로만 갱신해 타 수신자의 읽음 상태를 바꾸지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 쪽지 본문 삭제. 읽음 시각만 찍는다.
 * - 원장/직원 작성 화면 캐시 무효화. 인박스·대시보드만 갱신한다.
 *
 * 관련: `inbox-data.ts`.
 */

import { revalidatePath } from "next/cache"; // 인박스·대시보드만. 작성 화면 캐시는 안 건드린다.
import { auth } from "@/lib/auth"; // JWT 세션. PARENT/STUDENT만.
import { prisma } from "@/lib/db"; // server-only Prisma. 수신 행의 readAt만.

/** `useActionState`용 읽음 처리 결과. */
export type InboxActionState = { // 인박스 UI 상태. 작성/승인 목록이 아니다.
    status: "idle" | "error" | "success"; // idle은 초기값. 본문을 지우지 않는다.
    message: string; // 화면 문장. 필드 에러 맵이 아니다.
};

/**
 * 한 통을 읽음 처리한다. recipientId는 수신 행 id이며 본인 것이 아니면 거절한다.
 */
export async function markMessageRead( // messageId로 갱신하지 않는다. 수신 행만.
    _prev: InboxActionState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // recipientId. 쪽지 본문을 받지 않는다.
): Promise<InboxActionState> { // 본문을 지우지 않는다. readAt만.
    const session = await auth(); // PARENT/STUDENT만. 원장/직원 인박스가 아니다.
    if ( // 역할 가드. GUEST·STAFF는 거절.
        !session?.user?.id || // 세션 없으면 읽음 처리를 쓰지 않는다.
        (session.user.role !== "PARENT" && session.user.role !== "STUDENT") // 원장/직원 작성 화면이 아니다.
    ) { // 역할 가드 본문.
        return { status: "error", message: "로그인이 필요합니다." }; // 원장/직원 인박스가 아니다.
    }

    const recipientId = String(formData.get("recipientId") ?? "").trim(); // 수신 행 id. 메시지 id가 아니다.
    if (!recipientId) { // 빈 값. 본문을 받지 않는다.
        return { status: "error", message: "쪽지를 선택해 주세요." }; // 수신 행 id 없음.
    }

    const row = await prisma.messageRecipient.findFirst({ // 본인 수신만. PENDING은 수신 행이 없어 여기 없다.
        where: { // 타 수신자 recipientId를 넣어도 못 바꾼다.
            id: recipientId, // 수신 행. messageId가 아니다.
            recipientUserId: session.user.id, // 다른 학부모/학생의 recipientId를 넣어도 못 바꾼다.
        },
        select: { id: true, readAt: true }, // 이미 읽었으면 update를 건너뛴다.
    });

    if (!row) { // 본인 것이 아니거나 없는 id.
        return { status: "error", message: "쪽지를 찾을 수 없습니다." }; // 타 수신자 행을 갱신하지 않는다.
    }

    if (!row.readAt) { // 아직 안 읽은 건만. 본문을 지우지 않는다.
        await prisma.messageRecipient.update({ // readAt만. 쪽지 본문 delete가 아니다.
            where: { id: row.id }, // 본인 수신 행.
            data: { readAt: new Date() }, // 아직 안 읽은 건만. 본문을 지우지 않는다.
        });
    }

    revalidateInbox(session.user.role); // 학생은 /student/만. 작성 화면 캐시는 안 건드린다.
    return { status: "success", message: "읽음 처리되었습니다." }; // 본문은 그대로.
}

/**
 * 본인 미읽음 수신 행을 모두 읽음 처리한다.
 */
export async function markAllMessagesRead(): Promise<InboxActionState> { // 본인 미읽음만. 타 수신자 행은 건드리지 않는다.
    const session = await auth(); // PARENT/STUDENT만.
    if ( // 역할 가드.
        !session?.user?.id || // 세션 없으면 쓰지 않는다.
        (session.user.role !== "PARENT" && session.user.role !== "STUDENT") // 원장/직원 작성 화면이 아니다.
    ) { // 역할 가드 본문.
        return { status: "error", message: "로그인이 필요합니다." }; // 학부모·학생만.
    }

    await prisma.messageRecipient.updateMany({ // 본인 미읽음만. 쪽지 본문을 지우지 않는다.
        where: { // 타 수신자 행은 건드리지 않는다.
            recipientUserId: session.user.id, // 본인 미읽음만. 타 수신자 행은 건드리지 않는다.
            readAt: null, // 이미 읽은 건은 건너뛴다.
        },
        data: { readAt: new Date() }, // 읽음 시각만. 본문 delete가 아니다.
    });

    revalidateInbox(session.user.role); // 학생은 /student/만.
    return { status: "success", message: "모두 읽음 처리되었습니다." }; // 본문은 그대로.
}

function revalidateInbox(role: "PARENT" | "STUDENT") { // 작성 화면 캐시는 안 건드린다.
    const prefix = role === "PARENT" ? "/parent" : "/student"; // 학생은 /student/만. /parent 캐시를 건드리지 않는다.
    revalidatePath(`${prefix}/inbox`); // 인박스. 원장/직원 작성 목록이 아니다.
    revalidatePath(`${prefix}/dashboard`); // 대시보드 미리보기 미읽음.
}
