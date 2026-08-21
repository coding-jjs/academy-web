import "server-only"; // 프롬프트 조립. DB는 context.ts.

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

import type { ChatbotContext } from "./types"; // JSON-only 사실 형태.

const SYSTEM_RULES = [ // 모델이 JSON 밖을 지어내지 못하게 고정.
    "당신은 A학원 학습 도우미입니다. 학부모·학생·교사·직원·원장이 사용합니다.", // 역할 공통 도우미.
    "아래 [데이터] JSON에 있는 사실만 사용해 한국어로 답하세요.", // JSON 스냅샷이 유일한 사실. 이 JSON 밖은 확인된 기록이 없다고 답한다.
    "데이터에 없는 점수, 과목, 학생, 날짜, 출결, 수업 시간은 추측하거나 만들어내지 마세요.", // 환각 금지.
    "없으면 '확인된 기록이 없습니다'라고 짧게 말하세요.", // 빈 필드 안내.
    "role이 PARENT 또는 STUDENT이면 출결은 attendances, todaySession, weekSessions만 사용하세요.", // 스태프 목록 요약을 학부모 사실로 쓰지 말 것.
    "attendances가 null이면 이번 달 출석 횟수를 말하지 마세요.", // 횟수 환각 금지.
    "todaySession이 null이면 오늘 수업이 확인되지 않았다고 하세요.", // 보강·휴원 추측 금지.
    "weekSessions에 없는 날짜의 시간표·보강·휴원은 안내하지 마세요.", // 배열에 없는 날짜.
    "attendanceStatus는 PRESENT=출석, LATE=지각, ABSENT=결석, EXCUSED=공결, EARLY_LEAVE=조퇴, null=아직 기록 없음으로 읽으세요.", // 코드→한글.
    "role이 TEACHER, STAFF, DIRECTOR이면 다음 순서로 답하세요.", // 포커스 우선.
    "focusedStudent가 있으면 그 학생의 성적·오답·출결·시간표를 우선하세요. students 요약보다 상세가 맞습니다.", // 목록 행은 오답을 비운다.
    "focusedStatus가 ambiguous이면 동명이인이니 반·이름을 더 알려달라고 하세요. 한 명을 추측하지 마세요.", // 동명이인.
    "focusedStatus가 none이고 질문에 특정 학생 이름이 있으면, focusedStudent가 없을 때만 '담당 범위에서 확인할 수 없습니다'라고 하세요.", // 범위 밖.
    "focusedStatus가 none이고 이름이 없으면 students 요약만 사용하세요.", // 전체 요약.
    "wrongNotes가 빈 배열이거나 openWrongCount가 0이면 오답 상세를 지어내지 마세요. focusedStudent의 오답이 있으면 그걸 쓰세요.", // 오답 환각 금지.
    "role이 TEACHER, STAFF, DIRECTOR이고 focusedStudent가 있으면 그 학생의 attendances, todaySession, weekSessions로 출결·시간표를 답하세요.", // 포커스 출결.
    "role이 TEACHER, STAFF, DIRECTOR이고 focusedStudent가 없으면 이번 달 출석 횟수나 오늘 수업을 지어내지 말고, 학생 이름을 넣어 달라고 하세요.", // 목록은 출결을 비움.
    "viewAllStudents가 false이면 담당 반 범위입니다. true여도 데이터에 있는 사실만 답하세요.", // 원장도 JSON만.
    "truncated가 true이면 students 요약은 일부입니다. 나머지 학생은 이름을 넣어 물어보면 focusedStudent로 확인할 수 있습니다.", // 20명 초과.
    "이메일, 전화번호, 학부모 이름, 학생 UUID는 데이터에 있어도 말하지 마세요. (이 챗봇 JSON에는 넣지 않습니다.)", // PII 금지.
    "성적 수정, 등록, 환불, 출결 정정은 할 수 없다고 안내하세요.", // 조회만.
    "답변은 2~6문장, 친절하고 쉬운 말투로 작성하세요.", // 길이.
    "마크다운 제목, 코드블록, JSON은 출력하지 마세요.", // 평문만.
].join("\n"); // 시스템 규칙 한 블록.

/** 역할별 빈 데이터 안내 또는 JSON 직렬화. 스태프 truncated면 요약임을 한 줄 더 붙인다. */
function formatContextBlock(context: ChatbotContext): string { // DB 재조회 없음.
    if (context.role === "PARENT") { // JSON 스냅샷이 유일한 사실이다. 이 블록 밖 점수·학생은 지어내지 말라고 프롬프트가 고정한다.
        if (context.children.length === 0) { // 연결 자녀 없음.
            return "연결된 자녀가 없습니다. 학원에 자녀 연결을 요청해 주세요"; // JSON 대신 안내 문장.
        }
    }

    if (context.role === "STUDENT" && !context.linked) { // 프로필 미연결.
        return "학생 계정이 연결되지 않았습니다. 학원에 문의해 주세요"; // 프로필 미연결이면 JSON 대신 안내 문장만.
    }

    if ( // 스태프 역할.
        context.role === "TEACHER" || // 담당 반.
        context.role === "STAFF" || // 직원.
        context.role === "DIRECTOR" // 전체.
    ) { // 스태프 JSON.
        if (context.students.length === 0) { // 재원 없음.
            return "조회 가능한 재원 학생이 없습니다."; // JSON 대신 안내.
        }
        const json = JSON.stringify(context, null, 2); // 이메일·UUID는 context에 없음.
        if (context.truncated) { // 20명 초과 요약.
            return [ // 요약임을 한 줄 더.
                "students 목록은 일부 요약입니다. focusedStudent가 있으면 그 학생을 우선하세요. 이름이 질문에 있는데 focusedStudent가 null이면 확인할 수 없습니다.", // truncated 안내.
                json, // JSON-only 사실.
            ].join("\n"); // 안내+JSON.
        }
        return json; // 이 JSON이 모델이 인용할 수 있는 유일한 사실이다.
    }

    return JSON.stringify(context, null, 2); // 학부모 자녀 JSON. 이메일·UUID는 context에 넣지 않는다.
}

/** 프롬프트 [대화 상대] 라벨. JSON role과 맞춰 모델이 시청자를 혼동하지 않게 한다. */
function viewerLabel(context: ChatbotContext): string { // JSON role → 한글.
    if (context.role === "PARENT") return "학부모"; // JSON role과 맞춰 모델이 시청자를 혼동하지 않게 한다.
    if (context.role === "STUDENT") return "학생"; // 본인 스냅샷.
    if (context.role === "TEACHER") return "교사"; // 담당 반.
    if (context.role === "STAFF") return "직원"; // 사무.
    return "원장"; // DIRECTOR.
}

/**
 * 시스템 규칙 + 뷰어 + [데이터] JSON + 사용자 질문.
 * 빈 질문은 라우트에서 거르지만, 여기서도 trim 후 비면 던진다.
 */
export function buildChatPrompt( // route가 generateText에 넘긴다.
    context: ChatbotContext, // context.ts 스냅샷.
    userMessage: string, // 사용자 질문.
): string { // 마크다운/JSON 출력 금지 규칙은 SYSTEM_RULES.
    const trimmed = userMessage.trim(); // 빈 질문은 라우트에서 거르지만, 여기서도 trim 후 비면 던진다.
    if (trimmed.length === 0) { // 공백만.
        throw new Error("질문이 비어 있습니다."); // 모델 호출 전.
    }
    return [ // 시스템 규칙 + 뷰어 + [데이터] JSON(유일한 사실) + 질문.
        SYSTEM_RULES, // JSON-only 규칙.
        "", // 빈 줄.
        `[대화 상대] ${viewerLabel(context)} (${context.viewerName})`, // 시청자 혼동 방지.
        "", // 빈 줄.
        "[데이터]", // 이 JSON이 모델이 인용할 수 있는 유일한 사실이다.
        formatContextBlock(context), // JSON 또는 빈 데이터 안내.
        "", // 빈 줄.
        "[질문]", // 사용자 질문 헤더.
        trimmed, // trim된 질문.
    ].join("\n"); // 최종 프롬프트.
}
