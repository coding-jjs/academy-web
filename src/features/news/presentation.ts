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

import type { NewsCategory } from "@/features/news/types";

/** 카테고리 → 칩 문구·색. */
export const NEWS_CATEGORY_METADATA: Record<
    NewsCategory,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PARENT_ADMISSION: { label: "입학·모집", tone: "warning" },
    PARENT_NOTICE: { label: "학부모 공지", tone: "success" },
    STUDENT_YOUTH: { label: "체험·진로", tone: "neutral" },
    GENERAL: { label: "일반", tone: "neutral" },
};

/** 학부모 피드 칩. 입학·학부모 공지를 포함한다. */
export const PARENT_NEWS_FILTERS: Array<{
    id: "ALL" | NewsCategory;
    label: string;
}> = [
    { id: "ALL", label: "전체" },
    ...Object.entries(NEWS_CATEGORY_METADATA).map(([id, metadata]) => ({
        id: id as NewsCategory,
        label: metadata.label,
    })),
];

/**
 * 학생 피드 칩. PARENT_ADMISSION / PARENT_NOTICE를 빼
 * 서버가 주지 않는 분류를 눌러도 빈 목록만 나오는 일을 막는다.
 */
export const STUDENT_NEWS_FILTERS: Array<{
    id: "ALL" | "STUDENT_YOUTH" | "GENERAL";
    label: string;
}> = [
    { id: "ALL", label: "전체" },
    {
        id: "STUDENT_YOUTH",
        label: NEWS_CATEGORY_METADATA.STUDENT_YOUTH.label,
    },
    { id: "GENERAL", label: NEWS_CATEGORY_METADATA.GENERAL.label },
];
