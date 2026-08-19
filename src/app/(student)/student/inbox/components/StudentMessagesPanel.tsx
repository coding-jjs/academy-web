"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학생 쪽지 목록·본문 패널 (클라이언트).
 *
 * props: messages. `useActionState(markMessageRead)` — 세션 유저의
 * recipientUserId만 서버가 갱신한다. 학부모 inbox와 같은 Action을 쓰되 UI만 학생용.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import { useActionState, useMemo, useState } from "react"; // 의존성. 학생 Screen. 본인 Student.userId만.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학생 Screen. 본인 Student.userId만.
import { // 의존성. 학생 Screen. 본인 Student.userId만.
    markMessageRead, // 구문. 학생 Screen. 본인 Student.userId만.
    type InboxActionState, // 구문. 학생 Screen. 본인 Student.userId만.
} from "@/features/messages/inbox-actions"; // 학생 Screen. 본인 Student.userId만.
import { // 의존성. 학생 Screen. 본인 Student.userId만.
    formatInboxDateTime, // 구문. 학생 Screen. 본인 Student.userId만.
    getMessageSenderRoleLabel, // 구문. 학생 Screen. 본인 Student.userId만.
} from "@/features/messages/inbox-presentation"; // 학생 Screen. 본인 Student.userId만.
import type { InboxMessage } from "@/features/messages/inbox-types"; // features 데이터/액션. 학생 Screen. 본인 Student.userId만.
import styles from "../StudentInboxScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const INITIAL_ACTION_STATE: InboxActionState = { status: "idle", message: "" }; // 학생 Screen. 본인 Student.userId만.

/** 전체/미읽음 필터와 본문 읽음 버튼을 그린다. */
export default function StudentMessagesPanel({ // 이 파일의 화면. 학생 Screen. 본인 Student.userId만.
    messages, // 구문. 학생 Screen. 본인 Student.userId만.
}: { // 구문. 학생 Screen. 본인 Student.userId만.
    messages: InboxMessage[]; // messages 필드.
}) { // 구문. 학생 Screen. 본인 Student.userId만.
    const [filter, setFilter] = useState<"all" | "unread">("all"); // 개별 읽음. 회신 폼은 없다.
    const [activeMessageId, setActiveMessageId] = useState( // UI 상태. 서버 권한·DB를 대신하지 않는다.
        messages[0]?.recipientId ?? "", // 구문. 학생 Screen. 본인 Student.userId만.
    ); // 호출/그룹 끝.
    const [actionState, formAction, isPending] = useActionState( // Server Action 상태. 클라이언트에서 DB를 치지 않는다.
        markMessageRead, // 구문. 학생 Screen. 본인 Student.userId만.
        INITIAL_ACTION_STATE, // 구문. 학생 Screen. 본인 Student.userId만.
    ); // 호출/그룹 끝.
    const filteredMessages = useMemo( // 개별 읽음. 회신 폼은 없다.
        () => // 학생 Screen. 본인 Student.userId만.
            filter === "unread" // 학생 Screen. 본인 Student.userId만.
                ? messages.filter((message) => !message.readAt) // 학생 Screen. 본인 Student.userId만.
                : messages, // 구문. 학생 Screen. 본인 Student.userId만.
        [filter, messages], // 구문. 학생 Screen. 본인 Student.userId만.
    ); // 호출/그룹 끝.
    const activeMessage = // 학생 Screen. 본인 Student.userId만.
        filteredMessages.find( // 구문. 학생 Screen. 본인 Student.userId만.
            (message) => message.recipientId === activeMessageId, // 구문. 학생 Screen. 본인 Student.userId만.
        ) ?? // 학생 Screen. 본인 Student.userId만.
        filteredMessages[0] ?? // 학생 Screen. 본인 Student.userId만.
        null; // 학생 Screen. 본인 Student.userId만.

    return ( // 개별 읽음. 회신 폼은 없다.
        <>{/* 요소. 학생 Screen. 본인 Student.userId만. */}
            <div className={styles.filters}>{/* 전체/미읽음 */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="button" // type 필드.
                    className={ // 객체/블록 시작.
                        filter === "all" // 학생 Screen. 본인 Student.userId만.
                            ? styles.filterActive // 학생 Screen. 본인 Student.userId만.
                            : styles.filterBtn // 학생 Screen. 본인 Student.userId만.
                    } // 블록 끝.
                    onClick={() => setFilter("all")} // onClick 필드.
                >{/* 학생 Screen. 본인 Student.userId만. */}
                    전체{/* 학생 Screen. 본인 Student.userId만. */}
                </button>{/* button 닫기. */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="button" // type 필드.
                    className={ // 객체/블록 시작.
                        filter === "unread" // 학생 Screen. 본인 Student.userId만.
                            ? styles.filterActive // 학생 Screen. 본인 Student.userId만.
                            : styles.filterBtn // 학생 Screen. 본인 Student.userId만.
                    } // 블록 끝.
                    onClick={() => setFilter("unread")} // onClick 필드.
                >{/* 학생 Screen. 본인 Student.userId만. */}
                    미읽음{/* 학생 Screen. 본인 Student.userId만. */}
                </button>{/* button 닫기. */}
            </div>{/* div 닫기. */}
            {messages.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                <div className={styles.empty}>{/* 수신 없음 */}
                    <h2>받은 쪽지가 없습니다</h2>{/* 소제목. */}
                    <p>학원·선생님이 보낸 쪽지가 이곳에 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : filteredMessages.length === 0 ? ( // 구문. 학생 Screen. 본인 Student.userId만.
                <div className={styles.empty}>{/* 미읽음 필터 결과 없음 */}
                    <h2>미읽음 쪽지가 없습니다</h2>{/* 소제목. */}
                    <p>모든 쪽지를 확인했습니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 학생 Screen. 본인 Student.userId만.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <aside className={styles.listPanel}>{/* 수신 쪽지 */}
                        <ul className={styles.messageList}>{/* 목록. */}
                            {filteredMessages.map((message) => ( // 구문. 학생 Screen. 본인 Student.userId만.
                                <li key={message.recipientId}>{/* 항목. */}
                                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                        type="button" // type 필드.
                                        className={ // 객체/블록 시작.
                                            message.recipientId === // 학생 Screen. 본인 Student.userId만.
                                            activeMessage?.recipientId // 학생 Screen. 본인 Student.userId만.
                                                ? styles.itemActive // 학생 Screen. 본인 Student.userId만.
                                                : styles.item // 학생 Screen. 본인 Student.userId만.
                                        } // 블록 끝.
                                        onClick={() => // onClick 필드.
                                            setActiveMessageId( // 구문. 학생 Screen. 본인 Student.userId만.
                                                message.recipientId, // 구문. 학생 Screen. 본인 Student.userId만.
                                            ) // 호출/그룹 끝.
                                        } // 블록 끝.
                                    >{/* 학생 Screen. 본인 Student.userId만. */}
                                        <div className={styles.itemTop}>{/* 레이아웃 상자. */}
                                            <strong>{message.title}</strong>{/* 강조. */}
                                            {!message.readAt && ( // 구문. 학생 Screen. 본인 Student.userId만.
                                                <StatusChip tone="warning">{/* StatusChip. 학생 Screen. 본인 Student.userId만. */}
                                                    새 쪽지{/* 학생 Screen. 본인 Student.userId만. */}
                                                </StatusChip> // StatusChip 닫기.
                                            )}{/* 구문 끝. */}
                                        </div>{/* div 닫기. */}
                                        <span>{/* 인라인 표시. */}
                                            {message.senderName} ·{" "}{/* 학생 Screen. 본인 Student.userId만. */}
                                            {formatInboxDateTime( // 구문. 학생 Screen. 본인 Student.userId만.
                                                message.createdAt, // 구문. 학생 Screen. 본인 Student.userId만.
                                            )}{/* 구문 끝. */}
                                        </span>{/* span 닫기. */}
                                    </button>{/* button 닫기. */}
                                </li> // li 닫기.
                            ))}{/* 구문 끝. */}
                        </ul>{/* ul 닫기. */}
                    </aside>{/* aside 닫기. */}
                    {activeMessage && ( // 구문. 학생 Screen. 본인 Student.userId만.
                        <article className={styles.detail}>{/* 본문. 회신 없음. */}
                            <div className={styles.detailHead}>{/* 레이아웃 상자. */}
                                <div>{/* 레이아웃 상자. */}
                                    <StatusChip>{/* StatusChip. 학생 Screen. 본인 Student.userId만. */}
                                        {getMessageSenderRoleLabel( // 구문. 학생 Screen. 본인 Student.userId만.
                                            activeMessage.senderRole, // 구문. 학생 Screen. 본인 Student.userId만.
                                        )}{/* 구문 끝. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                    <h2>{activeMessage.title}</h2>{/* 소제목. */}
                                    <p>{/* 문장. */}
                                        {activeMessage.senderName} ·{" "}{/* 학생 Screen. 본인 Student.userId만. */}
                                        {formatInboxDateTime( // 구문. 학생 Screen. 본인 Student.userId만.
                                            activeMessage.createdAt, // 구문. 학생 Screen. 본인 Student.userId만.
                                        )}{/* 구문 끝. */}
                                    </p>{/* p 닫기. */}
                                </div>{/* div 닫기. */}
                                <StatusChip // StatusChip. 학생 Screen. 본인 Student.userId만.
                                    tone={ // 객체/블록 시작.
                                        activeMessage.readAt // 학생 Screen. 본인 Student.userId만.
                                            ? "neutral" // 학생 Screen. 본인 Student.userId만.
                                            : "warning" // 학생 Screen. 본인 Student.userId만.
                                    } // 블록 끝.
                                >{/* 학생 Screen. 본인 Student.userId만. */}
                                    {activeMessage.readAt ? "읽음" : "미읽음"}{/* 학생 Screen. 본인 Student.userId만. */}
                                </StatusChip>{/* StatusChip 닫기. */}
                            </div>{/* div 닫기. */}
                            <div className={styles.content}>{/* 레이아웃 상자. */}
                                {activeMessage.content}{/* 학생 Screen. 본인 Student.userId만. */}
                            </div>{/* div 닫기. */}
                            <div className={styles.detailActions}>{/* 레이아웃 상자. */}
                                {!activeMessage.readAt && ( // 구문. 학생 Screen. 본인 Student.userId만.
                                    <form action={formAction}>{/* markMessageRead. 세션 유저 recipient만. */}
                                        <input // 입력. 서버에서 다시 검증한다.
                                            type="hidden" // type 필드.
                                            name="recipientId" // name 필드.
                                            value={activeMessage.recipientId} // value 필드.
                                        />{/* 구문 끝. */}
                                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                            type="submit" // type 필드.
                                            className={styles.primaryBtn} // className 필드.
                                            disabled={isPending} // disabled 필드.
                                        >{/* 학생 Screen. 본인 Student.userId만. */}
                                            {isPending // 학생 Screen. 본인 Student.userId만.
                                                ? "처리 중…" // 학생 Screen. 본인 Student.userId만.
                                                : "읽음 처리"}{/* 학생 Screen. 본인 Student.userId만. */}
                                        </button>{/* button 닫기. */}
                                    </form> // form 닫기.
                                )}{/* 구문 끝. */}
                                {activeMessage.deepLink && ( // 구문. 학생 Screen. 본인 Student.userId만.
                                    <Link // 이동. layout 가드를 대신하지 않는다.
                                        href={activeMessage.deepLink} // href 필드.
                                        className={styles.secondaryBtn} // className 필드.
                                    >{/* 학생 Screen. 본인 Student.userId만. */}
                                        관련 화면 이동{/* 학생 Screen. 본인 Student.userId만. */}
                                    </Link> // Link 닫기.
                                )}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}
                            {actionState.status === "error" && // 학생 Screen. 본인 Student.userId만.
                                actionState.message && ( // 구문. 학생 Screen. 본인 Student.userId만.
                                    <p className={styles.error} role="alert">{/* 문장. */}
                                        {actionState.message}{/* 학생 Screen. 본인 Student.userId만. */}
                                    </p> // p 닫기.
                                )}{/* 구문 끝. */}
                        </article> // article 닫기.
                    )}{/* 구문 끝. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </> // 구문 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
