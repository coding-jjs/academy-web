import { GoogleGenerativeAI } from "@google/generative-ai";
// npm install @google/generative-ai <-- 설치 필요

const GEMINI_MODEL =
    process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

export class AiUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AiUnavailableError";
    }
}

const globalForAi = globalThis as unknown as {
    gemini: GoogleGenerativeAI | undefined;
};

export function isGeminiConfigured() {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
}

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