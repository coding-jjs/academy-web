/**
 * 학부모·학생 뉴스 피드 DTO.
 *
 * 호출: news/data.ts, NewsScreen, presentation.ts.
 * NOTICE/BANNER와 audience·카테고리로 공개 공지 모듈과 구분해 피드 필터가 깨지지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 /notices 카드 DTO → `notices/types.ts`.
 * - 작성 폼 필드. 이 모듈은 조회 화면용.
 *
 * 관련: `data.ts`, `NewsScreen.tsx`.
 */

/** NOTICE는 글, BANNER는 이미지·링크 중심 카드. */
export type NewsKind = "NOTICE" | "BANNER";

/**
 * 피드 분류. 학생 조회는 STUDENT_YOUTH·GENERAL만 허용한다.
 * PARENT_ADMISSION / PARENT_NOTICE는 학부모 피드 전용.
 */
export type NewsCategory =
    | "PARENT_ADMISSION"
    | "PARENT_NOTICE"
    | "STUDENT_YOUTH"
    | "GENERAL";

/** PARENT/STUDENT는 역할 피드, ALL은 양쪽 피드에 같이 나온다. */
export type NewsAudience = "PARENT" | "STUDENT" | "ALL";

/** 피드 한 장. 날짜는 ISO 문자열, 화면은 KST로 표시한다. */
export type NewsItem = {
    id: string;
    kind: NewsKind;
    category: NewsCategory;
    audience: NewsAudience;
    title: string;
    content: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
};
