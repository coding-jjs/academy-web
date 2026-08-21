"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

/**
 * 쪽지 목록·상세와 원장 승인·반려 UI.
 *
 * 호출: MessagesScreen의 승인 대기·내 요청/최근 발송 탭.
 * 일괄 승인은 원장 대기 탭에서만 켜 직원이 타 작성 쪽지를 처리하지 못하게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 작곡기 → `MessageComposer.tsx`.
 * - 직원 모드에서 승인 버튼을 보여 주지 않음(canReview).
 *
 * 관련: `messages/actions.ts`, `presentation.ts`.
 */

import { useMemo, useState, useTransition } from "react"; // 파생 목록. 서버 where를 바꾸지 않는다.
import { useRouter } from "next/navigation"; // refresh. redirect 페이로드가 아니다.
import StatusChip from "@/components/ui/StatusChip"; // 화면 칩. 서버 enum이 아니다.
import { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    approveMessage, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    approveMessages, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    rejectMessage, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
} from "@/features/messages/actions"; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
import { MESSAGE_STATUS_METADATA } from "@/features/messages/presentation"; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
import type { MessageListItem } from "@/features/messages/types"; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
import { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    a11yStyles, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    buttonStyles, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    cx, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    fieldStyles, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    surfaceStyles, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    typographyStyles, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
} from "@/components/ui/shared-styles"; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
import styles from "../MessagesScreen.module.css"; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.

type MessageListPanelProps = { // MessageListPanelProps 타입. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    mode: "director" | "staff"; // director vs staff. 직원은 승인 버튼을 안 그린다.
    messages: MessageListItem[]; // messages. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onFeedback: (message: string) => void; // 부모 한 줄. 탭 전환 시 지운다.
    enableBulkApprove?: boolean; // enableBulkApprove. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
};

/**
 * 쪽지 목록과 상세. enableBulkApprove는 원장 대기 탭에서만 true.
 */
export default function MessageListPanel({ // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    mode, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    messages, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onFeedback, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    enableBulkApprove = false, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
}: MessageListPanelProps) { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const router = useRouter(); // router. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const [isProcessing, startProcessing] = useTransition(); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const [selectedMessageId, setSelectedMessageId] = useState( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        messages[0]?.id ?? null, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    );
    const [checkedIds, setCheckedIds] = useState<string[]>([]); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const [rejectionReason, setRejectionReason] = useState(""); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.

    const messageIds = useMemo( // messageIds. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        () => messages.map((message) => message.id), // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        [messages], // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    );
    const visibleCheckedIds = checkedIds.filter((id) => messageIds.includes(id)); // visibleCheckedIds. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const allChecked = // allChecked. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        messageIds.length > 0 && visibleCheckedIds.length === messageIds.length; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const canBulkApprove = // canBulkApprove. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        enableBulkApprove && // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        mode === "director" && // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        messages.some((message) => message.status === "PENDING_APPROVAL"); // 원장 + 대기 탭 + PENDING이 있을 때만.

    const selectedMessage = // selectedMessage. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        messages.find((message) => message.id === selectedMessageId) ?? // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        messages[0] ?? // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        null; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.

    function toggleChecked(messageId: string) { // toggleChecked. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        setCheckedIds((current) => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            current.includes(messageId) // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                ? current.filter((id) => id !== messageId) // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                : [...current, messageId], // 목록에 없는 id는 visibleCheckedIds에서 걸러진다.
        );
    }

    function approveSelectedMessage(messageId: string) { // approveSelectedMessage. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        startProcessing(async () => { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            const result = await approveMessage({ messageId }); // 한 건 SENT + 수신 행 생성. 직원이 호출하는 UI는 없다.
            onFeedback(result.message ?? ""); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            if (result.ok) { // 가드. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                setCheckedIds((current) => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    current.filter((id) => id !== messageId), // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                );
                router.refresh(); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            }
        });
    }

    function approveCheckedMessages() { // approveCheckedMessages. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        if (visibleCheckedIds.length === 0) return; // 가드. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        const confirmed = window.confirm( // confirmed. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            `선택한 ${visibleCheckedIds.length}건을 승인·발송할까요?`, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        );
        if (!confirmed) return; // 가드. 승인 큐·내 요청. PENDING만 원장이 승인/반려.

        startProcessing(async () => { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            const result = await approveMessages({ // result. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                messageIds: visibleCheckedIds, // 일부 실패해도 성공 건은 발송된 채.
            });
            onFeedback(result.message ?? ""); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            if (result.ok) { // 가드. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                setCheckedIds([]); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                router.refresh(); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            }
        });
    }

    function rejectSelectedMessage(messageId: string) { // rejectSelectedMessage. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        startProcessing(async () => { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            const result = await rejectMessage({ messageId, rejectionReason }); // 수신 행 없이 REJECTED. 사유 필수.
            onFeedback(result.message ?? ""); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            if (result.ok) { // 가드. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                setRejectionReason(""); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                setCheckedIds((current) => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    current.filter((id) => id !== messageId), // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                );
                router.refresh(); // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            }
        });
    }

    return ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        <div className={styles.layout}> // div. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            <aside // 원장 대기 탭이면 일괄 승인 바 + 체크.
                className={cx(surfaceStyles.root, styles.listPanel)} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                {canBulkApprove && messages.length > 0 && ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    <div className={styles.bulkBar}> // div. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        <div className={styles.listActions}> // div. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            <button // button. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                type="button" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                className={styles.ghostBtn} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                disabled={isProcessing || allChecked} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                onClick={() => setCheckedIds(messageIds)} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                전체 선택 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            </button> // button 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            <button // button. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                type="button" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                className={styles.ghostBtn} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                disabled={ // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                    isProcessing || visibleCheckedIds.length === 0 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                }
                                onClick={() => setCheckedIds([])} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                선택 해제 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            </button> // button 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        </div> // div 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        <button // button. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            type="button" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            className={cx(buttonStyles.primary, styles.fullWidthBtn)} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            disabled={ // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                isProcessing || visibleCheckedIds.length === 0 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            }
                            onClick={approveCheckedMessages} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            {isProcessing // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                ? "처리 중…" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                : `선택 승인·발송 (${visibleCheckedIds.length})`} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        </button> // button 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    </div> // div 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                )}

                {messages.length === 0 ? ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    <p className={cx(typographyStyles.hint, styles.empty)}>목록이 비어 있습니다.</p> // p. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                ) : ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    <ul className={styles.messageList}> // ul. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        {messages.map((message) => { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            const statusMetadata = // statusMetadata. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                MESSAGE_STATUS_METADATA[message.status]; // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            const checked = visibleCheckedIds.includes( // checked. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                message.id, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            );

                            return ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                <li key={message.id} className={styles.listRow}> // li. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                    {canBulkApprove && ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        <label className={styles.rowCheck}> // label. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            <input // input. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                type="checkbox" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                checked={checked} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                disabled={isProcessing} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                onChange={() => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                    toggleChecked(message.id) // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                }
                                                onClick={(event) => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                    event.stopPropagation() // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                }
                                            /> // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            <span className={a11yStyles.srOnly}> // span. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                {message.title} 선택 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            </span> // span 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        </label> // label 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                    )}
                                    <button // button. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        type="button" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        className={ // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            message.id === selectedMessage?.id // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                ? styles.itemActive // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                : styles.item // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        }
                                        onClick={() => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            setSelectedMessageId(message.id) // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        }
                                    > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        <div className={styles.itemTop}> // div. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            <strong>{message.title}</strong> // strong. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            <StatusChip // StatusChip. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                tone={statusMetadata.tone} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                                {statusMetadata.label} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            </StatusChip> // StatusChip 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        </div> // div 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        <span className={typographyStyles.hint}> // span. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            {message.authorName} ·{" "} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                            {message.targetSummary} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                        </span> // span 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                    </button> // button 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                </li> // li 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            );
                        })}
                    </ul> // ul 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                )}
            </aside> // aside 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.

            {selectedMessage && ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                <MessageDetail // 고른 쪽지. 원장 PENDING만 승인/반려.
                    message={selectedMessage} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    mode={mode} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    isProcessing={isProcessing} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    rejectionReason={rejectionReason} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    onRejectionReasonChange={setRejectionReason} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    onApprove={approveSelectedMessage} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    onReject={rejectSelectedMessage} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                /> // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            )}
        </div> // div 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    );
}

function MessageDetail({ // MessageDetail. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    message, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    mode, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    isProcessing, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    rejectionReason, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onRejectionReasonChange, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onApprove, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onReject, // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
}: { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    message: MessageListItem; // message. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    mode: "director" | "staff"; // director vs staff. 직원은 승인 버튼을 안 그린다.
    isProcessing: boolean; // isProcessing. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    rejectionReason: string; // 원장 반려 사유. PENDING에는 없다.
    onRejectionReasonChange: (reason: string) => void; // onRejectionReasonChange. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onApprove: (messageId: string) => void; // onApprove. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    onReject: (messageId: string) => void; // onReject. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
}) { // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const statusMetadata = MESSAGE_STATUS_METADATA[message.status]; // statusMetadata. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    const canReview = // canReview. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        mode === "director" && message.status === "PENDING_APPROVAL"; // 직원 "내 요청"에는 승인/반려를 그리지 않는다.

    return ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
        <article className={cx(surfaceStyles.root, styles.detail)}> // article. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            <div className={styles.detailHead}> // div. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                <h2>{message.title}</h2> // h2. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                <StatusChip tone={statusMetadata.tone}> // StatusChip. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    {statusMetadata.label} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                </StatusChip> // StatusChip 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            </div> // div 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            <p className={cx(typographyStyles.hint, styles.meta)}> // p. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                {message.authorName} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                {` · ${message.targetSummary}`} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                {message.recipientCount > 0 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    ? ` · 수신 ${message.recipientCount}명` // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    : ""} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            </p> // p 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            <div className={styles.content}>{message.content}</div> // div. 승인 큐·내 요청. PENDING만 원장이 승인/반려.

            {message.status === "REJECTED" && message.rejectionReason && ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                <p className={cx(typographyStyles.error, styles.rejectBox)}> // p. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    반려 사유: {message.rejectionReason} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                </p> // p 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            )}

            {canReview && ( // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                <div // 원장 + PENDING_APPROVAL만. 승인 시 수신 행이 생긴다.
                    className={styles.detailActions} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    <button // button. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        type="button" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        className={buttonStyles.primary} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        disabled={isProcessing} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        onClick={() => onApprove(message.id)} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        승인·발송 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    </button> // button 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    <label className={fieldStyles.root}> // label. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        <span>반려 사유</span> // span. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        <input // input. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            value={rejectionReason} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            onChange={(event) => // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                                onRejectionReasonChange(event.target.value) // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                            }
                            placeholder="반려 시 필수" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        /> // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    </label> // label 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    <button // button. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        type="button" // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        className={buttonStyles.cancel} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        disabled={isProcessing || !rejectionReason.trim()} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        onClick={() => onReject(message.id)} // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    > // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                        반려 // 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                    </button> // button 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
                </div> // div 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
            )}
        </article> // article 닫기. 승인 큐·내 요청. PENDING만 원장이 승인/반려.
    );
}
