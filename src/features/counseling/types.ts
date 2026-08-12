export type InquiryStatus = "NEW" | "IN_PROGRESS" | "DONE" | "SPAM";

export type CounselingStudentOption = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
};

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
