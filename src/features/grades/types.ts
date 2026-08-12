export type WrongNoteStatus = "OPEN" | "REVIEWED" | "MASTERED";

export type GradesStudentOption = {
    id: string;
    name: string;
    className: string | null;
    classId: string | null;
};

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

export type GradeHighlight = {
    subject: string;
    score: number;
    delta: number | null;
};

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
