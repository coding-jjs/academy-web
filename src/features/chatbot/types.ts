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
export type ChatbotGrade = {
    subject: string;
    title: string;
    score: number;
    maxScore: number;
    percent: number | null;
    assessedAt: string;
    className: string | null;
};

/** 오답 한 건. 문항 본문은 넣지 않고 번호·상태만. */
export type ChatbotWrongNote = {
    subject: string | null;
    questionNo: string | null;
    status: "OPEN" | "REVIEWED" | "MASTERED";
    createdAt: string;
};

/** 이번 달 출결 횟수. null이면 프롬프트가 횟수를 말하지 말라고 한다. */
export type ChatbotAttendanceSummary = {
    monthLabel: string;
    present: number;
    late: number;
    absent: number;
    earlyLeave: number;
};

/** 오늘/이번 주 수업 한 칸. attendanceStatus null은 아직 미체크. */
export type ChatbotSessionSummary = {
    date: string;
    timeLabel: string;
    className: string;
    subject: string;
    classroom: string | null;
    attendanceStatus:
        | "PRESENT"
        | "LATE"
        | "ABSENT"
        | "EARLY_LEAVE"
        | "EXCUSED"
        | null;
};

/** 학생 한 명의 사실 스냅샷. 프롬프트가 이 필드만 인용한다. */
export type ChatbotStudentSnapshot = {
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    openWrongCount: number;
    grades: ChatbotGrade[];
    wrongNotes: ChatbotWrongNote[];
    attendances: ChatbotAttendanceSummary | null;
    todaySession: ChatbotSessionSummary | null;
    weekSessions: ChatbotSessionSummary[];
};

/**
 * 역할별 컨텍스트.
 * PARENT는 children, STUDENT는 본인(미연결이면 linked=false),
 * 스태프는 students 요약 + focusedStudent/focusedStatus로 동명이인을 가른다.
 */
export type ChatbotContext =
    | {
          role: "PARENT";
          viewerName: string;
          children: ChatbotStudentSnapshot[];
      }
    | {
          role: "STUDENT";
          viewerName: string;
          linked: boolean;
          student: ChatbotStudentSnapshot | null;
      }
    | {
          role: "DIRECTOR" | "TEACHER" | "STAFF";
          viewerName: string;
          viewAllStudents: boolean;
          students: ChatbotStudentSnapshot[];
          truncated: boolean;
          focusedStudent: ChatbotStudentSnapshot | null;
          focusedStatus: "none" | "matched" | "ambiguous" | "not_found";
      };
