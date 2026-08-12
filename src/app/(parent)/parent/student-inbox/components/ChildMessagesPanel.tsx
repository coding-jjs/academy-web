"use client";

import { useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { formatInboxDateTime, getMessageSenderRoleLabel } from "@/features/messages/inbox-presentation";
import type { ParentStudentInboxChild } from "@/features/messages/inbox-types";
import styles from "../ParentStudentInboxScreen.module.css";

export default function ChildMessagesPanel({ child }: { child: ParentStudentInboxChild }) {
    const [activeMessageId, setActiveMessageId] = useState("");
    const activeMessage = child.messages.find((message) => message.recipientId === activeMessageId) ?? child.messages[0] ?? null;
    if (!child.hasStudentAccount) return <div className={styles.empty}><h2>학생 계정이 없습니다</h2><p>{child.name} 학생의 Google 계정이 연결되면 쪽지를 확인할 수 있습니다.</p></div>;
    if (child.messages.length === 0) return <div className={styles.empty}><h2>자녀에게 온 쪽지가 없습니다</h2><p>학원·선생님이 학생에게 보낸 쪽지가 이곳에 표시됩니다.</p></div>;

    return (
        <div className={styles.layout}>
            <aside className={styles.listPanel}><ul className={styles.list}>{child.messages.map((message) => <li key={message.recipientId}><button type="button" className={message.recipientId === activeMessage?.recipientId ? styles.itemActive : styles.item} onClick={() => setActiveMessageId(message.recipientId)}><div className={styles.itemTop}><strong>{message.title}</strong>{!message.readAt && <StatusChip tone="warning">미읽음</StatusChip>}</div><span>{message.senderName} · {formatInboxDateTime(message.createdAt)}</span></button></li>)}</ul></aside>
            {activeMessage && <article className={styles.detail}><div className={styles.detailHead}><div><StatusChip>{getMessageSenderRoleLabel(activeMessage.senderRole)}</StatusChip><h2>{activeMessage.title}</h2><p>{activeMessage.senderName} · {formatInboxDateTime(activeMessage.createdAt)}</p></div><StatusChip tone={activeMessage.readAt ? "neutral" : "warning"}>{activeMessage.readAt ? "자녀 읽음" : "자녀 미읽음"}</StatusChip></div><div className={styles.content}>{activeMessage.content}</div><p className={styles.note}>학부모는 열람만 가능하며, 읽음 상태는 변경되지 않습니다.</p></article>}
        </div>
    );
}
