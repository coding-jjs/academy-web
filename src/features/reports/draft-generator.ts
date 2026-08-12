import "server-only";

import {
    AiUnavailableError,
    generateText,
    isGeminiConfigured,
} from "@/lib/ai";

type ReportDraftInput = {
    studentName: string;
    keywords: string[];
    tone: string;
    periodStart: string;
    periodEnd: string;
};

function buildTemplateDraft(input: ReportDraftInput) {
    const keywordSummary =
        input.keywords.filter(Boolean).join(" · ") || "수업 태도";
    const toneSummary =
        input.tone === "단호"
            ? "개선이 필요한 부분을 명확히 전달했습니다."
            : input.tone === "전문적"
              ? "객관적인 학습 관찰을 중심으로 정리했습니다."
              : "성장과 노력을 중심으로 격려했습니다.";

    return [
        `${input.studentName} 학생의 ${input.periodStart} ~ ${input.periodEnd} 학습 리포트입니다.`,
        "",
        `핵심 관찰 포인트: ${keywordSummary}`,
        "",
        `이번 기간 수업 참여와 과제 수행을 종합하면, ${keywordSummary} 측면에서 꾸준한 모습이 관찰됩니다.`,
        toneSummary,
        "",
        "가정에서도 짧은 복습과 질문 습관을 이어가 주시면 다음 기간 성장에 도움이 됩니다.",
        "",
        "(초안 — 내용 확인 후 수정해 주세요)",
    ].join("\n");
}

function buildAiPrompt(input: ReportDraftInput) {
    const keywordSummary =
        input.keywords.filter(Boolean).join(" · ") || "수업 태도";

    return [
        "학원 학부모에게 보낼 학습 리포트 초안을 한국어로 작성하세요.",
        "과장·허위 사실 없이, 선생님이 검수할 수 있는 초안 문체로 작성하세요.",
        "개인정보·연락처·민감 정보는 넣지 마세요.",
        "분량은 4~8문장 정도로 작성하세요.",
        "",
        `학생 이름: ${input.studentName}`,
        `기간: ${input.periodStart} ~ ${input.periodEnd}`,
        `관찰 키워드: ${keywordSummary}`,
        `톤: ${input.tone}`,
        "",
        "출력은 본문만 작성하고, 제목/머리말/코드블록은 넣지 마세요.",
    ].join("\n");
}

export async function createReportDraft(
    input: ReportDraftInput,
): Promise<{ content: string; usedAi: boolean; fallbackReason?: string }> {
    const templateDraft = buildTemplateDraft(input);

    if (!isGeminiConfigured()) {
        return {
            content: templateDraft,
            usedAi: false,
            fallbackReason: "GEMINI_API_KEY 미설정",
        };
    }

    try {
        const content = await generateText(buildAiPrompt(input));
        return { content, usedAi: true };
    } catch (error) {
        const fallbackReason =
            error instanceof AiUnavailableError
                ? error.message
                : "Gemini 호출 실패";
        return {
            content: templateDraft,
            usedAi: false,
            fallbackReason,
        };
    }
}
