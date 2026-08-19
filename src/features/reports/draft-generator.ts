import "server-only"; // 서버 전용. 클라이언트 번들에 안 넣는다.

/**
 * 학부모용 학습 리포트 초안을 만든다.
 *
 * 호출: `staff-actions.regenerateDraftWithAi`.
 * Gemini가 설정되어 있으면 `generateText`, 없거나 실패하면 템플릿 문장으로 대체한다.
 * 근거(`evidence.ts`)에 있는 사실만 쓰게 프롬프트를 고정한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 Message를 보내지 않는다 → 원장 `approveAndSendReport`가 SENT.
 * - `evidence 2.ts`를 import하지 않는다 → 런타임은 `evidence.ts`.
 *
 * 관련: `@/lib/ai`, `evidence.ts`.
 */

import { // 의존성. Gemini 없으면 템플릿. Message SENT 아님.
    AiUnavailableError, // Gemini 없으면 템플릿. Message SENT 아님.
    generateText, // Gemini 없으면 템플릿. Message SENT 아님.
    isGeminiConfigured, // Gemini 없으면 템플릿. Message SENT 아님.
} from "@/lib/ai"; // Gemini 없으면 템플릿. Message SENT 아님.
import type { ReportEvidence } from "@/features/reports/evidence"; // 타입만. Gemini 없으면 템플릿. Message SENT 아님.
import { // 의존성. Gemini 없으면 템플릿. Message SENT 아님.
    formatEvidenceForPrompt, // Gemini 없으면 템플릿. Message SENT 아님.
    hasAnyEvidence, // Gemini 없으면 템플릿. Message SENT 아님.
} from "@/features/reports/evidence"; // Gemini 없으면 템플릿. Message SENT 아님.

type ReportDraftInput = { // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
    studentName: string; // 프롬프트·템플릿 표시명. UUID는 넣지 않는다.
    keywords: string[]; // keywords. Gemini 없으면 템플릿. Message SENT 아님.
    tone: string; // REPORT_TONE_OPTIONS. 단호·전문적·그 외(격려).
    periodStart: string; // YYYY-MM-DD.
    periodEnd: string; // periodEnd. Gemini 없으면 템플릿. Message SENT 아님.
    evidence?: ReportEvidence; // evidence.ts 런타임 타입. evidence 2.ts가 아니다.
};

/** Gemini 없이 키워드·톤·근거 요약만으로 검수용 초안을 만든다. */
function buildTemplateDraft(input: ReportDraftInput) { // buildTemplateDraft. Gemini 없으면 템플릿. Message SENT 아님.
    const keywordSummary = // keywordSummary. Gemini 없으면 템플릿. Message SENT 아님.
        input.keywords.filter(Boolean).join(" · ") || "수업 태도"; // 비면 기본 관찰 포인트. 점수를 지어내지 않는다.
    const toneSummary = // toneSummary. Gemini 없으면 템플릿. Message SENT 아님.
        input.tone === "단호" // Gemini 없으면 템플릿. Message SENT 아님.
            ? "개선이 필요한 부분을 명확히 전달했습니다." // REPORT_TONE_OPTIONS와 맞춤.
            : input.tone === "전문적" // 삼항 나머지. Gemini 없으면 템플릿. Message SENT 아님.
              ? "객관적인 학습 관찰을 중심으로 정리했습니다." // 삼항. Gemini 없으면 템플릿. Message SENT 아님.
              : "성장과 노력을 중심으로 격려했습니다."; // 그 외 값은 격려 문장(기본).

    const evidence = input.evidence; // evidence. Gemini 없으면 템플릿. Message SENT 아님.
    const lines = [ // 기간·키워드. 근거가 있으면 요약 문단, 없으면 키워드 문장만.
        `${input.studentName} 학생의 ${input.periodStart} ~ ${input.periodEnd} 학습 리포트입니다.`, // Gemini 없으면 템플릿. Message SENT 아님.
        "", // Gemini 없으면 템플릿. Message SENT 아님.
        `핵심 관찰 포인트: ${keywordSummary}`, // Gemini 없으면 템플릿. Message SENT 아님.
        "", // Gemini 없으면 템플릿. Message SENT 아님.
    ]; // Gemini 없으면 템플릿. Message SENT 아님.

    if (evidence && hasAnyEvidence(evidence)) { // 네 축 중 있는 것만. 없는 축은 추측 문장을 붙이지 않는다.
        lines.push("■ 이번 기간 요약"); // buildTemplateDraft 끝.
        if (evidence.grades.length > 0) { // 가드. Gemini 없으면 템플릿. Message SENT 아님.
            const latest = evidence.grades[0]; // 최신 1건 + 나머지 건수.
            lines.push( // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
                `성적: ${latest.subject}「${latest.title}」 ${latest.score}/${latest.maxScore}(${latest.percent}%)` + // Gemini 없으면 템플릿. Message SENT 아님.
                    (evidence.grades.length > 1 // Gemini 없으면 템플릿. Message SENT 아님.
                        ? ` 외 ${evidence.grades.length - 1}건` // 삼항. Gemini 없으면 템플릿. Message SENT 아님.
                        : "") + // 삼항 나머지. Gemini 없으면 템플릿. Message SENT 아님.
                    "이 확인됩니다.", // Gemini 없으면 템플릿. Message SENT 아님.
            );
        }
        if (evidence.attendance.total > 0) { // 가드. Gemini 없으면 템플릿. Message SENT 아님.
            const a = evidence.attendance; // a. Gemini 없으면 템플릿. Message SENT 아님.
            lines.push( // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
                `출결: 총 ${a.total}회 중 출석 ${a.present}, 지각 ${a.late}, 결석 ${a.absent}` + // Gemini 없으면 템플릿. Message SENT 아님.
                    (a.rateLabel ? ` (출석률 ${a.rateLabel})` : "") + // Gemini 없으면 템플릿. Message SENT 아님.
                    "입니다.", // Gemini 없으면 템플릿. Message SENT 아님.
            );
        }
        if (evidence.learningRecords.length > 0) { // 가드. Gemini 없으면 템플릿. Message SENT 아님.
            lines.push( // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
                `학습 기록: ${evidence.learningRecords // Gemini 없으면 템플릿. Message SENT 아님.
                    .slice(0, 2) // Gemini 없으면 템플릿. Message SENT 아님.
                    .map((r) => r.title) // Gemini 없으면 템플릿. Message SENT 아님.
                    .join(", ")} 등이 있습니다.`, // Gemini 없으면 템플릿. Message SENT 아님.
            );
        }
        if (evidence.wrongNotes.length > 0) { // 가드. Gemini 없으면 템플릿. Message SENT 아님.
            const openCount = evidence.wrongNotes.filter( // openCount. Gemini 없으면 템플릿. Message SENT 아님.
                (n) => n.statusLabel === "미해결", // Gemini 없으면 템플릿. Message SENT 아님.
            ).length; // Gemini 없으면 템플릿. Message SENT 아님.
            lines.push( // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
                `오답: ${evidence.wrongNotes.length}건` + // Gemini 없으면 템플릿. Message SENT 아님.
                    (openCount > 0 ? ` (미해결 ${openCount}건)` : "") + // Gemini 없으면 템플릿. Message SENT 아님.
                    "을 중심으로 보완이 필요합니다.", // Gemini 없으면 템플릿. Message SENT 아님.
            );
        }
        lines.push(""); // buildTemplateDraft 끝.
    } else { // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
        lines.push( // 근거가 전부 없으면 키워드 한 문장만. 점수를 지어내지 않는다.
            `이번 기간 수업 참여와 과제 수행을 종합하면, ${keywordSummary} 측면에서 꾸준한 모습이 관찰됩니다.`, // Gemini 없으면 템플릿. Message SENT 아님.
        );
    }

    lines.push(toneSummary); // 톤 문장. 학부모 Message는 여기서 보내지 않는다.
    lines.push(""); // 호출 끝.
    lines.push( // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
        "가정에서도 짧은 복습과 질문 습관을 이어가 주시면 다음 기간 성장에 도움이 됩니다.", // Gemini 없으면 템플릿. Message SENT 아님.
    );
    lines.push(""); // 호출 끝.
    lines.push("(초안 — 내용 확인 후 수정해 주세요)"); // 교사 검수 표시. SENT가 아니다.

    return lines.join("\n"); // 반환. Gemini 없으면 템플릿. Message SENT 아님.
}

/**
 * 시스템 규칙 + 근거 블록. "근거에 없는 사실은 만들지 마세요"를 매번 넣는다.
 */
function buildAiPrompt(input: ReportDraftInput) { // buildAiPrompt. Gemini 없으면 템플릿. Message SENT 아님.
    const keywordSummary = // keywordSummary. Gemini 없으면 템플릿. Message SENT 아님.
        input.keywords.filter(Boolean).join(" · ") || "수업 태도"; // Gemini 없으면 템플릿. Message SENT 아님.
    const evidenceBlock = input.evidence // evidenceBlock. Gemini 없으면 템플릿. Message SENT 아님.
        ? formatEvidenceForPrompt(input.evidence) // evidence.ts 직렬화. 이 JSON/블록이 유일한 사실 출처다.
        : "- 성적/출결/학습기록/오답: 제공되지 않음"; // 모델이 점수를 만들지 못하게.

    return [ // 근거에 없는 사실은 만들지 마세요. 출력은 본문만.
        "학원 학부모에게 보낼 학습 리포트 초안을 한국어로 작성하세요.", // Gemini 없으면 템플릿. Message SENT 아님.
        "과장·허위 사실 없이, 선생님이 검수할 수 있는 초안 문체로 작성하세요.", // Gemini 없으면 템플릿. Message SENT 아님.
        "개인정보·연락처·민감 정보는 넣지 마세요.", // Gemini 없으면 템플릿. Message SENT 아님.
        "아래 [기간 내 학습 근거]에 있는 사실만 사용하세요. 근거에 없는 점수·출결·사건·성취는 추측하거나 만들어내지 마세요.", // Gemini 없으면 템플릿. Message SENT 아님.
        "근거가 부족한 항목은 언급하지 않거나, '해당 기간 기록이 충분하지 않습니다' 정도로만 짧게 적으세요.", // Gemini 없으면 템플릿. Message SENT 아님.
        "다음 흐름으로 4~8문장 작성하세요: (1) 기간 요약 (2) 잘한 점 (3) 보완점 (4) 가정 안내.", // Gemini 없으면 템플릿. Message SENT 아님.
        "", // Gemini 없으면 템플릿. Message SENT 아님.
        `학생 이름: ${input.studentName}`, // Gemini 없으면 템플릿. Message SENT 아님.
        `기간: ${input.periodStart} ~ ${input.periodEnd}`, // Gemini 없으면 템플릿. Message SENT 아님.
        `관찰 키워드: ${keywordSummary}`, // Gemini 없으면 템플릿. Message SENT 아님.
        `톤: ${input.tone}`, // Gemini 없으면 템플릿. Message SENT 아님.
        "", // Gemini 없으면 템플릿. Message SENT 아님.
        evidenceBlock, // Gemini 없으면 템플릿. Message SENT 아님.
        "", // Gemini 없으면 템플릿. Message SENT 아님.
        "출력은 본문만 작성하고, 제목/머리말/코드블록은 넣지 마세요.", // Gemini 없으면 템플릿. Message SENT 아님.
    ].join("\n"); // buildAiPrompt 끝.
}

/**
 * 초안 본문과 AI 사용 여부를 반환한다.
 * 키가 없거나 호출이 실패해도 템플릿을 돌려, 교사 화면이 빈 본문을 받지 않게 한다.
 */
export async function createReportDraft( // createReportDraft. Gemini 없으면 템플릿. Message SENT 아님.
    input: ReportDraftInput, // input. Gemini 없으면 템플릿. Message SENT 아님.
): Promise<{ content: string; usedAi: boolean; fallbackReason?: string }> { // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
    const templateDraft = buildTemplateDraft(input); // Gemini 없거나 실패해도 빈 본문을 주지 않게 미리 만든다.

    if (!isGeminiConfigured()) { // 키가 없으면 Gemini를 호출하지 않는다. 네트워크 오류와 구분해 안내한다.
        return { // 반환. Gemini 없으면 템플릿. Message SENT 아님.
            content: templateDraft, // content. Gemini 없으면 템플릿. Message SENT 아님.
            usedAi: false, // usedAi 선택.
            fallbackReason: "GEMINI_API_KEY 미설정", // fallbackReason. Gemini 없으면 템플릿. Message SENT 아님.
        };
    }

    try { // 실패 시 템플릿/롤백. Gemini 없으면 템플릿. Message SENT 아님.
        const content = await generateText(buildAiPrompt(input)); // Gemini가 설정되어 있으면 generateText. 성공 시 usedAi=true.
        return { content, usedAi: true }; // 반환. Gemini 없으면 템플릿. Message SENT 아님.
    } catch (error) { // 블록 시작. Gemini 없으면 템플릿. Message SENT 아님.
        const fallbackReason = // fallbackReason. Gemini 없으면 템플릿. Message SENT 아님.
            error instanceof AiUnavailableError // Gemini 없으면 템플릿. Message SENT 아님.
                ? error.message // 삼항. Gemini 없으면 템플릿. Message SENT 아님.
                : "Gemini 호출 실패"; // 호출 실패 시 템플릿. 교사 화면이 빈 본문을 받지 않게 한다.
        return { // 반환. Gemini 없으면 템플릿. Message SENT 아님.
            content: templateDraft, // content. Gemini 없으면 템플릿. Message SENT 아님.
            usedAi: false, // usedAi 선택.
            fallbackReason, // Gemini 없으면 템플릿. Message SENT 아님.
        };
    }
}
