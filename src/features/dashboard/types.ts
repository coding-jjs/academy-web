/**
 * 원장·스태프·학부모·학생 역할 홈 대시보드가 공유하는 조회 모델이다.
 *
 * 호출: 각 `*-data.ts`가 채우고 `(director|teacher|parent|student)/dashboard` 화면이 읽는다.
 * 역할마다 묶음이 달라, 화면이 필요한 필드만 받게 나눈다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 마케팅 홈(`/`) 모델 → `features/home`. 여기는 로그인 후 역할 대시보드.
 * - 상태 전이 액션. 숫자·오늘 세션·자녀 요약만.
 *
 * 관련: `director-data.ts`, `staff-data.ts`, `parent-data.ts`, `student-data.ts`.
 */

import type { AttendanceStatus } from "@/features/attendance/types"; // 오늘 출결 코드. 마케팅 홈이 아니다.

/** 원장 홈 카드용 집계. 오늘 출석률은 세션 출결 분모가 0이면 null. */
export type DirectorDashboardMetrics = { // 카드 숫자만. 승인·감지 실행은 없다.
    pendingReports: number; // PENDING_APPROVAL.
    openChurn: number; // DETECTED·COUNSELING만. IMPROVED·WITHDRAWN 제외.
    overdueInvoices: number; // OVERDUE 건수.
    newInquiries: number; // Inquiry status=NEW.
    enrolledStudents: number; // Student ENROLLED.
    guestUsers: number; // 온보딩 끝난 GUEST. 역할 부여 대기.
    todayAttendanceRate: number | null; // 0건이면 0%가 아니라 null.
    todaySessionCount: number; // 오늘 세션 건수. 상태 무관.
};

/** 교사·직원 홈의 오늘 수업 한 칸. uncheckedCount는 출결 미체크 재원 수. */
export type StaffDashboardSession = { // 오늘 칸. 공개 홈 배너가 아니다.
    id: string; // ClassSession PK.
    classId: string; // Class PK.
    className: string; // 반 이름.
    subject: string; // 과목.
    classroom: string | null; // 교실.
    timeLabel: string; // 표시용 시각.
    startsAt: string; // ISO.
    studentCount: number; // 재원 수.
    uncheckedCount: number; // 출결 행이 없는 재원. 결석으로 찍힌 건 체크된 것.
};

/** 스태프 홈 지표. openInquiries는 사무 직원만 data가 채운다. */
export type StaffDashboardMetrics = { // 교사 홈 openInquiries=0.
    todayClassCount: number; // 오늘 수업 수.
    firstClassTime: string | null; // 첫 수업 시각 라벨.
    uncheckedSessions: number; // 미체크 있는 세션 수.
    pendingReports: number; // DRAFTING·PENDING·REJECTED. SENT는 제외.
    myStudentCount: number; // 담당 재원.
    openInquiries: number; // 교사 홈은 0.
};

/** 홈 공지 3건용 짧은 행. */
export type DashboardNewsItem = { // 역할 홈 미리보기. 공개 /notices 전체가 아니다.
    id: string; // NewsItem PK.
    title: string; // 제목만. 본문 없음.
    createdAt: string; // ISO.
};

/** 학부모 홈 자녀 한 명. 오늘 수업·도착 요약·최근 SENT 리포트. */
export type ParentDashboardChild = { // 종료되지 않은 링크만.
    id: string; // Student PK.
    name: string; // 자녀 이름.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12.
    className: string | null; // 활성 반.
    teacherName: string | null; // 반 담당.
    arrivalSummary: { // 오늘 첫 수업 도착.
        title: string; // 요약 제목.
        detail: string; // 보조 문장.
        status: AttendanceStatus | null; // 출결 코드.
        checkInAt: string | null; // 체크인 시각.
    } | null; // 오늘 첫 수업만.
    todaySessions: Array<{ // 오늘 칸.
        id: string; // ClassSession PK.
        className: string; // 반 이름.
        subject: string; // 과목.
        timeLabel: string; // 시각 라벨.
        classroom: string | null; // 교실.
        attendanceStatus: AttendanceStatus | null; // null=미체크.
    }>; // 오늘 세션 목록.
    reports: Array<{ // SENT만 최대 3건. 초안은 학부모 홈에 올리지 않는다.
        id: string; // AiReport PK.
        content: string; // 발송 본문.
        teacherName: string; // 작성 교사.
        sentAt: string | null; // 발송 시각.
        parentReadAt: string | null; // 읽음 시각.
        periodStart: string; // ISO.
        periodEnd: string; // ISO.
    }>; // SENT만 최대 3건. 초안은 학부모 홈에 올리지 않는다.
};

/** 학부모 홈 페이로드. 안 읽은 쪽지 수와 뉴스 3건을 같이. */
export type ParentDashboardData = { // 마케팅 홈 viewer가 아니다.
    childList: ParentDashboardChild[]; // 연결 자녀.
    unreadCount: number; // 안 읽은 쪽지.
    news: DashboardNewsItem[]; // 공지 3건.
};

/**
 * 학생 홈 페이로드.
 * linked=false면 프로필 연결 전. 화면이 빈 카드만 그리게 필드를 0/null로 둔다.
 */
export type StudentDashboardData = { // linked=false면 세션 쿼리를 안 돈다.
    studentName: string; // User.name.
    schoolName: string | null; // 온보딩 학교.
    grade: string | null; // 1~12.
    linked: boolean; // false면 세션 쿼리를 돌리지 않은 빈 홈.
    todaySessions: Array<{ // linked=false면 [].
        id: string; // ClassSession PK.
        className: string; // 반 이름.
        subject: string; // 과목.
        timeLabel: string; // 시각 라벨.
        classroom: string | null; // 교실.
        startsAt: string; // ISO.
        attendanceStatus: AttendanceStatus | null; // null=미체크.
    }>; // 오늘 세션.
    nextSession: { // 다음 수업. 없으면 null.
        className: string; // 반 이름.
        timeLabel: string; // 시각 라벨.
        classroom: string | null; // 교실.
    } | null; // 오늘 이후 다음 칸.
    todayAttendanceLabel: AttendanceStatus | null; // 오늘 첫 세션 기록.
    latestGrade: { // 최근 성적 1건.
        subject: string; // 과목.
        title: string; // 평가명.
        score: number; // 점수.
        maxScore: number; // 만점.
        assessedAt: string; // YYYY-MM-DD.
    } | null; // 없으면 카드 비움.
    openWrongCount: number; // OPEN 오답 수.
    unreadCount: number; // 안 읽은 쪽지.
    news: DashboardNewsItem[]; // 공지 3건. 학부모 전용 안내는 학생 피드에서 뺀다.
    homework: Array<{ // 숙제 메모.
        id: string; // 기록 PK.
        title: string; // 제목.
        content: string; // 본문.
        recordDate: string; // 날짜.
    }>; // linked=false면 [].
};
