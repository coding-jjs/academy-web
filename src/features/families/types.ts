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
export type LinkableParent = { // GUEST로 떨어진 계정은 data가 안 넣는다.
    id: string; // User.id. linkParentStudent의 parentUserId.
    name: string; // 온보딩 이름.
    email: string; // 동명이인 구분. GUEST로 떨어진 계정은 이 목록에 없다.
};

/**
 * 재원·STUDENT 로그인 연결됨·활성 학부모 링크 없음.
 * 한 학생에 활성 보호자는 최대 1명이라는 규칙의 후보 집합.
 */
export type LinkableStudent = { // 이미 활성 링크가 있으면 data가 후보에서 뺀다.
    id: string; // Student.id. 이미 활성 링크가 있으면 data가 후보에서 뺀다.
    name: string; // 원생 이름.
    schoolName: string | null; // 옵션 라벨.
    grade: string | null; // 옵션 라벨.
};

/** 현재 유효한 ParentStudentLink 한 줄. 해제 버튼의 `linkId`가 여기 id다. */
export type ActiveFamilyLink = { // endedAt null만. 이력 행은 화면에 안 내린다.
    id: string; // ParentStudentLink.id. unlinkParentStudent가 endedAt을 찍는다.
    relationship: string | null; // 어머니/아버지/조부모/기타 보호자.
    linkedAt: string; // 연결 시각 ISO. 최근 연결순 정렬.
    parent: { // 원장 연락용. viewParentContact와 별개.
        name: string; // 학부모 이름.
        email: string; // 학부모 이메일.
        phone: string | null; // 원장이 연락할 때. viewParentContact와 별개로 원장 화면.
    };
    student: { // Google이 없으면 email null.
        name: string; // 원생 이름.
        schoolName: string | null; // 학교.
        grade: string | null; // 학년.
        email: string | null; // Student.user 이메일. 카드만 있고 Google이 없으면 null.
    };
};
