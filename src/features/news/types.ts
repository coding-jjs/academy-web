export type NewsKind = "NOTICE" | "BANNER";

export type NewsCategory =
    | "PARENT_ADMISSION"
    | "PARENT_NOTICE"
    | "STUDENT_YOUTH"
    | "GENERAL";

export type NewsAudience = "PARENT" | "STUDENT" | "ALL";

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
