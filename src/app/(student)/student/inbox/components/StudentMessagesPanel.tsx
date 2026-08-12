"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { markMessageRead, type InboxActionState } from "@/features/messages/inbox-actions";
import { formatInboxDateTime, getMessageSenderRoleLabel } from "@/features/messages/inbox-presentation";
import type { InboxMessage } from "@/features/messages/inbox-types";
import styles from "../StudentInboxScreen.module.css";

const INITIAL_ACTION_STATE: InboxActionState = { status: "idle", message: "" };

export default function StudentMessagesPanel({ messages }: { messages: InboxMessage[] }) {
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [activeMessageId, setActiveMessageId] = useState(messages[0]?.recipientId ?? "");
    const [actionState, formAction, isPending] = useActionState(markMessageRead, INITIAL_ACTION_STATE);
    const filteredMessages = useMemo(() => filter === "unread" ? messages.filter((message) => !message.readAt) : messages, [filter, messages]);
    const activeMessage = filteredMessages.find((message) => message.recipientId === activeMessageId) ?? filteredMessages[0] ?? null;

    return (
        <>
            <div className={styles.filters}>
                <button type="button" className={filter === "all" ? styles.filterActive : styles.filterBtn} onClick={() => setFilter("all")}>전체</button>
                <button type="button" className={filter === "unread" ? styles.filterActive : styles.filterBtn} onClick={() => setFilter("unread")}>미읽음</button>
            </div>
            {messages.length === 0 ? <div className={styles.empty}><h2>받은 쪽지가 없습니다</h2><p>학원·선생님이 보낸 쪽지가 이곳에 표시됩니다.</p></div> : filteredMessages.length === 0 ? <div className={styles.empty}><h2>미읽음 쪽지가 없습니다</h2><p>모든 쪽지를 확인했습니다.</p></div> : (
                <div className={styles.layout}>
                    <aside className={styles.listPanel}><ul className={styles.messageList}>{filteredMessages.map((message) => <li key={message.recipientId}><button type="button" className={message.recipientId === activeMessage?.recipientId ? styles.itemActive : styles.item} onClick={() => setActiveMessageId(message.recipientId)}><div className={styles.itemTop}><strong>{message.title}</strong>{!message.readAt && <StatusChip tone="warning">새 쪽지</StatusChip>}</div><span>{message.senderName} · {formatInboxDateTime(message.createdAt)}</span></button></li>)}</ul></aside>
                    {activeMessage && <article className={styles.detail}>
                        <div className={styles.detailHead}><div><StatusChip>{getMessageSenderRoleLabel(activeMessage.senderRole)}</StatusChip><h2>{activeMessage.title}</h2><p>{activeMessage.senderName} · {formatInboxDateTime(activeMessage.createdAt)}</p></div><StatusChip tone={activeMessage.readAt ? "neutral" : "warning"}>{activeMessage.readAt ? "읽음" : "미읽음"}</StatusChip></div>
                        <div className={styles.content}>{activeMessage.content}</div>
                        <div className={styles.detailActions}>{!activeMessage.readAt && <form action={formAction}><input type="hidden" name="recipientId" value={activeMessage.recipientId} /><button type="submit" className={styles.primaryBtn} disabled={isPending}>{isPending ? "처리 중…" : "읽음 처리"}</button></form>}{activeMessage.deepLink && <Link href={activeMessage.deepLink} className={styles.secondaryBtn}>관련 화면 이동</Link>}</div>
                        {actionState.status === "error" && actionState.message && <p className={styles.error} role="alert">{actionState.message}</p>}
                    </article>}
                </div>
            )}
        </>
    );
}
