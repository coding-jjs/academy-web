import type { NewsCategory } from "@/features/news/types";

export const NEWS_CATEGORY_METADATA: Record<
    NewsCategory,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PARENT_ADMISSION: { label: "입학·모집", tone: "warning" },
    PARENT_NOTICE: { label: "학부모 공지", tone: "success" },
    STUDENT_YOUTH: { label: "체험·진로", tone: "neutral" },
    GENERAL: { label: "일반", tone: "neutral" },
};

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
