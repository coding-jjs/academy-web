import "server-only";

/**
 * 서버 전용 Gemini 래퍼.
 * 키 없으면 호출을 건너뛰고, 리포트 초안·챗봇이 같은 `generateText`를 쓰게 한다.
 *
 * 호출:
 * - `features/reports/draft-generator.ts` — AI 리포트 초안
 * - `app/api/chat/route.ts` — 역할별 챗봇
 *
 * 쓰기 없음 (외부 API만). 클라이언트에 키가 노출되지 않게 `server-only`.
 * 개발 hot reload에서 클라이언트를 재생성하지 않도록 `globalThis`에 붙인다.
 *
 * 의도적으로 하지 않는 일:
 * - 키 없을 때 더미 문장을 만들지 않는다. 호출부가 `isGeminiConfigured`로 UI를 가린다.
 * - 스트리밍/함수콜은 쓰지 않는다. 초안·답변 모두 한 덩어리 텍스트.
 * - 프롬프트 템플릿은 여기 없다 → 리포트/챗봇 각 파일.
 *
 * 관련: `GEMINI_API_KEY`, `GEMINI_MODEL` (없으면 gemini-3.5-flash).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

/** 설정 누락·빈 응답·SDK 실패를 한 타입으로 묶는다. 라우트가 503/안내 문구를 고를 때 쓴다. */
export class AiUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AiUnavailableError";
    }
}

const globalForAi = globalThis as unknown as {
    gemini: GoogleGenerativeAI | undefined;
};

/** 키가 있을 때만 true. 초안 버튼·챗봇이 호출 전에 가려 "실패 후 안내"를 줄인다. */
export function isGeminiConfigured() {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * SDK 클라이언트. 키가 없으면 throw — 호출 전에 `isGeminiConfigured`를 보는 것이 정석이다.
 */
export function getGeminiClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        throw new AiUnavailableError("GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    if (!globalForAi.gemini) {
        globalForAi.gemini = new GoogleGenerativeAI(apiKey);
    }
    return globalForAi.gemini;
}

/**
 * 프롬프트 한 번 → 텍스트. 빈 프롬프트/빈 응답도 실패로 본다
 * (호출부가 undefined를 DB에 초안으로 넣지 않게).
 * SDK 예외는 메시지만 `AiUnavailableError`로 감싸 라우트 catch를 하나로 유지한다.
 */
export async function generateText(prompt: string): Promise<string> {
    const trimmed = prompt.trim();
    if (!trimmed) {
        throw new AiUnavailableError("생성할 프롬프트가 비어 있습니다.");
    }

    try {
        const model = getGeminiClient().getGenerativeModel({
            model: GEMINI_MODEL,
        });
        const text = (await model.generateContent(trimmed)).response
            .text()
            .trim();

        if (!text) {
            throw new AiUnavailableError("Gemini가 빈 응답을 반환했습니다.");
        }
        return text;
    } catch (error) {
        if (error instanceof AiUnavailableError) throw error;
        throw new AiUnavailableError(
            error instanceof Error
                ? error.message
                : "Gemini 호출에 실패했습니다.",
        );
    }
}
