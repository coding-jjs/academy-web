import "server-only"; // 클라이언트에 GEMINI_API_KEY가 노출되지 않게.

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

import { GoogleGenerativeAI } from "@google/generative-ai"; // 서버 전용. 프롬프트 템플릿은 리포트/챗봇 파일.

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash"; // 초안·챗봇이 같은 모델. 스트리밍 없음.

/** 설정 누락·빈 응답·SDK 실패를 한 타입으로 묶는다. 라우트가 503/안내 문구를 고를 때 쓴다. */
export class AiUnavailableError extends Error { // 키 없을 때 더미 문장을 만들지 않는다.
    constructor(message: string) { // 라우트 catch를 하나로. SDK 예외는 generateText가 감싼다.
        super(message); // 안내 문구. 스키마 오류를 노출하지 않는다.
        this.name = "AiUnavailableError"; // 라우트 catch를 하나로. SDK 예외는 generateText가 감싼다.
    }
}

const globalForAi = globalThis as unknown as { // hot reload마다 클라이언트를 새로 만들지 않게.
    gemini: GoogleGenerativeAI | undefined; // hot reload마다 클라이언트를 새로 만들지 않게.
};

/** 키가 있을 때만 true. 초안 버튼·챗봇이 호출 전에 가려 "실패 후 안내"를 줄인다. */
export function isGeminiConfigured() { // 키 없으면 더미 문장을 만들지 않는다. UI가 가린다.
    return Boolean(process.env.GEMINI_API_KEY?.trim()); // 키 없으면 초안 버튼·챗봇이 호출 전에 가려 "실패 후 안내"를 줄인다.
}

/**
 * SDK 클라이언트. 키가 없으면 throw — 호출 전에 `isGeminiConfigured`를 보는 것이 정석이다.
 */
export function getGeminiClient(): GoogleGenerativeAI { // 호출 전에 isGeminiConfigured. 더미 문장 없음.
    const apiKey = process.env.GEMINI_API_KEY?.trim(); // 키가 없으면 SDK를 만들지 않는다. 호출부가 isGeminiConfigured로 UI를 가린다.
    if (!apiKey) { // 키 없으면 throw. 더미 문장을 만들지 않는다.
        throw new AiUnavailableError("GEMINI_API_KEY가 설정되지 않았습니다."); // 라우트가 503/안내. 초안을 DB에 넣지 않는다.
    }

    if (!globalForAi.gemini) { // hot reload마다 클라이언트를 새로 만들지 않게 globalThis에 붙인다.
        globalForAi.gemini = new GoogleGenerativeAI(apiKey); // 한 인스턴스. 스트리밍/함수콜은 쓰지 않는다.
    }
    return globalForAi.gemini; // 초안·챗봇이 같은 클라이언트.
}

/**
 * 프롬프트 한 번 → 텍스트. 빈 프롬프트/빈 응답도 실패로 본다
 * (호출부가 undefined를 DB에 초안으로 넣지 않게).
 * SDK 예외는 메시지만 `AiUnavailableError`로 감싸 라우트 catch를 하나로 유지한다.
 */
export async function generateText(prompt: string): Promise<string> { // 한 덩어리. 스트리밍 없음. 프롬프트 템플릿은 호출부.
    const trimmed = prompt.trim(); // 빈 프롬프트는 API를 치지 않는다. undefined가 초안으로 저장되는 것을 막는다.
    if (!trimmed) { // 빈 프롬프트는 실패. 초안 DB에 넣지 않는다.
        throw new AiUnavailableError("생성할 프롬프트가 비어 있습니다."); // 호출부가 undefined를 초안으로 넣지 않게.
    }

    try { // SDK 예외는 아래에서 AiUnavailableError로 감싼다.
        const model = getGeminiClient().getGenerativeModel({ // 한 번 생성 → trim. 스트리밍 없이 초안·챗봇이 같은 경로를 탄다.
            model: GEMINI_MODEL, // 한 번 생성 → trim. 스트리밍 없이 초안·챗봇이 같은 경로를 탄다.
        });
        const text = (await model.generateContent(trimmed)).response // 한 덩어리 텍스트. 스트리밍 없음.
            .text() // SDK 응답. 빈 문자열이면 아래에서 실패.
            .trim(); // 공백만인 응답도 실패로 본다.

        if (!text) { // 빈 응답도 실패. 호출부가 공백을 DB에 넣지 않게.
            throw new AiUnavailableError("Gemini가 빈 응답을 반환했습니다."); // 초안을 undefined로 저장하지 않는다.
        }
        return text; // 초안·챗봇 답변. 프롬프트 템플릿은 각 파일.
    } catch (error) { // SDK 예외는 메시지만 감싸 라우트 catch를 하나로.
        if (error instanceof AiUnavailableError) throw error; // 이미 AiUnavailableError면 그대로. SDK 예외는 메시지만 감싸 라우트 catch를 하나로.
        throw new AiUnavailableError( // 스키마 오류를 노출하지 않는다. 안내 문구만.
            error instanceof Error // Gemini 한 덩어리. 키 없으면 더미 문장 없음.
                ? error.message // SDK 메시지. 시크릿은 넣지 않는다.
                : "Gemini 호출에 실패했습니다.", // 비 Error. 라우트가 503.
        );
    }
}
