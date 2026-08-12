import "server-only";

import {
    AiUnavailableError,
    generateText,
    isGeminiConfigured,
} from "@/lib/ai";
import type { ReportEvidence } from "@/features/reports/evidence";
import {
    formatEvidenceForPrompt,
    hasAnyEvidence,
} from "@/features/reports/evidence";

type ReportDraftInput = {
    studentName: string;
    keywords: string[];
    tone: string;
    periodStart: string;
    periodEnd: string;
    evidence?: ReportEvidence;
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

    const evidence = input.evidence;
    const lines = [
        `${input.studentName} 학생의 ${input.periodStart} ~ ${input.periodEnd} 학습 리포트입니다.`,
        "",
        `핵심 관찰 포인트: ${keywordSummary}`,
        "",
    ];

    if (evidence && hasAnyEvidence(evidence)) {
        lines.push("■ 이번 기간 요약");
        if (evidence.grades.length > 0) {
            const latest = evidence.grades[0];
            lines.push(
                `성적: ${latest.subject}「${latest.title}」 ${latest.score}/${latest.maxScore}(${latest.percent}%)` +
                    (evidence.grades.length > 1
                        ? ` 외 ${evidence.grades.length - 1}건`
                        : "") +
                    "이 확인됩니다.",
            );
        }
        if (evidence.attendance.total > 0) {
            const a = evidence.attendance;
            lines.push(
                `출결: 총 ${a.total}회 중 출석 ${a.present}, 지각 ${a.late}, 결석 ${a.absent}` +
                    (a.rateLabel ? ` (출석률 ${a.rateLabel})` : "") +
                    "입니다.",
            );
        }
        if (evidence.learningRecords.length > 0) {
            lines.push(
                `학습 기록: ${evidence.learningRecords
                    .slice(0, 2)
                    .map((r) => r.title)
                    .join(", ")} 등이 있습니다.`,
            );
        }
        if (evidence.wrongNotes.length > 0) {
            const openCount = evidence.wrongNotes.filter(
                (n) => n.statusLabel === "미해결",
            ).length;
            lines.push(
                `오답: ${evidence.wrongNotes.length}건` +
                    (openCount > 0 ? ` (미해결 ${openCount}건)` : "") +
                    "을 중심으로 보완이 필요합니다.",
            );
        }
        lines.push("");
    } else {
        lines.push(
            `이번 기간 수업 참여와 과제 수행을 종합하면, ${keywordSummary} 측면에서 꾸준한 모습이 관찰됩니다.`,
        );
    }

    lines.push(toneSummary);
    lines.push("");
    lines.push(
        "가정에서도 짧은 복습과 질문 습관을 이어가 주시면 다음 기간 성장에 도움이 됩니다.",
    );
    lines.push("");
    lines.push("(초안 — 내용 확인 후 수정해 주세요)");

    return lines.join("\n");
}

function buildAiPrompt(input: ReportDraftInput) {
    const keywordSummary =
        input.keywords.filter(Boolean).join(" · ") || "수업 태도";
    const evidenceBlock = input.evidence
        ? formatEvidenceForPrompt(input.evidence)
        : "- 성적/출결/학습기록/오답: 제공되지 않음";

    return [
        "학원 학부모에게 보낼 학습 리포트 초안을 한국어로 작성하세요.",
        "과장·허위 사실 없이, 선생님이 검수할 수 있는 초안 문체로 작성하세요.",
        "개인정보·연락처·민감 정보는 넣지 마세요.",
        "아래 [기간 내 학습 근거]에 있는 사실만 사용하세요. 근거에 없는 점수·출결·사건·성취는 추측하거나 만들어내지 마세요.",
        "근거가 부족한 항목은 언급하지 않거나, '해당 기간 기록이 충분하지 않습니다' 정도로만 짧게 적으세요.",
        "다음 흐름으로 4~8문장 작성하세요: (1) 기간 요약 (2) 잘한 점 (3) 보완점 (4) 가정 안내.",
        "",
        `학생 이름: ${input.studentName}`,
        `기간: ${input.periodStart} ~ ${input.periodEnd}`,
        `관찰 키워드: ${keywordSummary}`,
        `톤: ${input.tone}`,
        "",
        evidenceBlock,
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
