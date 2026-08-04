"use client";

import Link from "next/link";
import {
    useActionState,
    useEffect,
    useMemo,
    useState,
    useTransition,
} from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    markAllMessagesRead,
    markMessageRead,
    type InboxActionState,
} from "./actions";
import styles from "./StudentInboxScreen.module.css";

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

export type StudentNewsItem = {
    id: string;
    title: string;
    content: string | null;
    category: string;
    createdAt: string;
};

const initialState: InboxActionState = {
    status: "idle",
    message: "",
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

export default function StudentInboxScreen({
    messages,
    news,
    unreadCount,
}: {
    messages: StudentInboxMessage[];
    news: StudentNewsItem[];
    unreadCount: number;
}) {
    const [tab, setTab] = useState<"messages" | "news">("messages");
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [activeId, setActiveId] = useState(messages[0]?.recipientId ?? "");
    const [activeNewsId, setActiveNewsId] = useState(news[0]?.id ?? "");
    const [state, formAction, pending] = useActionState(
        markMessageRead,
        initialState,
    );
    const [allPending, startAllTransition] = useTransition();

    const filtered = useMemo(() => {
        if (filter === "unread") return messages.filter((m) => !m.readAt);
        return messages;
    }, [filter, messages]);

    const active =
        filtered.find((m) => m.recipientId === activeId) ??
        filtered[0] ??
        null;

    const activeNews =
        news.find((n) => n.id === activeNewsId) ?? news[0] ?? null;

    useEffect(() => {
        if (!active && filtered[0]) setActiveId(filtered[0].recipientId);
    }, [active, filtered]);

    function handleMarkAll() {
        startAllTransition(async () => {
            await markAllMessagesRead();
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MESSAGES</span>
                    <h1>공지·쪽지</h1>
                    <p>학원 공지와 선생님이 보낸 메시지를 확인합니다.</p>
                </div>
                <div className={styles.headingActions}>
                    {unreadCount > 0 && (
                        <StatusChip tone="warning">
                            미읽음 {unreadCount}
                        </StatusChip>
                    )}
                    {tab === "messages" && (
                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            disabled={allPending || unreadCount === 0}
                            onClick={handleMarkAll}
                        >
                            {allPending ? "처리 중…" : "모두 읽음"}
                        </button>
                    )}
                </div>
            </header>

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
                    쪽지
                </button>
                <button
                    type="button"
                    className={
                        tab === "news" ? styles.filterActive : styles.filterBtn
                    }
                    onClick={() => setTab("news")}
                >
                    학생 공지
                </button>
            </div>

            {tab === "messages" && (
                <>
                    <div className={styles.filters}>
                        <button
                            type="button"
                            className={
                                filter === "all"
                                    ? styles.filterActive
                                    : styles.filterBtn
                            }
                            onClick={() => setFilter("all")}
                        >
                            전체
                        </button>
                        <button
                            type="button"
                            className={
                                filter === "unread"
                                    ? styles.filterActive
                                    : styles.filterBtn
                            }
                            onClick={() => setFilter("unread")}
                        >
                            미읽음
                        </button>
                    </div>

                    {messages.length === 0 ? (
                        <div className={styles.empty}>
                            <h2>받은 쪽지가 없습니다</h2>
                            <p>학원·선생님이 보낸 쪽지가 이곳에 표시됩니다.</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.empty}>
                            <h2>미읽음 쪽지가 없습니다</h2>
                            <p>모든 쪽지를 확인했습니다.</p>
                        </div>
                    ) : (
                        <div className={styles.layout}>
                            <aside className={styles.listPanel}>
                                <ul className={styles.messageList}>
                                    {filtered.map((item) => (
                                        <li key={item.recipientId}>
                                            <button
                                                type="button"
                                                className={
                                                    item.recipientId ===
                                                    active?.recipientId
                                                        ? styles.itemActive
                                                        : styles.item
                                                }
                                                onClick={() =>
                                                    setActiveId(item.recipientId)
                                                }
                                            >
                                                <div className={styles.itemTop}>
                                                    <strong>{item.title}</strong>
                                                    {!item.readAt && (
                                                        <StatusChip tone="warning">
                                                            새 쪽지
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

                            {active && (
                                <article className={styles.detail}>
                                    <div className={styles.detailHead}>
                                        <div>
                                            <StatusChip>
                                                {roleLabel(active.senderRole)}
                                            </StatusChip>
                                            <h2>{active.title}</h2>
                                            <p>
                                                {active.senderName} ·{" "}
                                                {formatDateTime(
                                                    active.createdAt,
                                                )}
                                            </p>
                                        </div>
                                        <StatusChip
                                            tone={
                                                active.readAt
                                                    ? "neutral"
                                                    : "warning"
                                            }
                                        >
                                            {active.readAt ? "읽음" : "미읽음"}
                                        </StatusChip>
                                    </div>

                                    <div className={styles.content}>
                                        {active.content}
                                    </div>

                                    <div className={styles.detailActions}>
                                        {!active.readAt && (
                                            <form action={formAction}>
                                                <input
                                                    type="hidden"
                                                    name="recipientId"
                                                    value={active.recipientId}
                                                />
                                                <button
                                                    type="submit"
                                                    className={styles.primaryBtn}
                                                    disabled={pending}
                                                >
                                                    {pending
                                                        ? "처리 중…"
                                                        : "읽음 처리"}
                                                </button>
                                            </form>
                                        )}
                                        {active.deepLink && (
                                            <Link
                                                href={active.deepLink}
                                                className={styles.secondaryBtn}
                                            >
                                                관련 화면 이동
                                            </Link>
                                        )}
                                    </div>

                                    {state.status === "error" &&
                                        state.message && (
                                            <p
                                                className={styles.error}
                                                role="alert"
                                            >
                                                {state.message}
                                            </p>
                                        )}
                                </article>
                            )}
                        </div>
                    )}
                </>
            )}

            {tab === "news" &&
                (news.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>학생 공지가 없습니다</h2>
                        <p>등록된 학생 대상 공지가 없습니다.</p>
                    </div>
                ) : (
                    <div className={styles.layout}>
                        <aside className={styles.listPanel}>
                            <ul className={styles.messageList}>
                                {news.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className={
                                                item.id === activeNews?.id
                                                    ? styles.itemActive
                                                    : styles.item
                                            }
                                            onClick={() =>
                                                setActiveNewsId(item.id)
                                            }
                                        >
                                            <strong>{item.title}</strong>
                                            <span>
                                                {formatDate(item.createdAt)}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        {activeNews && (
                            <article className={styles.detail}>
                                <div className={styles.detailHead}>
                                    <div>
                                        <StatusChip>학생 공지</StatusChip>
                                        <h2>{activeNews.title}</h2>
                                        <p>
                                            {formatDate(activeNews.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.content}>
                                    {activeNews.content?.trim() ||
                                        "상세 내용이 없습니다."}
                                </div>
                                <Link
                                    href="/student/news"
                                    className={styles.secondaryBtn}
                                >
                                    소식 더보기
                                </Link>
                            </article>
                        )}
                    </div>
                ))}
        </section>
    );
}