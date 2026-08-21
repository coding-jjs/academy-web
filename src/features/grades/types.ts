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
export type WrongNoteStatus = "OPEN" | "REVIEWED" | "MASTERED"; // OPEN만 카운트. 전환 허용 값은 actions.ts.

/** 원장·직원 입력 화면의 학생 선택 항목. classId는 성적 저장 시 반을 붙일 때 쓴다. */
export type GradesStudentOption = { // 입력 화면 선택용. 학부모 자녀 DTO가 아니다.
    id: string; // 원생 카드 id. 성적·오답 저장의 studentId.
    name: string; // 출석 명단에 쓰는 이름.
    className: string | null; // take:1 활성 수강 반 표시. 미배정이면 null.
    classId: string | null; // 성적 저장 시 반을 붙일 때. 쓰기 권한의 담임 판정은 아니다.
};

/** 입력 화면 성적 행. percent는 계산하지 않고 점수/만점만 둔다. */
export type GradesGradeRow = { // 쓰기 화면 행. 뷰어 percent는 없다.
    id: string; // 수정 시 gradeId. 삭제는 없다.
    studentId: string; // 워크스페이스가 고른 학생으로 다시 건다.
    title: string; // 주간 테스트 등 평가 제목.
    subject: string; // 과목별 하이라이트 키와 같은 문자열.
    score: number; // Prisma Decimal을 data.ts가 number로 내린 값.
    maxScore: number; // 0이면 뷰어 percent는 null. 입력 화면은 계산하지 않는다.
    assessedAt: string; // ISO. 화면은 formatters로 KST 날짜만 보여 준다.
    className: string | null; // 저장 당시 반 이름. 반 없이 저장하면 null.
};

/** 입력 화면 오답 행. 학생 뷰어의 imageUrls는 없다. */
export type GradesWrongRow = { // 쓰기 화면 오답. 학부모 imageCount도 없다.
    id: string; // 수정 시 wrongNoteId.
    studentId: string; // 고른 학생 오답만 패널에 넘긴다.
    gradeRecordId: string | null; // 연결 성적. updateWrongNote는 이 값을 받지 않는다.
    questionNo: string | null; // 문항 번호. 본문과 둘 다 비면 서버가 거절.
    questionText: string | null; // 문제 본문.
    studentAnswer: string | null; // 학생이 적은 답.
    correctAnswer: string | null; // 정답.
    explanation: string | null; // 해설.
    status: WrongNoteStatus; // OPEN만 미복습 카운트.
    createdAt: string; // ISO 작성 시각.
    gradeTitle: string | null; // 연결 성적 제목. 없으면 목록에 성적 줄을 안 붙인다.
};

/** 학부모·학생 성적 카드. percent는 만점이 0이면 null. */
export type StudentGradeRecord = { // 뷰어 전용. 입력 GradesGradeRow와 나눈다.
    id: string; // 뷰어 행 id. 수정 Action은 없다.
    title: string; // 평가 제목.
    subject: string; // 과목별 최근·직전 하이라이트 키.
    className: string | null; // 저장 당시 반.
    score: number; // Decimal → number.
    maxScore: number; // 0이면 percent=null.
    percent: number | null; // 뷰어만 계산. 입력 화면 GradesGradeRow에는 없다.
    assessedAt: string; // ISO. formatters가 KST로 찍는다.
};

/** 과목별 최근 점수와 직전 대비 변화. previous가 없으면 delta는 null. */
export type GradeHighlight = { // 뷰어 카드. 입력 화면은 이 타입을 안 그린다.
    subject: string; // assessedAt desc 목록에서 과목별 첫 행.
    score: number; // 최근 점수.
    delta: number | null; // 직전이 없으면 null. 입력 화면은 이 카드를 안 그린다.
};

/** 학부모·학생 오답 카드. 학부모는 imageCount만, 학생은 imageUrls를 추가로 붙인다. */
export type StudentWrongNote = { // 뷰어 오답. 학생만 imageUrls를 교차한다.
    id: string; // 뷰어 행. 상태 변경 Action은 없다.
    questionNo: string | null; // 문항 번호.
    questionText: string | null; // 문제 본문.
    studentAnswer: string | null; // 학생 답.
    correctAnswer: string | null; // 정답.
    explanation: string | null; // 해설.
    status: WrongNoteStatus; // OPEN만 미복습 카운트.
    createdAt: string; // ISO.
    className: string | null; // 오답에 붙은 반 이름.
    subject: string | null; // 연결 성적 과목.
    gradeTitle: string | null; // 연결 성적 제목.
    imageCount: number; // 학부모는 장수만. URL은 학생 뷰어 전용.
};

/** 학부모 성적 화면의 자녀 한 명. 링크가 없는 학부모는 빈 배열이다. */
export type ParentGradesChild = { // endedAt:null 링크 자녀. 타 원생을 채우지 않는다.
    id: string; // 자녀 원생 카드. endedAt: null 링크만.
    name: string; // 자녀 이름.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 온보딩 학년.
    className: string | null; // take:1 활성 수강 반. 쓰기 권한 판정은 아니다.
    teacherName: string | null; // 그 반 담임 이름.
    highlights: GradeHighlight[]; // 과목별 최근·직전 상위 3개.
    openWrongCount: number; // OPEN만. REVIEWED/MASTERED는 뺀다.
    grades: StudentGradeRecord[]; // 최근 성적. percent는 여기 있다.
    wrongNotes: StudentWrongNote[]; // imageCount만. imageUrls는 학생 화면.
};

/**
 * 학생 본인 성적 화면.
 * linked=false면 계정만 있고 Student 행이 없는 상태 — 타 학생 기록을 채우지 않는다.
 */
export type StudentGradesData = { // 본인 뷰어. 학부모 자녀 배열이 아니다.
    linked: boolean; // false면 빈 화면. 타 학생 점수를 채우지 않는다.
    studentName: string; // 연결 전이면 세션 이름 fallback.
    schoolName: string | null; // Student 행의 학교.
    grade: string | null; // Student 행의 학년.
    className: string | null; // take:1 표시용 현재 반.
    teacherName: string | null; // 그 반 담임.
    highlights: GradeHighlight[]; // 과목별 최근·직전.
    openWrongCount: number; // OPEN만.
    grades: StudentGradeRecord[]; // 본인 성적. 수정 Action 없음.
    wrongNotes: Array<StudentWrongNote & { imageUrls: string[] }>; // 학생만 사진 URL. 학부모는 imageCount만.
};
