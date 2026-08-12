"use client";

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import type {
    NewsCategory,
    NewsItem,
} from "@/features/news/types";
import {
    NEWS_CATEGORY_METADATA,
    PARENT_NEWS_FILTERS,
    STUDENT_NEWS_FILTERS,
} from "@/features/news/presentation";
import { formatKstYearMonthDay } from "@/lib/date-kst";
import styles from "./NewsScreen.module.css";

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
    const filters =
        audience === "student" ? STUDENT_NEWS_FILTERS : PARENT_NEWS_FILTERS;

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
                                                    NEWS_CATEGORY_METADATA[item.category]
                                                        .tone
                                                }
                                            >
                                                {
                                                    NEWS_CATEGORY_METADATA[item.category]
                                                        .label
                                                }
                                            </StatusChip>
                                            {item.kind === "BANNER" && (
                                                <StatusChip>배너</StatusChip>
                                            )}
                                        </div>
                                        <strong>{item.title}</strong>
                                        <span>
                                            {formatKstYearMonthDay(item.createdAt)}
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
                                    tone={NEWS_CATEGORY_METADATA[active.category].tone}
                                >
                                    {NEWS_CATEGORY_METADATA[active.category].label}
                                </StatusChip>
                                <h2>{active.title}</h2>
                                <p>{formatKstYearMonthDay(active.createdAt)}</p>
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
