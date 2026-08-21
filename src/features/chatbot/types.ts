/**
 * 챗봇 컨텍스트 JSON의 역할별 형태(학부모/학생/스태프)를 정의한다.
 *
 * 호출: `context.ts`가 채우고 `prompt.ts`가 `[데이터]` 블록으로 직렬화한다.
 * 프롬프트는 이 구조만 사실로 읽는다. 이메일·전화번호·UUID는 넣지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 성적 수정·출결 정정 API 스키마가 아니다. 조회 스냅샷만.
 * - 스태프 목록의 오답·출결은 요약에 비워 두고, 포커스 학생만 상세를 채운다.
 *
 * 관련: `context.ts`, `prompt.ts`, `app/api/chat/route.ts`.
 */

/** 성적 한 건. assessedAt은 YYYY-MM-DD (예: 2026-08-10). */
export type ChatbotGrade = { // JSON 사실. 시각·타임존은 넣지 않는다.
    subject: string; // 과목명.
    title: string; // 평가명.
    score: number; // 득점.
    maxScore: number; // 만점.
    percent: number | null; // 백분율. 없으면 말하지 말라고 프롬프트가 고정.
    assessedAt: string; // YYYY-MM-DD. 시각·타임존은 넣지 않는다.
    className: string | null; // 반 이름.
};

/** 오답 한 건. 문항 본문은 넣지 않고 번호·상태만. */
export type ChatbotWrongNote = { // 문항 본문·이메일은 넣지 않는다.
    subject: string | null; // 과목.
    questionNo: string | null; // 번호만. 문항 텍스트 없음.
    status: "OPEN" | "REVIEWED" | "MASTERED"; // 오답 상태.
    createdAt: string; // 날짜 문자열.
};

/** 이번 달 출결 횟수. null이면 프롬프트가 횟수를 말하지 말라고 한다. */
export type ChatbotAttendanceSummary = { // 스태프 목록 행은 비우고 포커스만 채운다.
    monthLabel: string; // KST YYYY-MM.
    present: number; // 출석.
    late: number; // 지각.
    absent: number; // 결석.
    earlyLeave: number; // EXCUSED는 이 요약에 넣지 않는다.
};

/** 오늘/이번 주 수업 한 칸. attendanceStatus null은 아직 미체크. */
export type ChatbotSessionSummary = { // 보강·휴원은 이 배열에 없으면 안내하지 말라고 한다.
    date: string; // YYYY-MM-DD.
    timeLabel: string; // 시각 라벨.
    className: string; // 반 이름.
    subject: string; // 과목.
    classroom: string | null; // 교실.
    attendanceStatus: // 프롬프트가 코드를 한글로 읽는다.
        | "PRESENT" // 출석.
        | "LATE" // 지각.
        | "ABSENT" // 결석.
        | "EARLY_LEAVE" // 조퇴.
        | "EXCUSED" // 공결.
        | null; // null = 아직 기록 없음. 프롬프트가 지어내지 말라고 한다.
};

/** 학생 한 명의 사실 스냅샷. 프롬프트가 이 필드만 인용한다. */
export type ChatbotStudentSnapshot = { // UUID·이메일·전화는 넣지 않는다.
    name: string; // UUID·이메일은 넣지 않는다.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12.
    className: string | null; // 활성 반.
    teacherName: string | null; // 반 담당.
    openWrongCount: number; // OPEN 오답 수. 0이면 상세를 지어내지 말라고 한다.
    grades: ChatbotGrade[]; // 최근 성적.
    wrongNotes: ChatbotWrongNote[]; // 목록 행은 비우고 포커스만 채운다.
    attendances: ChatbotAttendanceSummary | null; // null이면 이번 달 횟수를 말하지 말라고 프롬프트가 고정.
    todaySession: ChatbotSessionSummary | null; // null이면 오늘 수업 미확인이라고 답하라고 한다.
    weekSessions: ChatbotSessionSummary[]; // 없는 날짜의 시간표는 안내하지 말라고 한다.
};

/**
 * 역할별 컨텍스트.
 * PARENT는 children, STUDENT는 본인(미연결이면 linked=false),
 * 스태프는 students 요약 + focusedStudent/focusedStatus로 동명이인을 가른다.
 */
export type ChatbotContext = // JSON-only 사실. prompt.ts가 [데이터]로 직렬화.
    | { // 학부모. 연결 자녀만.
          role: "PARENT"; // JSON role. 뷰어 라벨은 prompt가 한글로.
          viewerName: string; // 학부모 표시 이름. 이메일은 넣지 않는다.
          children: ChatbotStudentSnapshot[]; // 빈 배열이면 연결 안내 문장만.
      }
    | { // 학생 본인.
          role: "STUDENT"; // 미연결이면 JSON 대신 안내 문장.
          viewerName: string; // 학생 표시 이름.
          linked: boolean; // false면 student=null. 출결 횟수를 넣지 않는다.
          student: ChatbotStudentSnapshot | null; // linked=false면 null.
      }
    | { // 원장·교사·직원.
          role: "DIRECTOR" | "TEACHER" | "STAFF"; // viewAllStudents로 범위를 가른다.
          viewerName: string; // 스태프 표시 이름.
          viewAllStudents: boolean; // false면 담당 반만.
          students: ChatbotStudentSnapshot[]; // 목록 행은 오답·월출결을 비운다.
          truncated: boolean; // 20명 초과. 나머지는 이름 질문으로 포커스.
          focusedStudent: ChatbotStudentSnapshot | null; // 이름 매칭 상세. 목록보다 우선.
          focusedStatus: "none" | "matched" | "ambiguous" | "not_found"; // ambiguous면 한 명을 추측하지 않는다.
      };
