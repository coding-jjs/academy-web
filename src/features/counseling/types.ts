/**
 * 상담 화면 DTO. 직원·원장이 같은 메모 형태를 쓴다.
 *
 * 호출: StaffCounselingScreen, DirectorStudentsScreen, 문의 패널.
 * 문의 목록은 상담 화면에만 붙여 입학 문의 처리와 생활 상담을 한곳에서 본다.
 *
 * 의도적으로 하지 않는 일:
 * - 게스트 제출 폼 필드 에러 맵 → `inquiries/actions.ts`의 InquiryState.
 * - Prisma Inquiry 모델을 화면에 그대로 노출하지 않음.
 *
 * 관련: `staff-data.ts`, `director-data.ts`, `presentation.ts`.
 */

/** 입학 문의 처리 단계. 직원 화면 큐는 NEW/IN_PROGRESS만 불러온다. */
export type InquiryStatus = "NEW" | "IN_PROGRESS" | "DONE" | "SPAM";

/** 상담 메모를 남길 학생 선택 항목. */
export type CounselingStudentOption = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
};

/** 직원·원장 목록에 쓰는 상담 메모 행. */
export type StaffCounselingMemo = {
    id: string;
    content: string;
    counseledAt: string;
    createdAt: string;
    studentId: string;
    studentName: string;
    studentGrade: string | null;
    authorName: string;
};

/** 직원 상담 화면의 미완료 입학 문의. 제출자 userId는 없다(게스트 문의). */
export type StaffInquiryItem = {
    id: string;
    guardianName: string;
    phone: string;
    studentGrade: string | null;
    interestedSubject: string | null;
    preferredTime: string | null;
    message: string | null;
    status: InquiryStatus;
    createdAt: string;
    assigneeName: string | null;
};
