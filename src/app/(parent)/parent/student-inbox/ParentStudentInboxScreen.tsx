"use client";

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import styles from "./ParentStudentInboxScreen.module.css";

export type StudentInboxMessage = {
    recipientId: string;
    messageId: string;
    title: string;
    content: string;
    deepLink: string | null;
    createdAt: string;
    readAt: string | null;
    senderName: string;
    senderRole: string | null;
};

export type ParentStudentInboxChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    hasStudentAccount: boolean;
    messages: StudentInboxMessage[];
};

export type StudentNewsItem = {
    id: string;
    title: string;
    content: string | null;
    category: string;
    createdAt: string;
};

function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(iso));
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));
}

function roleLabel(role: string | null) {
    if (role === "DIRECTOR") return "원장";
    if (role === "TEACHER") return "선생님";
    if (role === "STAFF") return "사무";
    return "학원";
}

export default function ParentStudentInboxScreen({
    childList,
    news,
}: {
    childList: ParentStudentInboxChild[];
    news: StudentNewsItem[];
}) {
    const [activeChildId, setActiveChildId] = useState(childList[0]?.id ?? "");
    const [tab, setTab] = useState<"messages" | "news">("messages");
    const [activeMessageId, setActiveMessageId] = useState("");
    const [activeNewsId, setActiveNewsId] = useState(news[0]?.id ?? "");

    const child =
        childList.find((item) => item.id === activeChildId) ??
        childList[0] ??
        null;

    const messages = child?.messages ?? [];
    const activeMessage = useMemo(() => {
        return (
            messages.find((m) => m.recipientId === activeMessageId) ??
            messages[0] ??
            null
        );
    }, [activeMessageId, messages]);

    const activeNews =
        news.find((item) => item.id === activeNewsId) ?? news[0] ?? null;

    function selectChild(id: string) {
        setActiveChildId(id);
        setActiveMessageId("");
        setTab("messages");
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>STUDENT MESSAGES</span>
                    <h1>학생 공지·쪽지</h1>
                    <p>
                        자녀 계정으로 전달된 학원 공지와 쪽지를 확인합니다.
                    </p>
                </div>
                <StatusChip tone="neutral">읽기 전용</StatusChip>
            </header>

            {childList.length === 0 ? (
                <div className={styles.empty}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>학원에서 연결을 완료하면 이곳에 표시됩니다.</p>
                </div>
            ) : (
                <>
                    {childList.length > 1 && (
                        <div className={styles.childSwitch}>
                            {childList.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        item.id === child?.id
                                            ? styles.childActive
                                            : styles.childBtn
                                    }
                                    onClick={() => selectChild(item.id)}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={styles.filters}>
                        <button
                            type="button"
                            className={
                                tab === "messages"
                                    ? styles.filterActive
                                    : styles.filterBtn
                            }
                            onClick={() => setTab("messages")}
                        >
                            자녀 쪽지
                        </button>
                        <button
                            type="button"
                            className={
                                tab === "news"
                                    ? styles.filterActive
                                    : styles.filterBtn
                            }
                            onClick={() => setTab("news")}
                        >
                            학생 공지
                        </button>
                    </div>

                    {tab === "messages" && child && (
                        <>
                            {!child.hasStudentAccount ? (
                                <div className={styles.empty}>
                                    <h2>학생 계정이 없습니다</h2>
                                    <p>
                                        {child.name} 학생의 Google 계정이
                                        연결되면 쪽지를 확인할 수 있습니다.
                                    </p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className={styles.empty}>
                                    <h2>자녀에게 온 쪽지가 없습니다</h2>
                                    <p>
                                        학원·선생님이 학생에게 보낸 쪽지가 이곳에
                                        표시됩니다.
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.layout}>
                                    <aside className={styles.listPanel}>
                                        <ul className={styles.list}>
                                            {messages.map((item) => (
                                                <li key={item.recipientId}>
                                                    <button
                                                        type="button"
                                                        className={
                                                            item.recipientId ===
                                                            activeMessage?.recipientId
                                                                ? styles.itemActive
                                                                : styles.item
                                                        }
                                                        onClick={() =>
                                                            setActiveMessageId(
                                                                item.recipientId,
                                                            )
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.itemTop
                                                            }
                                                        >
                                                            <strong>
                                                                {item.title}
                                                            </strong>
                                                            {!item.readAt && (
                                                                <StatusChip tone="warning">
                                                                    미읽음
                                                                </StatusChip>
                                                            )}
                                                        </div>
                                                        <span>
                                                            {item.senderName} ·{" "}
                                                            {formatDateTime(
                                                                item.createdAt,
                                                            )}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>

                                    {activeMessage && (
                                        <article className={styles.detail}>
                                            <div className={styles.detailHead}>
                                                <div>
                                                    <StatusChip>
                                                        {roleLabel(
                                                            activeMessage.senderRole,
                                                        )}
                                                    </StatusChip>
                                                    <h2>
                                                        {activeMessage.title}
                                                    </h2>
                                                    <p>
                                                        {activeMessage.senderName}{" "}
                                                        ·{" "}
                                                        {formatDateTime(
                                                            activeMessage.createdAt,
                                                        )}
                                                    </p>
                                                </div>
                                                <StatusChip
                                                    tone={
                                                        activeMessage.readAt
                                                            ? "neutral"
                                                            : "warning"
                                                    }
                                                >
                                                    {activeMessage.readAt
                                                        ? "자녀 읽음"
                                                        : "자녀 미읽음"}
                                                </StatusChip>
                                            </div>
                                            <div className={styles.content}>
                                                {activeMessage.content}
                                            </div>
                                            <p className={styles.note}>
                                                학부모는 열람만 가능하며, 읽음
                                                상태는 변경되지 않습니다.
                                            </p>
                                        </article>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {tab === "news" && (
                        <>
                            {news.length === 0 ? (
                                <div className={styles.empty}>
                                    <h2>학생 공지가 없습니다</h2>
                                    <p>
                                        학생 대상 공지가 등록되면 이곳에
                                        표시됩니다.
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.layout}>
                                    <aside className={styles.listPanel}>
                                        <ul className={styles.list}>
                                            {news.map((item) => (
                                                <li key={item.id}>
                                                    <button
                                                        type="button"
                                                        className={
                                                            item.id ===
                                                            activeNews?.id
                                                                ? styles.itemActive
                                                                : styles.item
                                                        }
                                                        onClick={() =>
                                                            setActiveNewsId(
                                                                item.id,
                                                            )
                                                        }
                                                    >
                                                        <strong>
                                                            {item.title}
                                                        </strong>
                                                        <span>
                                                            {formatDate(
                                                                item.createdAt,
                                                            )}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>

                                    {activeNews && (
                                        <article className={styles.detail}>
                                            <div className={styles.detailHead}>
                                                <StatusChip>학생 공지</StatusChip>
                                                <h2>{activeNews.title}</h2>
                                                <p>
                                                    {formatDate(
                                                        activeNews.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div className={styles.content}>
                                                {activeNews.content?.trim() ||
                                                    "상세 내용이 없습니다."}
                                            </div>
                                        </article>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </section>
    );
}