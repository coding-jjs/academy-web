"use client";

import { useState, useTransition } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { markAllMessagesRead } from "@/features/messages/inbox-actions";
import type { InboxMessage, StudentNewsItem } from "@/features/messages/inbox-types";
import StudentMessagesPanel from "./components/StudentMessagesPanel";
import StudentNewsPanel from "./components/StudentNewsPanel";
import styles from "./StudentInboxScreen.module.css";

export default function StudentInboxScreen({ messages, news, unreadCount }: { messages: InboxMessage[]; news: StudentNewsItem[]; unreadCount: number }) {
    const [activeTab, setActiveTab] = useState<"messages" | "news">("messages");
    const [isMarkingAll, startMarkingAll] = useTransition();

    function markAllAsRead() {
        startMarkingAll(async () => {
            await markAllMessagesRead();
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div><span>MESSAGES</span><h1>공지·쪽지</h1><p>학원 공지와 선생님이 보낸 메시지를 확인합니다.</p></div>
                <div className={styles.headingActions}>
                    {unreadCount > 0 && <StatusChip tone="warning">미읽음 {unreadCount}</StatusChip>}
                    {activeTab === "messages" && <button type="button" className={styles.secondaryBtn} disabled={isMarkingAll || unreadCount === 0} onClick={markAllAsRead}>{isMarkingAll ? "처리 중…" : "모두 읽음"}</button>}
                </div>
            </header>
            <div className={styles.filters}>
                <button type="button" className={activeTab === "messages" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("messages")}>쪽지</button>
                <button type="button" className={activeTab === "news" ? styles.filterActive : styles.filterBtn} onClick={() => setActiveTab("news")}>학생 공지</button>
            </div>
            {activeTab === "messages" ? <StudentMessagesPanel messages={messages} /> : <StudentNewsPanel news={news} />}
        </section>
    );
}
