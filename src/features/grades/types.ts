/**
 * 성적·오답 화면이 공유하는 DTO.
 *
 * 호출: 입력 화면(`Grades*`)과 학부모/학생 뷰어(`Student*` / `Parent*`)가 같이 import한다.
 * 입력 행과 뷰어 행을 나눠 쓰기 화면이 뷰어 전용 필드(percent, imageUrls)를 쓰지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - Prisma 모델을 화면에 그대로 노출하지 않음.
 * - 날짜는 ISO 문자열. 화면은 `formatters.ts`로 KST 문구를 만든다.
 *
 * 관련: `data.ts`, `viewer-data.ts`, `actions.ts`.
 */

/** 오답 복습 단계. OPEN만 "미복습" 카운트에 들어간다. */
export type WrongNoteStatus = "OPEN" | "REVIEWED" | "MASTERED";

/** 원장·직원 입력 화면의 학생 선택 항목. classId는 성적 저장 시 반을 붙일 때 쓴다. */
export type GradesStudentOption = {
    id: string;
    name: string;
    className: string | null;
    classId: string | null;
};

/** 입력 화면 성적 행. percent는 계산하지 않고 점수/만점만 둔다. */
export type GradesGradeRow = {
    id: string;
    studentId: string;
    title: string;
    subject: string;
    score: number;
    maxScore: number;
    assessedAt: string;
    className: string | null;
};

/** 입력 화면 오답 행. 학생 뷰어의 imageUrls는 없다. */
export type GradesWrongRow = {
    id: string;
    studentId: string;
    gradeRecordId: string | null;
    questionNo: string | null;
    questionText: string | null;
    studentAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    status: WrongNoteStatus;
    createdAt: string;
    gradeTitle: string | null;
};

/** 학부모·학생 성적 카드. percent는 만점이 0이면 null. */
export type StudentGradeRecord = {
    id: string;
    title: string;
    subject: string;
    className: string | null;
    score: number;
    maxScore: number;
    percent: number | null;
    assessedAt: string;
};

/** 과목별 최근 점수와 직전 대비 변화. previous가 없으면 delta는 null. */
export type GradeHighlight = {
    subject: string;
    score: number;
    delta: number | null;
};

/** 학부모·학생 오답 카드. 학부모는 imageCount만, 학생은 imageUrls를 추가로 붙인다. */
export type StudentWrongNote = {
    id: string;
    questionNo: string | null;
    questionText: string | null;
    studentAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    status: WrongNoteStatus;
    createdAt: string;
    className: string | null;
    subject: string | null;
    gradeTitle: string | null;
    imageCount: number;
};

/** 학부모 성적 화면의 자녀 한 명. 링크가 없는 학부모는 빈 배열이다. */
export type ParentGradesChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    highlights: GradeHighlight[];
    openWrongCount: number;
    grades: StudentGradeRecord[];
    wrongNotes: StudentWrongNote[];
};

/**
 * 학생 본인 성적 화면.
 * linked=false면 계정만 있고 Student 행이 없는 상태 — 타 학생 기록을 채우지 않는다.
 */
export type StudentGradesData = {
    linked: boolean;
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    highlights: GradeHighlight[];
    openWrongCount: number;
    grades: StudentGradeRecord[];
    wrongNotes: Array<StudentWrongNote & { imageUrls: string[] }>;
};
