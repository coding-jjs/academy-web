"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

/**
 * 학부모·학생 체험 소식 피드 UI. audience에 따라 필터 칩이 달라진다.
 *
 * 호출: `/parent/news`, `/student/news`가 `getPublishedNews` 결과를 넘긴다.
 * 외부 링크·이미지는 http(s)만 열어 javascript: 등 잘못된 URL을 막는다.
 * 학생 칩은 입학 카테고리가 없다 — 서버 where와 같은 집합이다.
 *
 * 의도적으로 하지 않는 일:
 * - 공개 /notices UI → `NoticesScreen.tsx`.
 * - 소식 작성. 이 화면은 읽기만.
 *
 * 관련: `data.ts`, `presentation.ts`.
 */

import { useMemo, useState } from "react"; // 파생 목록. 서버 where를 바꾸지 않는다.
import StatusChip from "@/components/ui/StatusChip"; // 화면 칩. 서버 enum이 아니다.
import type { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    NewsCategory, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    NewsItem, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
} from "@/features/news/types"; // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
import { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    NEWS_CATEGORY_METADATA, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    PARENT_NEWS_FILTERS, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    STUDENT_NEWS_FILTERS, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
} from "@/features/news/presentation"; // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
import { formatKstYearMonthDay } from "@/lib/date-kst"; // KST 연·월·일.
import styles from "./NewsScreen.module.css"; // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

function isSafeExternalUrl(url: string) { // isSafeExternalUrl. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    try { // 실패 시 범용 메시지. 스키마를 노출하지 않는다.
        const parsed = new URL(url); // parsed. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
        return parsed.protocol === "https:" || parsed.protocol === "http:"; // javascript: 등 잘못된 URL을 막는다.
    } catch { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
        return false; // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    }
}

/**
 * 체험 소식 피드. audience=student면 입학 카테고리 칩을 그리지 않는다.
 */
export default function NewsScreen({ // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    items, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    audience, // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
}: { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    items: NewsItem[]; // 피드 카드. 공개 /notices와 DTO가 다르다.
    audience: "parent" | "student"; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
}) { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    const [filter, setFilter] = useState<"ALL" | NewsCategory>("ALL"); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    const [activeId, setActiveId] = useState(items[0]?.id ?? ""); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    const filters = // filters. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
        audience === "student" ? STUDENT_NEWS_FILTERS : PARENT_NEWS_FILTERS; // 학생은 입학 칩 없음. 서버가 PARENT_*를 안 주므로 칩만 숨기는 것으로 끝내지 않는다.

    const filtered = useMemo(() => { // filtered. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
        if (filter === "ALL") return items; // 칩은 UI. 학생 입학 카테고리는 서버 where에서 이미 빠져 있다.
        return items.filter((item) => item.category === filter); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    }, [filter, items]); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

    const active = // active. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
        filtered.find((item) => item.id === activeId) ?? filtered[0] ?? null; // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

    return ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
        <section className={styles.page}> // section. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            <header // 학부모/학생 안내 문구만 갈린다.
                className={styles.heading} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                <div> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <span>ACADEMY NEWS</span> // span. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <h1>체험 소식</h1> // h1. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <p> // p. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        {audience === "student" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            ? "새로운 프로그램과 학원 행사 소식을 확인합니다." // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            : "학원의 행사와 프로그램 소식을 확인합니다."} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    </p> // p 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            </header> // header 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

            <div // 학생은 STUDENT_YOUTH·GENERAL만. PARENT_ADMISSION 칩 없음.
                className={styles.filters} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                {filters.map((item) => ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <button // button. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        key={item.id} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        type="button" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        className={ // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            filter === item.id // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                ? styles.filterActive // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                : styles.filterBtn // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        }
                        onClick={() => { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            setFilter(item.id); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            const next = // next. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                item.id === "ALL" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    ? items[0] // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    : items.find((n) => n.category === item.id); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            setActiveId(next?.id ?? ""); // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        }}
                    > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        {item.label} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    </button> // button 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                ))}
            </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

            {items.length === 0 ? ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                <div className={styles.empty}> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <h2>등록된 소식이 없습니다</h2> // h2. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <p>학원에서 소식을 등록하면 이곳에 표시됩니다.</p> // p. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            ) : filtered.length === 0 ? ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                <div className={styles.empty}> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <h2>해당 분류 소식이 없습니다</h2> // h2. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <p>다른 분류를 선택해 보세요.</p> // p. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            ) : ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                <div className={styles.layout}> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    <aside className={styles.listPanel}> // aside. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        <ul className={styles.list}> // ul. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            {filtered.map((item) => ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                <li key={item.id}> // li. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    <button // button. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        type="button" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        className={ // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                            item.id === active?.id // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                ? styles.itemActive // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                : styles.item // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        }
                                        onClick={() => setActiveId(item.id)} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        <div className={styles.itemTop}> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                            <StatusChip // StatusChip. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                tone={ // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                    NEWS_CATEGORY_METADATA[item.category] // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                        .tone // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                }
                                            > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                { // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                    NEWS_CATEGORY_METADATA[item.category] // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                        .label // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                }
                                            </StatusChip> // StatusChip 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                            {item.kind === "BANNER" && ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                                <StatusChip>배너</StatusChip> // StatusChip. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                            )}
                                        </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        <strong>{item.title}</strong> // strong. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        <span> // span. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                            {formatKstYearMonthDay(item.createdAt)} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        </span> // span 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    </button> // button 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                </li> // li 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            ))}
                        </ul> // ul 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    </aside> // aside 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

                    {active && ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        <article // http(s) 이미지·링크만. 학생 피드에는 입학 카테고리가 없다.
                            className={styles.detail} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                        > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            <div className={styles.detailHead}> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                <StatusChip // StatusChip. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    tone={NEWS_CATEGORY_METADATA[active.category].tone} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    {NEWS_CATEGORY_METADATA[active.category].label} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                </StatusChip> // StatusChip 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                <h2>{active.title}</h2> // h2. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                <p>{formatKstYearMonthDay(active.createdAt)}</p> // p. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

                            {active.imageUrl && // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                isSafeExternalUrl(active.imageUrl) && ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img // img. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        src={active.imageUrl} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        alt="" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        className={styles.cover} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    /> // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                )}

                            <div className={styles.content}> // div. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                {active.content?.trim() // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    ? active.content // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    : "상세 내용이 없습니다."} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                            </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.

                            {active.linkUrl && // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                isSafeExternalUrl(active.linkUrl) && ( // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    <a // a. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        href={active.linkUrl} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        target="_blank" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        rel="noopener noreferrer" // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        className={styles.primaryBtn} // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    > // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                        자세히 보기 // 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                    </a> // a 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                                )}
                        </article> // article 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
                    )}
                </div> // div 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
            )}
        </section> // section 닫기. 역할 피드 UI. 학생 칩은 PARENT_ADMISSION 없음.
    );
}
