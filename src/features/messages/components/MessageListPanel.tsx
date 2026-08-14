"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    approveMessage,
    approveMessages,
    rejectMessage,
} from "@/features/messages/actions";
import { MESSAGE_STATUS_METADATA } from "@/features/messages/presentation";
import type { MessageListItem } from "@/features/messages/types";
import {
    a11yStyles,
    buttonStyles,
    cx,
    fieldStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import styles from "../MessagesScreen.module.css";

type MessageListPanelProps = {
    mode: "director" | "staff";
    messages: MessageListItem[];
    onFeedback: (message: string) => void;
    enableBulkApprove?: boolean;
};

export default function MessageListPanel({
    mode,
    messages,
    onFeedback,
    enableBulkApprove = false,
}: MessageListPanelProps) {
    const router = useRouter();
    const [isProcessing, startProcessing] = useTransition();
    const [selectedMessageId, setSelectedMessageId] = useState(
        messages[0]?.id ?? null,
    );
    const [checkedIds, setCheckedIds] = useState<string[]>([]);
    const [rejectionReason, setRejectionReason] = useState("");

    const messageIds = useMemo(
        () => messages.map((message) => message.id),
        [messages],
    );
    const visibleCheckedIds = checkedIds.filter((id) => messageIds.includes(id));
    const allChecked =
        messageIds.length > 0 && visibleCheckedIds.length === messageIds.length;
    const canBulkApprove =
        enableBulkApprove &&
        mode === "director" &&
        messages.some((message) => message.status === "PENDING_APPROVAL");

    const selectedMessage =
        messages.find((message) => message.id === selectedMessageId) ??
        messages[0] ??
        null;

    function toggleChecked(messageId: string) {
        setCheckedIds((current) =>
            current.includes(messageId)
                ? current.filter((id) => id !== messageId)
                : [...current, messageId],
        );
    }

    function approveSelectedMessage(messageId: string) {
        startProcessing(async () => {
            const result = await approveMessage({ messageId });
            onFeedback(result.message ?? "");
            if (result.ok) {
                setCheckedIds((current) =>
                    current.filter((id) => id !== messageId),
                );
                router.refresh();
            }
        });
    }

    function approveCheckedMessages() {
        if (visibleCheckedIds.length === 0) return;
        const confirmed = window.confirm(
            `선택한 ${visibleCheckedIds.length}건을 승인·발송할까요?`,
        );
        if (!confirmed) return;

        startProcessing(async () => {
            const result = await approveMessages({
                messageIds: visibleCheckedIds,
            });
            onFeedback(result.message ?? "");
            if (result.ok) {
                setCheckedIds([]);
                router.refresh();
            }
        });
    }

    function rejectSelectedMessage(messageId: string) {
        startProcessing(async () => {
            const result = await rejectMessage({ messageId, rejectionReason });
            onFeedback(result.message ?? "");
            if (result.ok) {
                setRejectionReason("");
                setCheckedIds((current) =>
                    current.filter((id) => id !== messageId),
                );
                router.refresh();
            }
        });
    }

    return (
        <div className={styles.layout}>
            <aside className={cx(surfaceStyles.root, styles.listPanel)}>
                {canBulkApprove && messages.length > 0 && (
                    <div className={styles.bulkBar}>
                        <div className={styles.listActions}>
                            <button
                                type="button"
                                className={styles.ghostBtn}
                                disabled={isProcessing || allChecked}
                                onClick={() => setCheckedIds(messageIds)}
                            >
                                전체 선택
                            </button>
                            <button
                                type="button"
                                className={styles.ghostBtn}
                                disabled={
                                    isProcessing || visibleCheckedIds.length === 0
                                }
                                onClick={() => setCheckedIds([])}
                            >
                                선택 해제
                            </button>
                        </div>
                        <button
                            type="button"
                            className={cx(buttonStyles.primary, styles.fullWidthBtn)}
                            disabled={
                                isProcessing || visibleCheckedIds.length === 0
                            }
                            onClick={approveCheckedMessages}
                        >
                            {isProcessing
                                ? "처리 중…"
                                : `선택 승인·발송 (${visibleCheckedIds.length})`}
                        </button>
                    </div>
                )}

                {messages.length === 0 ? (
                    <p className={cx(typographyStyles.hint, styles.empty)}>목록이 비어 있습니다.</p>
                ) : (
                    <ul className={styles.messageList}>
                        {messages.map((message) => {
                            const statusMetadata =
                                MESSAGE_STATUS_METADATA[message.status];
                            const checked = visibleCheckedIds.includes(
                                message.id,
                            );

                            return (
                                <li key={message.id} className={styles.listRow}>
                                    {canBulkApprove && (
                                        <label className={styles.rowCheck}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                disabled={isProcessing}
                                                onChange={() =>
                                                    toggleChecked(message.id)
                                                }
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                            />
                                            <span className={a11yStyles.srOnly}>
                                                {message.title} 선택
                                            </span>
                                        </label>
                                    )}
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
                                            <StatusChip
                                                tone={statusMetadata.tone}
                                            >
                                                {statusMetadata.label}
                                            </StatusChip>
                                        </div>
                                        <span className={typographyStyles.hint}>
                                            {message.authorName} ·{" "}
                                            {message.targetSummary}
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
        <article className={cx(surfaceStyles.root, styles.detail)}>
            <div className={styles.detailHead}>
                <h2>{message.title}</h2>
                <StatusChip tone={statusMetadata.tone}>
                    {statusMetadata.label}
                </StatusChip>
            </div>
            <p className={cx(typographyStyles.hint, styles.meta)}>
                {message.authorName}
                {` · ${message.targetSummary}`}
                {message.recipientCount > 0
                    ? ` · 수신 ${message.recipientCount}명`
                    : ""}
            </p>
            <div className={styles.content}>{message.content}</div>

            {message.status === "REJECTED" && message.rejectionReason && (
                <p className={cx(typographyStyles.error, styles.rejectBox)}>
                    반려 사유: {message.rejectionReason}
                </p>
            )}

            {canReview && (
                <div className={styles.detailActions}>
                    <button
                        type="button"
                        className={buttonStyles.primary}
                        disabled={isProcessing}
                        onClick={() => onApprove(message.id)}
                    >
                        승인·발송
                    </button>
                    <label className={fieldStyles.root}>
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
                        className={buttonStyles.cancel}
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
