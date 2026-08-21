/**
 * 원장 학부모-원생 연결 화면의 후보·활성 링크 타입.
 *
 * 호출: `features/families/director-data.ts`가 채우고
 * `(director)/director/parents/DirectorParentsScreen.tsx`가 목록·폼에 쓴다.
 *
 * `ActiveFamilyLink`는 `endedAt`이 null인 현재 연결만 표현한다.
 * 해제된 이력 행은 이 화면에 내려주지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 연결 가능 학생에 이미 활성 링크가 있는 원생을 넣지 않는다 → data where.
 *
 * 관련: `features/families/actions.ts`, `features/families/director-data.ts`.
 */

/** 역할이 PARENT이고 온보딩이 끝난 ACTIVE 계정. 연결 폼의 학부모 select. */
export type LinkableParent = {
    id: string;
    name: string;
    email: string;
};

/**
 * 재원·STUDENT 로그인 연결됨·활성 학부모 링크 없음.
 * 한 학생에 활성 보호자는 최대 1명이라는 규칙의 후보 집합.
 */
export type LinkableStudent = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
};

/** 현재 유효한 ParentStudentLink 한 줄. 해제 버튼의 `linkId`가 여기 id다. */
export type ActiveFamilyLink = {
    id: string;
    relationship: string | null;
    linkedAt: string;
    parent: {
        name: string;
        email: string;
        phone: string | null;
    };
    student: {
        name: string;
        schoolName: string | null;
        grade: string | null;
        email: string | null;
    };
};
