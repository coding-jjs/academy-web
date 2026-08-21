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
export type InquiryStatus = "NEW" | "IN_PROGRESS" | "DONE" | "SPAM"; // 직원 큐는 NEW/IN_PROGRESS. DONE/SPAM은 뺀다.

/** 상담 메모를 남길 학생 선택 항목. */
export type CounselingStudentOption = { // 메모 대상. 게스트 문의 보호자가 아니다.
    id: string; // 원생 카드. 직원 메모는 ENROLLED만.
    name: string; // 상담 대상 이름.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 온보딩 학년.
    className: string | null; // take:1 표시용 현재 반.
    teacherName: string | null; // 그 반 담임.
};

/** 직원·원장 목록에 쓰는 상담 메모 행. */
export type StaffCounselingMemo = { // 목록 행. 수정·삭제는 없다.
    id: string; // 메모 행. 수정·삭제는 없다.
    content: string; // 상담 본문 2~2000자.
    counseledAt: string; // ISO 상담 일시. 화면은 KST datetime.
    createdAt: string; // ISO 작성 시각.
    studentId: string; // 원장 화면이 상세에서 이 id로 다시 건다.
    studentName: string; // 목록에 찍는 원생 이름.
    studentGrade: string | null; // 학년 표시.
    authorName: string; // 작성자 User 이름. 교사 onlyOwnMemos는 본인만.
};

/** 직원 상담 화면의 미완료 입학 문의. 제출자 userId는 없다(게스트 문의). */
export type StaffInquiryItem = { // 게스트 문의. createInquiry는 userId를 안 붙인다.
    id: string; // updateInquiryStatus의 inquiryId. 교사 화면은 목록이 비어 있다.
    guardianName: string; // 게스트 폼 보호자 이름. 제출자 userId는 없다.
    phone: string; // 연락처.
    studentGrade: string | null; // 선택 학년.
    interestedSubject: string | null; // 선택 과목.
    preferredTime: string | null; // 선택 희망 시간.
    message: string | null; // 선택 본문.
    status: InquiryStatus; // 직원 큐는 NEW/IN_PROGRESS만. DONE/SPAM은 빼 둔다.
    createdAt: string; // ISO 접수 시각.
    assigneeName: string | null; // 상태를 바꾼 사무. 별도 배정 UI는 없다.
};
