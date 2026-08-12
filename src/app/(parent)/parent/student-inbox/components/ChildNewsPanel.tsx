"use client";

import { useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { formatInboxDate } from "@/features/messages/inbox-presentation";
import type { StudentNewsItem } from "@/features/messages/inbox-types";
import styles from "../ParentStudentInboxScreen.module.css";

export default function ChildNewsPanel({ news }: { news: StudentNewsItem[] }) {
    const [activeNewsId, setActiveNewsId] = useState(news[0]?.id ?? "");
    const activeNews = news.find((item) => item.id === activeNewsId) ?? news[0] ?? null;
    if (news.length === 0) return <div className={styles.empty}><h2>학생 공지가 없습니다</h2><p>학생 대상 공지가 등록되면 이곳에 표시됩니다.</p></div>;
    return (
        <div className={styles.layout}>
            <aside className={styles.listPanel}><ul className={styles.list}>{news.map((item) => <li key={item.id}><button type="button" className={item.id === activeNews?.id ? styles.itemActive : styles.item} onClick={() => setActiveNewsId(item.id)}><strong>{item.title}</strong><span>{formatInboxDate(item.createdAt)}</span></button></li>)}</ul></aside>
            {activeNews && <article className={styles.detail}><div className={styles.detailHead}><StatusChip>학생 공지</StatusChip><h2>{activeNews.title}</h2><p>{formatInboxDate(activeNews.createdAt)}</p></div><div className={styles.content}>{activeNews.content?.trim() || "상세 내용이 없습니다."}</div></article>}
        </div>
    );
}
