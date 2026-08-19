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

import { auth } from "@/lib/auth"; // proxy가 /api/chat을 안 막아서 여기서 auth + 가용 계정을 본다.
import { AiUnavailableError, generateText, isGeminiConfigured } from "@/lib/ai"; // Gemini. 키는 서버 env. 클라이언트에 노출하지 않는다.
import { // 역할별 사실 JSON. 다른 원생 PII·시크릿은 안 넣는다.
    buildParentChatContext, // 연결된 자녀 범위.
    buildStaffChatContext, // 교사·직원·원장 스코프.
    buildStudentChatContext, // 본인 Student.userId만.
} from "@/features/chatbot/context"; // 역할 화이트리스트 이후.
import { buildChatPrompt } from "@/features/chatbot/prompt"; // 사실 JSON + 질문. API 키는 generateText 쪽 env.
import { getUsableAccount } from "@/lib/account-access"; // JWT만 보면 BLOCKED가 들어온다.
import { getAuditRequestMetadata } from "@/lib/audit"; // IP·UA. 질문 본문은 감사에 안 남긴다.
import { prisma } from "@/lib/db"; // 감사 로그만. 챗 이력을 저장하지 않는다.

const MAX_MESSAGE_LENGTH = 500; // 질문 상한. 프롬프트에 장문을 넣지 않는다.

/** 로그인·가용 계정·역할을 검사한 뒤 Gemini 답과 감사 로그를 남긴다. */
export async function POST(request: Request) { // proxy matcher 밖. 미로그인 익명 챗을 열지 않는다.
    const session = await auth(); // proxy가 /api/chat을 안 막아서 여기서 auth + 가용 계정을 본다.

    if (!session?.user?.id) { // 미로그인. 익명 챗을 열지 않는다.
        return Response.json( // 401.
            { error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, // 업무 URL을 보여 주지 않는 것과 같은 취지.
            { status: 401 }, // 세션 없음.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    const account = await getUsableAccount(session.user.id); // JWT만 보면 BLOCKED가 들어온다.
    if (!account) { // 차단·삭제. 세션만으로 통과시키지 않는다.
        return Response.json( // 401.
            { error: "UNAUTHORIZED", message: "로그인이 필요합니다." }, // 사용 불가 계정도 로그인 안내.
            { status: 401 }, // 가용 계정 아님.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    const role = account.role; // GUEST는 거절. PARENT/STUDENT/TEACHER/STAFF/DIRECTOR만.
    if ( // 온보딩 GUEST·알 수 없는 역할. 문의는 /guest/inquiry.
        role !== "PARENT" && // 학부모. 자녀 링크 범위.
        role !== "STUDENT" && // 학생. 본인만.
        role !== "TEACHER" && // 교사.
        role !== "STAFF" && // 직원.
        role !== "DIRECTOR" // 원장.
    ) { // GUEST 거절.
        return Response.json( // 400.
            { // 역할 거절 본문.
                error: "INVALID_ROLE", // GUEST 등.
                message: "이 기능은 회원만 사용할 수 있습니다.", // 문의는 /guest/inquiry.
            }, // 객체/호출 끝.
            { status: 400 }, // 잘못된 역할.
        ); // 호출/그룹 끝.
    } // 블록 끝.

    const body = await request.json().catch(() => null); // 질문 문자열만. 공백·500자 초과 거절.
    const message = readMessage(body); // JSON message만. 없거나 공백이면 null.
    if (!message) { // 빈 질문. Gemini를 호출하지 않는다.
        return Response.json( // 400.
            { error: "INVALID_REQUEST", message: "질문을 입력해 주세요." }, // 빈 질문.
            { status: 400 }, // 잘못된 본문.
        ); // 호출/그룹 끝.
    } // 블록 끝.
    if (message.length > MAX_MESSAGE_LENGTH) { // 장문 거절. 다른 원생 PII를 실어 보내지 않게.
        return Response.json( // 400.
            { // 길이 초과 본문.
                error: "INVALID_REQUEST", // 너무 긴 질문.
                message: `질문은 ${MAX_MESSAGE_LENGTH}자 이하로 입력해 주세요.`, // 500자 상한.
            }, // 객체/호출 끝.
            { status: 400 }, // 길이 초과.
        ); // 호출/그룹 끝.
    } // 블록 끝.
    if (!isGeminiConfigured()) { // 서버 env 키 없음. 클라이언트에 키를 노출하지 않는다.
        return Response.json({ // 키 없음. 200에 안내 답.
            reply: "지금은 AI 도우미를 사용할 수 없습니다. 잠시 후 다시 시도하거나 학원에 문의해 주세요.", // 키를 노출하지 않는다.
        }); // 객체/호출 끝.
    } // 블록 끝.

    try { // 역할 컨텍스트 → 프롬프트 → Gemini → 감사. 질문 본문은 로그에 안 남긴다.
        const viewerName = // 표시 이름. 역할 컨텍스트 빌더에만 넘긴다.
            session.user.name?.trim() || // 세션 이름 우선.
            (role === "PARENT" // 학부모 기본 호칭.
                ? "학부모" // PARENT.
                : role === "STUDENT" // 학생 기본 호칭.
                  ? "학생" // STUDENT.
                  : role === "TEACHER" // 교사 기본 호칭.
                    ? "교사" // TEACHER.
                    : role === "STAFF" // 직원 기본 호칭.
                      ? "직원" // STAFF.
                      : "원장"); // DIRECTOR.

        const context = // 역할별 사실 JSON만. 다른 원생 PII·시크릿은 안 넣는다.
            role === "PARENT" // 연결된 자녀 범위.
                ? await buildParentChatContext(account.id, viewerName) // 학부모 컨텍스트.
                : role === "STUDENT" // 본인 Student.userId만.
                  ? await buildStudentChatContext(account.id, viewerName) // 학생 컨텍스트.
                  : await buildStaffChatContext( // 교사·직원·원장.
                        account.id, // 가용 계정 id.
                        viewerName, // 표시 이름.
                        role, // TEACHER/STAFF/DIRECTOR.
                        message, // 질문. 스코프 검색용.
                    ); // 호출/그룹 끝.

        const prompt = buildChatPrompt(context, message); // 사실 JSON + 질문. API 키는 generateText 쪽 env.
        const reply = await generateText(prompt); // Gemini. 클라이언트에 키를 안 준다.
        const metadata = await getAuditRequestMetadata(); // IP·UA. 질문 본문은 감사에 안 남긴다.
        await prisma.auditLog.create({ // 질문 본문은 남기지 않고 길이만.
            data: { // 감사 행.
                actorUserId: account.id, // 가용 계정.
                action: "CHATBOT_REQUEST", // 챗 요청.
                targetType: "CHATBOT", // 챗봇.
                targetId: account.id, // 본인.
                details: { role, messageLength: message.length }, // 길이만. 본문 없음.
                ipAddress: metadata.ipAddress, // 요청 IP.
                userAgent: metadata.userAgent, // UA.
            }, // 객체/호출 끝.
        }); // 객체/호출 끝.

        return Response.json({ reply }); // 답만. 컨텍스트 JSON은 클라이언트에 안 준다.
    } catch (error) { // Gemini 장애·빈 질문. 내부 스택은 클라이언트에 안 준다.
        if ( // 컨텍스트 빌더가 빈 질문을 거절.
            error instanceof Error && // Error만.
            error.message === "질문이 비어 있습니다." // 빌더 거절 문장.
        ) { // 빈 질문.
            return Response.json( // 400.
                { error: "INVALID_MESSAGE", message: "질문을 입력해 주세요." }, // 빈 질문.
                { status: 400 }, // 잘못된 메시지.
            ); // 호출/그룹 끝.
        } // 블록 끝.
        const messageText = // Gemini 장애면 503. 내부 스택은 클라이언트에 안 준다.
            error instanceof AiUnavailableError // AI 장애.
                ? error.message // 장애 문장.
                : "답변 생성 중 오류가 발생했습니다."; // 범용.
        return Response.json( // 503.
            { // 장애 본문.
                reply: "지금은 답변을 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.", // 사용자 안내.
                error: messageText, // 장애 상세. 스택 아님.
            }, // 객체/호출 끝.
            { status: 503 }, // 서비스 불가.
        ); // 호출/그룹 끝.
    } // 블록 끝.
} // 블록 끝.

/** JSON body에서 질문 문자열만 꺼낸다. 없거나 공백이면 null. */
function readMessage(body: unknown) { // JSON message만. 파일·다른 키는 무시.
    if (!body || typeof body !== "object" || !("message" in body)) { // JSON message만. 파일·다른 키는 무시.
        return null; // 질문 없음.
    } // 블록 끝.
    const message = String(body.message).trim(); // 공백이면 null.
    return message.length > 0 ? message : null; // 익명 챗이 아니다. 세션 검사가 먼저다.
} // 블록 끝.
