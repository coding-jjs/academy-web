/**
 * 뉴스 카테고리 라벨과 학부모/학생 필터 칩.
 *
 * 호출: NewsScreen이 audience에 따라 PARENT_NEWS_FILTERS 또는 STUDENT_NEWS_FILTERS를 쓴다.
 * 학생 필터는 STUDENT_YOUTH·GENERAL만 두어 조회 쪽 카테고리 제한(`data.ts`)과 맞춘다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 공지 audience 라벨 → `notices/types.ts`.
 * - 서버 where를 여기서 바꾸지 않음. 칩은 UI 필터일 뿐이다.
 *
 * 관련: `types.ts`, `NewsScreen.tsx`.
 */

import type { NewsCategory } from "@/features/news/types"; // 칩 문구. 서버 where는 data.ts.

/** 카테고리 → 칩 문구·색. */
export const NEWS_CATEGORY_METADATA: Record< // 화면 칩. 학생 where는 PARENT_ADMISSION을 뺀다.
    NewsCategory, // PARENT_*는 학부모 전용. 학생 칩은 STUDENT_YOUTH·GENERAL만.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // 화면 칩. 서버 enum이 아니다.
> = { // 상태 코드를 화면이 직접 해석하지 않게.
    PARENT_ADMISSION: { label: "입학·모집", tone: "warning" }, // 학부모 피드 전용. 학생 where에서 뺀다.
    PARENT_NOTICE: { label: "학부모 공지", tone: "success" }, // 학생 칩·조회에 없다.
    STUDENT_YOUTH: { label: "체험·진로", tone: "neutral" }, // 학생 피드 허용 카테고리.
    GENERAL: { label: "일반", tone: "neutral" }, // 학부모·학생 피드에 같이 나온다.
};

/** 학부모 피드 칩. 입학·학부모 공지를 포함한다. */
export const PARENT_NEWS_FILTERS: Array<{ // 입학 칩 포함. 학생 필터와 배열을 나눈다.
    id: "ALL" | NewsCategory; // 서버가 준 PARENT+ALL을 칩으로 다시 건다.
    label: string; // 화면이 enum을 직접 해석하지 않게.
}> = [ // 학부모 전용 칩. 서버 where를 바꾸지 않는다.
    { id: "ALL", label: "전체" }, // 서버가 준 PARENT+ALL 전부를 칩으로 다시 건다.
    ...Object.entries(NEWS_CATEGORY_METADATA).map(([id, metadata]) => ({ // 입학·학부모 공지 칩을 포함한다.
        id: id as NewsCategory, // 입학·학부모 공지 칩을 포함한다.
        label: metadata.label, // 화면이 enum을 직접 해석하지 않게.
    })),
]; // PARENT_NEWS_FILTERS 끝.

/**
 * 학생 피드 칩. PARENT_ADMISSION / PARENT_NOTICE를 빼
 * 서버가 주지 않는 분류를 눌러도 빈 목록만 나오는 일을 막는다.
 */
export const STUDENT_NEWS_FILTERS: Array<{ // 입학 칩 없음. 서버 where와 맞춘다.
    id: "ALL" | "STUDENT_YOUTH" | "GENERAL"; // PARENT_ADMISSION 칩을 두지 않는다.
    label: string; // 화면이 enum을 직접 해석하지 않게.
}> = [ // 학생 전용. 입학·학부모 공지 칩은 없다.
    { id: "ALL", label: "전체" }, // 서버 where가 이미 PARENT_*를 뺀 목록.
    { // STUDENT_YOUTH 칩. 입학 카테고리 칩은 두지 않는다.
        id: "STUDENT_YOUTH", // 학생 피드 허용. 입학 카테고리 칩은 두지 않는다.
        label: NEWS_CATEGORY_METADATA.STUDENT_YOUTH.label, // 메타와 같은 문구.
    },
    { id: "GENERAL", label: NEWS_CATEGORY_METADATA.GENERAL.label }, // 학생·학부모 공통 일반.
]; // STUDENT_NEWS_FILTERS 끝.
