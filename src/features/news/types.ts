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
export type NewsKind = "NOTICE" | "BANNER"; // 피드 카드 종류. 공개 공지 CRUD의 kind=NOTICE와 역할이 다르다.

/**
 * 피드 분류. 학생 조회는 STUDENT_YOUTH·GENERAL만 허용한다.
 * PARENT_ADMISSION / PARENT_NOTICE는 학부모 피드 전용.
 */
export type NewsCategory = // 학생 where는 PARENT_ADMISSION을 뺀다.
    | "PARENT_ADMISSION" // 학부모 피드 전용. 학생 조회·칩에서 뺀다.
    | "PARENT_NOTICE" // 학부모 공지. 학생 칩에 없다.
    | "STUDENT_YOUTH" // 학생 피드 허용 카테고리.
    | "GENERAL"; // 학부모·학생 피드에 같이 나온다.

/** PARENT/STUDENT는 역할 피드, ALL은 양쪽 피드에 같이 나온다. */
export type NewsAudience = "PARENT" | "STUDENT" | "ALL"; // 공개 /notices audience=ALL과 쿼리가 다르다.

/** 피드 한 장. 날짜는 ISO 문자열, 화면은 KST로 표시한다. */
export type NewsItem = { // 역할 피드. 공개 Notice 카드와 DTO를 나눈다.
    id: string; // 피드 행. 공개 /notices 카드와 DTO를 나눈다.
    kind: NewsKind; // NOTICE=글, BANNER=이미지·링크. 공개 공지 CRUD의 kind=NOTICE와 역할이 다르다.
    category: NewsCategory; // 학생 조회는 STUDENT_YOUTH·GENERAL만. PARENT_*는 학부모 전용.
    audience: NewsAudience; // PARENT/STUDENT는 역할 피드, ALL은 양쪽.
    title: string; // 카드 제목.
    content: string | null; // 본문. 없으면 화면이 "상세 내용이 없습니다."
    imageUrl: string | null; // http(s)만 NewsScreen이 연다.
    linkUrl: string | null; // 자세히 보기. javascript: 는 isSafeExternalUrl이 거절.
    startsAt: string | null; // ISO 게시 시작. data.ts가 기간 밖을 뺀다.
    endsAt: string | null; // ISO 게시 종료.
    createdAt: string; // ISO. 화면은 KST 연·월·일.
};
