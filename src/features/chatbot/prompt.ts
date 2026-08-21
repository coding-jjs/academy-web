import "server-only";

/**
 * 시스템 규칙과 [데이터] JSON을 붙여 Gemini 프롬프트를 만든다.
 *
 * 호출: `app/api/chat/route.ts`가 컨텍스트를 만든 뒤 `generateText`에 넘긴다.
 * JSON 스냅샷이 유일한 사실이다. 모델이 점수·학생·일시를 지어내지 못하게 규칙을 고정한다.
 *
 * 의도적으로 하지 않는 일:
 * - DB를 다시 조회하지 않는다. 사실 수집은 `context.ts`.
 * - 마크다운/JSON 출력을 허용하지 않는다. 2~6문장 한국어만.
 *
 * 관련: `types.ts`, `context.ts`.
 */

import type { ChatbotContext } from "./types";

const SYSTEM_RULES = [
    "당신은 A학원 학습 도우미입니다. 학부모·학생·교사·직원·원장이 사용합니다.",
    "아래 [데이터] JSON에 있는 사실만 사용해 한국어로 답하세요.",
    "데이터에 없는 점수, 과목, 학생, 날짜, 출결, 수업 시간은 추측하거나 만들어내지 마세요.",
    "없으면 '확인된 기록이 없습니다'라고 짧게 말하세요.",
    "role이 PARENT 또는 STUDENT이면 출결은 attendances, todaySession, weekSessions만 사용하세요.",
    "attendances가 null이면 이번 달 출석 횟수를 말하지 마세요.",
    "todaySession이 null이면 오늘 수업이 확인되지 않았다고 하세요.",
    "weekSessions에 없는 날짜의 시간표·보강·휴원은 안내하지 마세요.",
    "attendanceStatus는 PRESENT=출석, LATE=지각, ABSENT=결석, EXCUSED=공결, EARLY_LEAVE=조퇴, null=아직 기록 없음으로 읽으세요.",
    "role이 TEACHER, STAFF, DIRECTOR이면 다음 순서로 답하세요.",
    "focusedStudent가 있으면 그 학생의 성적·오답·출결·시간표를 우선하세요. students 요약보다 상세가 맞습니다.",
    "focusedStatus가 ambiguous이면 동명이인이니 반·이름을 더 알려달라고 하세요. 한 명을 추측하지 마세요.",
    "focusedStatus가 none이고 질문에 특정 학생 이름이 있으면, focusedStudent가 없을 때만 '담당 범위에서 확인할 수 없습니다'라고 하세요.",
    "focusedStatus가 none이고 이름이 없으면 students 요약만 사용하세요.",
    "wrongNotes가 빈 배열이거나 openWrongCount가 0이면 오답 상세를 지어내지 마세요. focusedStudent의 오답이 있으면 그걸 쓰세요.",
    "role이 TEACHER, STAFF, DIRECTOR이고 focusedStudent가 있으면 그 학생의 attendances, todaySession, weekSessions로 출결·시간표를 답하세요.",
    "role이 TEACHER, STAFF, DIRECTOR이고 focusedStudent가 없으면 이번 달 출석 횟수나 오늘 수업을 지어내지 말고, 학생 이름을 넣어 달라고 하세요.",
    "viewAllStudents가 false이면 담당 반 범위입니다. true여도 데이터에 있는 사실만 답하세요.",
    "truncated가 true이면 students 요약은 일부입니다. 나머지 학생은 이름을 넣어 물어보면 focusedStudent로 확인할 수 있습니다.",
    "이메일, 전화번호, 학부모 이름, 학생 UUID는 데이터에 있어도 말하지 마세요. (이 챗봇 JSON에는 넣지 않습니다.)",
    "성적 수정, 등록, 환불, 출결 정정은 할 수 없다고 안내하세요.",
    "답변은 2~6문장, 친절하고 쉬운 말투로 작성하세요.",
    "마크다운 제목, 코드블록, JSON은 출력하지 마세요.",
].join("\n");

/** 역할별 빈 데이터 안내 또는 JSON 직렬화. 스태프 truncated면 요약임을 한 줄 더 붙인다. */
function formatContextBlock(context: ChatbotContext): string {
    if (context.role === "PARENT") {
        if (context.children.length === 0) {
            return "연결된 자녀가 없습니다. 학원에 자녀 연결을 요청해 주세요";
        }
    }

    if (context.role === "STUDENT" && !context.linked) {
        return "학생 계정이 연결되지 않았습니다. 학원에 문의해 주세요";
    }

    if (
        context.role === "TEACHER" ||
        context.role === "STAFF" ||
        context.role === "DIRECTOR"
    ) {
        if (context.students.length === 0) {
            return "조회 가능한 재원 학생이 없습니다.";
        }
        const json = JSON.stringify(context, null, 2);
        if (context.truncated) {
            return [
                "students 목록은 일부 요약입니다. focusedStudent가 있으면 그 학생을 우선하세요. 이름이 질문에 있는데 focusedStudent가 null이면 확인할 수 없습니다.",
                json,
            ].join("\n");
        }
        return json;
    }

    return JSON.stringify(context, null, 2);
}

/** 프롬프트 [대화 상대] 라벨. JSON role과 맞춰 모델이 시청자를 혼동하지 않게 한다. */
function viewerLabel(context: ChatbotContext): string {
    if (context.role === "PARENT") return "학부모";
    if (context.role === "STUDENT") return "학생";
    if (context.role === "TEACHER") return "교사";
    if (context.role === "STAFF") return "직원";
    return "원장";
}

/**
 * 시스템 규칙 + 뷰어 + [데이터] JSON + 사용자 질문.
 * 빈 질문은 라우트에서 거르지만, 여기서도 trim 후 비면 던진다.
 */
export function buildChatPrompt(
    context: ChatbotContext,
    userMessage: string,
): string {
    const trimmed = userMessage.trim();
    if (trimmed.length === 0) {
        throw new Error("질문이 비어 있습니다.");
    }
    return [
        SYSTEM_RULES,
        "",
        `[대화 상대] ${viewerLabel(context)} (${context.viewerName})`,
        "",
        "[데이터]",
        formatContextBlock(context),
        "",
        "[질문]",
        trimmed,
    ].join("\n");
}
