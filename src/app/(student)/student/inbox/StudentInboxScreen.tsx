"use client";

/**
 * 학생 수신 쪽지 화면 (클라이언트).
 *
 * props: messages, unreadCount.
 * 전체 읽음은 `markAllMessagesRead`. 개별 읽음은 `StudentMessagesPanel` →
 * `markMessageRead`. 회신 폼은 없다.
 */

import { useTransition } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { markAllMessagesRead } from "@/features/messages/inbox-actions";
import type { InboxMessage } from "@/features/messages/inbox-types";
import StudentMessagesPanel from "./components/StudentMessagesPanel";
import styles from "./StudentInboxScreen.module.css";

/** 헤더의 모두 읽음과 메시지 패널을 묶는다. */
export default function StudentInboxScreen({
    messages,
    unreadCount,
}: {
    messages: InboxMessage[];
    unreadCount: number;
}) {
    const [isMarkingAll, startMarkingAll] = useTransition();

    function markAllAsRead() {
        startMarkingAll(async () => {
            await markAllMessagesRead();
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MESSAGES</span>
                    <h1>쪽지</h1>
                    <p>선생님이 보낸 메시지를 확인합니다.</p>
                </div>
                <div className={styles.headingActions}>
                    {unreadCount > 0 && (
                        <StatusChip tone="warning">미읽음 {unreadCount}</StatusChip>
                    )}
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={isMarkingAll || unreadCount === 0}
                        onClick={markAllAsRead}
                    >
                        {isMarkingAll ? "처리 중…" : "모두 읽음"}
                    </button>
                </div>
            </header>
            <StudentMessagesPanel messages={messages} />
        </section>
    );
}
