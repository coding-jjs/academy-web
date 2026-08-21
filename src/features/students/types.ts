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

import type { AttendanceStatus } from "@/features/attendance/types";

/** 원생 카드 상태. 퇴원 후 당일 유예는 lifecycle이 User를 나중에 막는다. */
export type StudentStatus = "ENROLLED" | "PAUSED" | "WITHDRAWN";

/** 현재 ACTIVE 수강 한 줄. `enrollmentId`는 해제 액션에 넘긴다. */
export type DirectorStudentClass = {
    enrollmentId: string;
    classId: string;
    className: string;
    teacherName: string | null;
    enrolledAt: string;
};

/** 이미 끝난 수강. status는 CANCELLED 등. 행 삭제가 아니라 endedAt이 있는 이력. */
export type DirectorStudentChange = {
    id: string;
    className: string;
    endedAt: string;
    status: string;
};

/**
 * 원장 원생 테이블/상세 한 행.
 * `googleLinked`는 Student.user 존재 여부. userId:null 카드는 false.
 */
export type DirectorStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: StudentStatus;
    googleLinked: boolean;
    email: string | null;
    parentCount: number;
    parentNames: string[];
    classes: DirectorStudentClass[];
    recentChanges: DirectorStudentChange[];
};

/** 수강 추가 드롭다운. active 반만 data 레이어가 채운다. */
export type DirectorClassOption = {
    id: string;
    name: string;
    teacherName: string | null;
};

/** 학습기록 폼의 반 선택. staff-scope로 걸러진 반만. */
export type StaffClassOption = {
    id: string;
    name: string;
    subject: string;
};

/**
 * 교사·직원 원생 워크스페이스 한 행.
 * 최근 출석 5 / 성적 3 / 학습기록 5는 data 쿼리 take와 맞춰 둔다.
 */
export type StaffStudentRow = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: StudentStatus;
    googleLinked: boolean;
    email: string | null;
    classes: {
        id: string;
        name: string;
        subject: string;
        teacherName: string | null;
    }[];
    parents: { name: string; relationship: string | null }[];
    recentAttendance: {
        status: AttendanceStatus;
        className: string;
        startsAt: string;
        checkInAt: string | null;
    }[];
    recentGrades: {
        id: string;
        title: string;
        subject: string;
        score: number;
        maxScore: number;
        assessedAt: string;
    }[];
    recentRecords: {
        id: string;
        type: string;
        title: string;
        content: string;
        recordDate: string;
        authorName: string;
    }[];
};
