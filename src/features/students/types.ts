/**
 * 원장·직원 원생 화면이 공유하는 목록/행 타입.
 *
 * 호출:
 * - 원장: `director-data` → `DirectorStudentsScreen` 및 상세/상담 컴포넌트
 * - 직원: `staff-data` → `StaffStudentsScreen`, 챗봇 컨텍스트
 *
 * `DirectorStudent`는 수강·학부모 요약, `StaffStudentRow`는 최근 출석·성적·기록을 담는다.
 * 상태 전이는 타입이 아니라 `lib/student-lifecycle.ts`가 수행한다.
 *
 * 의도적으로 하지 않는 일:
 * - Prisma Student 전체를 노출하지 않는다. 화면이 필요한 필드만.
 *
 * 관련: `features/students/director-data.ts`, `staff-data.ts`,
 * `features/attendance/types.ts`.
 */

import type { AttendanceStatus } from "@/features/attendance/types"; // 최근 출석 상태. AbsenceRequest가 아니다.

/** 원생 카드 상태. 퇴원 후 당일 유예는 lifecycle이 User를 나중에 막는다. */
export type StudentStatus = "ENROLLED" | "PAUSED" | "WITHDRAWN"; // 전이는 updateStudentStatus → lifecycle. 여기서는 표시만.

/** 현재 ACTIVE 수강 한 줄. `enrollmentId`는 해제 액션에 넘긴다. */
export type DirectorStudentClass = { // CANCELLED 수강은 recentChanges.
    enrollmentId: string; // endStudentEnrollment이 CANCELLED+endedAt. 행 삭제가 아니다.
    classId: string; // 반 id.
    className: string; // 반 이름.
    teacherName: string | null; // 담당 미지정이면 null.
    enrolledAt: string; // ISO. 수강 시작 표시.
};

/** 이미 끝난 수강. status는 CANCELLED 등. 행 삭제가 아니라 endedAt이 있는 이력. */
export type DirectorStudentChange = { // 학생당 최신 5건. data가 자른다.
    id: string; // 종료된 ClassEnrollment.id.
    className: string; // 반 이름.
    endedAt: string; // 해제 시각 ISO. 출석·청구 이력이 학생에 남는다.
    status: string; // 주로 CANCELLED.
};

/**
 * 원장 원생 테이블/상세 한 행.
 * `googleLinked`는 Student.user 존재 여부. userId:null 카드는 false.
 */
export type DirectorStudent = { // 원장은 퇴원도 본다. 스코프 없음.
    id: string; // Student.id. User.id가 아니다.
    name: string; // 원생 이름.
    schoolName: string | null; // 학교.
    grade: string | null; // 학년.
    status: StudentStatus; // 재원/휴원/퇴원.
    googleLinked: boolean; // false면 STUDENT 역할 부여 대상 카드일 수 있다.
    email: string | null; // Student.user.email. 미연결이면 null.
    parentCount: number; // 활성 ParentStudentLink 수. 보통 0 또는 1.
    parentNames: string[]; // "이름 (관계)".
    classes: DirectorStudentClass[]; // ACTIVE+endedAt null만.
    recentChanges: DirectorStudentChange[]; // 학생당 최신 5건.
};

/** 수강 추가 드롭다운. active 반만 data 레이어가 채운다. */
export type DirectorClassOption = { // 비활성 반은 add가 거절하므로 옵션에서 뺀다.
    id: string; // classId.
    name: string; // 반 이름.
    teacherName: string | null; // 담당.
};

/** 학습기록 폼의 반 선택. staff-scope로 걸러진 반만. */
export type StaffClassOption = { // viewAllStudents가 없으면 담당반만.
    id: string; // classId. createLearningRecord의 선택 classId.
    name: string; // 반 이름.
    subject: string; // 과목.
};

/**
 * 교사·직원 원생 워크스페이스 한 행.
 * 최근 출석 5 / 성적 3 / 학습기록 5는 data 쿼리 take와 맞춰 둔다.
 */
export type StaffStudentRow = { // 권한 스코프는 페이지 where. 이 타입은 표시만.
    id: string; // Student.id.
    name: string; // 원생 이름.
    schoolName: string | null; // 학교.
    grade: string | null; // 학년.
    status: StudentStatus; // 호출 where에 달렸다.
    googleLinked: boolean; // userId 존재.
    email: string | null; // 미연결 null.
    classes: { // ACTIVE+endedAt null만.
        id: string; // 반 id.
        name: string; // 반 이름.
        subject: string; // 과목.
        teacherName: string | null; // 담당.
    }[]; // classes 끝.
    parents: { name: string; relationship: string | null }[]; // 활성 링크만. 연락처는 viewParentContact 화면이 따로.
    recentAttendance: { // take 5. 학부모 신청이 아니다.
        status: AttendanceStatus; // 교사 저장 결과.
        className: string; // 반 이름.
        startsAt: string; // 회차 시작 ISO.
        checkInAt: string | null; // 출석·지각만 값이 있다.
    }[]; // recentAttendance 끝.
    recentGrades: { // take 3.
        id: string; // 성적 행.
        title: string; // 제목.
        subject: string; // 과목.
        score: number; // Number(Decimal).
        maxScore: number; // Number(Decimal).
        assessedAt: string; // 평가일 ISO.
    }[]; // recentGrades 끝.
    recentRecords: { // take 5. create만.
        id: string; // 학습기록 id.
        type: string; // CLASS_NOTE/HOMEWORK/LIFE_RECORD.
        title: string; // 제목.
        content: string; // 본문.
        recordDate: string; // 기록일 ISO.
        authorName: string; // 작성 교사·직원.
    }[]; // recentRecords 끝.
};
