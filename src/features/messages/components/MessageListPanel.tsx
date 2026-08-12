"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import { approveMessage, rejectMessage } from "@/features/messages/actions";
import {
    MESSAGE_AUDIENCE_LABELS,
    MESSAGE_STATUS_METADATA,
} from "@/features/messages/presentation";
import type { MessageListItem } from "@/features/messages/types";
import styles from "../MessagesScreen.module.css";

type MessageListPanelProps = {
    mode: "director" | "staff";
    messages: MessageListItem[];
    onFeedback: (message: string) => void;
};

export default function MessageListPanel({
    mode,
    messages,
    onFeedback,
}: MessageListPanelProps) {
    const router = useRouter();
    const [isProcessing, startProcessing] = useTransition();
    const [selectedMessageId, setSelectedMessageId] = useState(
        messages[0]?.id ?? null,
    );
    const [rejectionReason, setRejectionReason] = useState("");
    const selectedMessage =
        messages.find((message) => message.id === selectedMessageId) ??
        messages[0] ??
        null;

    function approveSelectedMessage(messageId: string) {
        startProcessing(async () => {
            const result = await approveMessage({ messageId });
            onFeedback(result.message ?? "");
            if (result.ok) router.refresh();
        });
    }

    function rejectSelectedMessage(messageId: string) {
        startProcessing(async () => {
            const result = await rejectMessage({ messageId, rejectionReason });
            onFeedback(result.message ?? "");
            if (result.ok) {
                setRejectionReason("");
                router.refresh();
            }
        });
    }

    return (
        <div className={styles.layout}>
            <aside className={styles.listPanel}>
                {messages.length === 0 ? (
                    <p className={styles.empty}>목록이 비어 있습니다.</p>
                ) : (
                    <ul className={styles.messageList}>
                        {messages.map((message) => {
                            const statusMetadata =
                                MESSAGE_STATUS_METADATA[message.status];

                            return (
                                <li key={message.id}>
                                    <button
                                        type="button"
                                        className={
                                            message.id === selectedMessage?.id
                                                ? styles.itemActive
                                                : styles.item
                                        }
                                        onClick={() =>
                                            setSelectedMessageId(message.id)
                                        }
                                    >
                                        <div className={styles.itemTop}>
                                            <strong>{message.title}</strong>
                                            <StatusChip tone={statusMetadata.tone}>
                                                {statusMetadata.label}
                                            </StatusChip>
                                        </div>
                                        <span>
                                            {message.authorName} ·{" "}
                                            {message.audience
                                                ? MESSAGE_AUDIENCE_LABELS[
                                                      message.audience
                                                  ]
                                                : "-"}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            {selectedMessage && (
                <MessageDetail
                    message={selectedMessage}
                    mode={mode}
                    isProcessing={isProcessing}
                    rejectionReason={rejectionReason}
                    onRejectionReasonChange={setRejectionReason}
                    onApprove={approveSelectedMessage}
                    onReject={rejectSelectedMessage}
                />
            )}
        </div>
    );
}

function MessageDetail({
    message,
    mode,
    isProcessing,
    rejectionReason,
    onRejectionReasonChange,
    onApprove,
    onReject,
}: {
    message: MessageListItem;
    mode: "director" | "staff";
    isProcessing: boolean;
    rejectionReason: string;
    onRejectionReasonChange: (reason: string) => void;
    onApprove: (messageId: string) => void;
    onReject: (messageId: string) => void;
}) {
    const statusMetadata = MESSAGE_STATUS_METADATA[message.status];
    const canReview =
        mode === "director" && message.status === "PENDING_APPROVAL";

    return (
        <article className={styles.detail}>
            <div className={styles.detailHead}>
                <h2>{message.title}</h2>
                <StatusChip tone={statusMetadata.tone}>
                    {statusMetadata.label}
                </StatusChip>
            </div>
            <p className={styles.meta}>
                {message.authorName}
                {message.recipientCount > 0
                    ? ` · 수신 ${message.recipientCount}명`
                    : ""}
            </p>
            <div className={styles.content}>{message.content}</div>

            {message.status === "REJECTED" && message.rejectionReason && (
                <p className={styles.rejectBox}>
                    반려 사유: {message.rejectionReason}
                </p>
            )}

            {canReview && (
                <div className={styles.detailActions}>
                    <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={isProcessing}
                        onClick={() => onApprove(message.id)}
                    >
                        승인·발송
                    </button>
                    <label className={styles.field}>
                        <span>반려 사유</span>
                        <input
                            value={rejectionReason}
                            onChange={(event) =>
                                onRejectionReasonChange(event.target.value)
                            }
                            placeholder="반려 시 필수"
                        />
                    </label>
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={isProcessing || !rejectionReason.trim()}
                        onClick={() => onReject(message.id)}
                    >
                        반려
                    </button>
                </div>
            )}
        </article>
    );
}
