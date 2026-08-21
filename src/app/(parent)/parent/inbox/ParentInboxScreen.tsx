"use client";

/**
 * 학부모 수신 쪽지 목록·본문 UI (클라이언트).
 *
 * props: messages, unreadCount — inbox-data.
 * 제출: `markMessageRead`(useActionState), `markAllMessagesRead`(transition).
 * 발송 폼은 없다. 학원 안내가 홈 미읽음 배지와 맞게 떨어지게 읽음만 처리한다.
 */

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    markAllMessagesRead,
    markMessageRead,
    type InboxActionState,
} from "@/features/messages/inbox-actions";
import type { ParentInboxMessage } from "@/features/messages/inbox-types";
import {
    formatInboxDateTime,
    getMessageSenderRoleLabel,
} from "@/features/messages/inbox-presentation";
import styles from "./ParentInboxScreen.module.css";

const initialState: InboxActionState = {
    status: "idle",
    message: "",
};

const formatDateTime = formatInboxDateTime;
const roleLabel = getMessageSenderRoleLabel;

/** 필터·본문·개별/전체 읽음을 그린다. */
export default function ParentInboxScreen({
    messages,
    unreadCount,
}: {
    messages: ParentInboxMessage[];
    unreadCount: number;
}) {
    const [activeId, setActiveId] = useState(messages[0]?.recipientId ?? "");
    const [filter, setFilter] = useState<"all" | "unread">("all");
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

    function handleSelect(recipientId: string) {
        setActiveId(recipientId);
    }

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
                    <h1>쪽지함</h1>
                    <p>학원과 선생님이 보낸 안내를 확인합니다.</p>
                </div>
                <div className={styles.headingActions}>
                    {unreadCount > 0 && (
                        <StatusChip tone="warning">
                            미읽음 {unreadCount}
                        </StatusChip>
                    )}
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={allPending || unreadCount === 0}
                        onClick={handleMarkAll}
                    >
                        {allPending ? "처리 중…" : "모두 읽음"}
                    </button>
                </div>
            </header>
            <div className={styles.filters}>
                <button
                    type="button"
                    className={
                        filter === "all" ? styles.filterActive : styles.filterBtn
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
                    <p>학원에서 쪽지를 보내면 이곳에 표시됩니다.</p>
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
                                            item.recipientId === active?.recipientId
                                                ? styles.itemActive
                                                : styles.item
                                        }
                                        onClick={() =>
                                            handleSelect(item.recipientId)
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
                                            {item.senderName} ·
                                            {formatDateTime(item.createdAt)}
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
                                        {active.senderName} ·
                                        {formatDateTime(active.createdAt)}
                                    </p>
                                </div>
                                <StatusChip
                                    tone={active.readAt ? "neutral" : "warning"}
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

                                {active.hasReport && (
                                    <Link
                                        href="/parent/reports"
                                        className={styles.secondaryBtn}
                                    >
                                        학습 리포트 보기
                                    </Link>
                                )}

                                {active.deepLink &&
                                    active.deepLink.startsWith("/parent/") && (
                                        <Link
                                            href={active.deepLink}
                                            className={styles.secondaryBtn}
                                        >
                                            관련 화면 이동
                                        </Link>
                                    )}
                            </div>
                            {state.message && state.status === "error" && (
                                <p className={styles.error} role="alert">
                                    {state.message}
                                </p>
                            )}
                        </article>
                    )}
                </div>
            )}
        </section>
    );
}
