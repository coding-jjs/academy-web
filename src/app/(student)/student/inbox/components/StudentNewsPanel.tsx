"use client";

import Link from "next/link";
import { useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { formatInboxDate } from "@/features/messages/inbox-presentation";
import type { StudentNewsItem } from "@/features/messages/inbox-types";
import styles from "../StudentInboxScreen.module.css";

export default function StudentNewsPanel({ news }: { news: StudentNewsItem[] }) {
    const [activeNewsId, setActiveNewsId] = useState(news[0]?.id ?? "");
    const activeNews = news.find((item) => item.id === activeNewsId) ?? news[0] ?? null;
    if (news.length === 0) return <div className={styles.empty}><h2>학생 공지가 없습니다</h2><p>등록된 학생 대상 공지가 없습니다.</p></div>;

    return (
        <div className={styles.layout}>
            <aside className={styles.listPanel}><ul className={styles.messageList}>{news.map((item) => <li key={item.id}><button type="button" className={item.id === activeNews?.id ? styles.itemActive : styles.item} onClick={() => setActiveNewsId(item.id)}><strong>{item.title}</strong><span>{formatInboxDate(item.createdAt)}</span></button></li>)}</ul></aside>
            {activeNews && <article className={styles.detail}><div className={styles.detailHead}><div><StatusChip>학생 공지</StatusChip><h2>{activeNews.title}</h2><p>{formatInboxDate(activeNews.createdAt)}</p></div></div><div className={styles.content}>{activeNews.content?.trim() || "상세 내용이 없습니다."}</div><Link href="/student/news" className={styles.secondaryBtn}>소식 더보기</Link></article>}
        </div>
    );
}
