/**
 * `/api/chat` POST. 역할별 학원 챗봇.
 *
 * `src/proxy.ts` matcher에 `/api/chat`이 없다. 공개 경로처럼 들어오므로
 * 핸들러가 `auth()` + `getUsableAccount` + 역할 화이트리스트를 직접 검사한다.
 * GUEST는 거절. PARENT/STUDENT/TEACHER/STAFF/DIRECTOR만 컨텍스트를 만든다.
 *
 * Gemini에는 사실 JSON(역할 컨텍스트)만 넘긴다. API 키는 서버 env
 * (`isGeminiConfigured`)에 두고 클라이언트에 노출하지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 미로그인 익명 챗을 열지 않는다.
 * - 프롬프트에 비밀·다른 원생 PII를 넣지 않는다. 컨텍스트 빌더가 역할별로 자른다.
 */

import { auth } from "@/lib/auth";
import { AiUnavailableError, generateText, isGeminiConfigured } from "@/lib/ai";
import {
    buildParentChatContext,
    buildStaffChatContext,
    buildStudentChatContext,
} from "@/features/chatbot/context";
import { buildChatPrompt } from "@/features/chatbot/prompt";
import { getUsableAccount } from "@/lib/account-access";
import { getAuditRequestMetadata } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { readMobileUser } from "@/lib/mobile-auth";

const MAX_MESSAGE_LENGTH = 500;

/** 로그인·가용 계정·역할을 검사한 뒤 Gemini 답과 감사 로그를 남긴다. */
export async function POST(request: Request) {
    const viewer = await resolveChatViewer(request);
    if (!viewer) {
        return Response.json(
            { error: "UNAUTHORIZED", message: "로그인이 필요합니다." },
            { status: 401 },
        );
    }
    const role = viewer.role;
    if (
        role !== "PARENT" &&
        role !== "STUDENT" &&
        role !== "TEACHER" &&
        role !== "STAFF" &&
        role !== "DIRECTOR"
    ) {
        return Response.json(
            {
                error: "INVALID_ROLE",
                message: "이 기능은 회원만 사용할 수 있습니다.",
            },
            { status: 400 },
        );
    }

    const body = await request.json().catch(() => null);
    const message = readMessage(body);
    if (!message) {
        return Response.json(
            { error: "INVALID_REQUEST", message: "질문을 입력해 주세요." },
            { status: 400 },
        );
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
        return Response.json(
            {
                error: "INVALID_REQUEST",
                message: `질문은 ${MAX_MESSAGE_LENGTH}자 이하로 입력해 주세요.`,
            },
            { status: 400 },
        );
    }
    if (!isGeminiConfigured()) {
        return Response.json({
            reply: "지금은 AI 도우미를 사용할 수 없습니다. 잠시 후 다시 시도하거나 학원에 문의해 주세요.",
        });
    }

    try {
        const viewerName =
            viewer.name?.trim() ||
            (role === "PARENT"
                ? "학부모"
                : role === "STUDENT"
                  ? "학생"
                  : role === "TEACHER"
                    ? "교사"
                    : role === "STAFF"
                      ? "직원"
                      : "원장");

        const context =
            role === "PARENT"
                ? await buildParentChatContext(viewer.id, viewerName)
                : role === "STUDENT"
                  ? await buildStudentChatContext(viewer.id, viewerName)
                  : await buildStaffChatContext(
                        viewer.id,
                        viewerName,
                        role,
                        message,
                    );

        const prompt = buildChatPrompt(context, message);
        const reply = await generateText(prompt);
        const metadata = await getAuditRequestMetadata();
        await prisma.auditLog.create({
            data: {
                actorUserId: viewer.id,
                action: "CHATBOT_REQUEST",
                targetType: "CHATBOT",
                targetId: viewer.id,
                details: { role, messageLength: message.length },
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent,
            },
        });

        return Response.json({ reply });
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "질문이 비어 있습니다."
        ) {
            return Response.json(
                { error: "INVALID_MESSAGE", message: "질문을 입력해 주세요." },
                { status: 400 },
            );
        }
        const messageText =
            error instanceof AiUnavailableError
                ? error.message
                : "답변 생성 중 오류가 발생했습니다.";
        return Response.json(
            {
                reply: "지금은 답변을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.",
                error: messageText,
            },
            { status: 503 },
        );
    }
}

async function resolveChatViewer(request: Request) {
    const mobile = await readMobileUser(request);
    if (mobile) {
        return { id: mobile.id, role: mobile.role, name: mobile.name };
    }
    const session = await auth();
    if (!session?.user?.id) return null;
    const account = await getUsableAccount(session.user.id);
    if (!account) return null;
    return {
        id: account.id,
        role: account.role,
        name: session.user.name?.trim() || "",
    };
}

/** JSON body에서 질문 문자열만 꺼낸다. 없거나 공백이면 null. */
function readMessage(body: unknown) {
    if (!body || typeof body !== "object" || !("message" in body)) {
        return null;
    }
    const message = String(body.message).trim();
    return message.length > 0 ? message : null;
}
