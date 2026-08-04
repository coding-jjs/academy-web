"use client";

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import styles from "./NewsScreen.module.css";

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

const categoryMeta: Record<
    NewsCategory,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PARENT_ADMISSION: { label: "입학·모집", tone: "warning" },
    PARENT_NOTICE: { label: "학부모 공지", tone: "success" },
    STUDENT_YOUTH: { label: "체험·진로", tone: "neutral" },
    GENERAL: { label: "일반", tone: "neutral" },
};

const parentFilters: Array<{ id: "ALL" | NewsCategory; label: string }> = [
    { id: "ALL", label: "전체" },
    { id: "PARENT_NOTICE", label: "학부모 공지" },
    { id: "PARENT_ADMISSION", label: "입학·모집" },
    { id: "STUDENT_YOUTH", label: "체험·진로" },
    { id: "GENERAL", label: "일반" },
];

const studentFilters: Array<{
    id: "ALL" | "STUDENT_YOUTH" | "GENERAL";
    label: string;
}> = [
    { id: "ALL", label: "전체" },
    { id: "STUDENT_YOUTH", label: "체험·진로" },
    { id: "GENERAL", label: "일반" },
];

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));
}

function isSafeExternalUrl(url: string) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}

export default function NewsScreen({
    items,
    audience,
}: {
    items: NewsItem[];
    audience: "parent" | "student";
}) {
    const [filter, setFilter] = useState<"ALL" | NewsCategory>("ALL");
    const [activeId, setActiveId] = useState(items[0]?.id ?? "");
    const filters = audience === "student" ? studentFilters : parentFilters;

    const filtered = useMemo(() => {
        if (filter === "ALL") return items;
        return items.filter((item) => item.category === filter);
    }, [filter, items]);

    const active =
        filtered.find((item) => item.id === activeId) ?? filtered[0] ?? null;

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>ACADEMY NEWS</span>
                    <h1>체험 소식</h1>
                    <p>
                        {audience === "student"
                            ? "새로운 프로그램과 학원 행사 소식을 확인합니다."
                            : "학원의 행사와 프로그램 소식을 확인합니다."}
                    </p>
                </div>
            </header>

            <div className={styles.filters}>
                {filters.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={
                            filter === item.id
                                ? styles.filterActive
                                : styles.filterBtn
                        }
                        onClick={() => {
                            setFilter(item.id);
                            const next =
                                item.id === "ALL"
                                    ? items[0]
                                    : items.find((n) => n.category === item.id);
                            setActiveId(next?.id ?? "");
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <div className={styles.empty}>
                    <h2>등록된 소식이 없습니다</h2>
                    <p>학원에서 소식을 등록하면 이곳에 표시됩니다.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <h2>해당 분류 소식이 없습니다</h2>
                    <p>다른 분류를 선택해 보세요.</p>
                </div>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.listPanel}>
                        <ul className={styles.list}>
                            {filtered.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={
                                            item.id === active?.id
                                                ? styles.itemActive
                                                : styles.item
                                        }
                                        onClick={() => setActiveId(item.id)}
                                    >
                                        <div className={styles.itemTop}>
                                            <StatusChip
                                                tone={
                                                    categoryMeta[item.category]
                                                        .tone
                                                }
                                            >
                                                {
                                                    categoryMeta[item.category]
                                                        .label
                                                }
                                            </StatusChip>
                                            {item.kind === "BANNER" && (
                                                <StatusChip>배너</StatusChip>
                                            )}
                                        </div>
                                        <strong>{item.title}</strong>
                                        <span>
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {active && (
                        <article className={styles.detail}>
                            <div className={styles.detailHead}>
                                <StatusChip
                                    tone={categoryMeta[active.category].tone}
                                >
                                    {categoryMeta[active.category].label}
                                </StatusChip>
                                <h2>{active.title}</h2>
                                <p>{formatDate(active.createdAt)}</p>
                            </div>

                            {active.imageUrl &&
                                isSafeExternalUrl(active.imageUrl) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={active.imageUrl}
                                        alt=""
                                        className={styles.cover}
                                    />
                                )}

                            <div className={styles.content}>
                                {active.content?.trim()
                                    ? active.content
                                    : "상세 내용이 없습니다."}
                            </div>

                            {active.linkUrl &&
                                isSafeExternalUrl(active.linkUrl) && (
                                    <a
                                        href={active.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.primaryBtn}
                                    >
                                        자세히 보기
                                    </a>
                                )}
                        </article>
                    )}
                </div>
            )}
        </section>
    );
}
