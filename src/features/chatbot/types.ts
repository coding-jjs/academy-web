export type ChatbotGrade = {
    subject: string;
    title: string;
    score: number;
    maxScore: number;
    percent: number | null;
    assessedAt: string; // Ex) 2026-08-10
    className: string | null;
};

export type ChatbotWrongNote = {
    subject: string | null;
    questionNo: string | null;
    status: "OPEN" | "REVIEWED" | "MASTERED";
    createdAt: string;
};

export type ChatbotAttendanceSummary = {
    monthLabel: string;
    present: number;
    late: number;
    absent: number;
    earlyLeave: number;
};

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
