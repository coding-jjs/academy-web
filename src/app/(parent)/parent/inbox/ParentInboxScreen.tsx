"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 학부모 수신 쪽지 목록·본문 UI (클라이언트).
 *
 * props: messages, unreadCount — inbox-data.
 * 제출: `markMessageRead`(useActionState), `markAllMessagesRead`(transition).
 * 발송 폼은 없다. 학원 안내가 홈 미읽음 배지와 맞게 떨어지게 읽음만 처리한다.
 */

import Link from "next/link"; // App Router 링크. 역할 가드를 대신하지 않는다.
import { useActionState, useMemo, useState, useTransition } from "react"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import StatusChip from "@/components/ui/StatusChip"; // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    markAllMessagesRead, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    markMessageRead, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    type InboxActionState, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} from "@/features/messages/inbox-actions"; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import type { ParentInboxMessage } from "@/features/messages/inbox-types"; // features 데이터/액션. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import { // 의존성. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    formatInboxDateTime, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    getMessageSenderRoleLabel, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
} from "@/features/messages/inbox-presentation"; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
import styles from "./ParentInboxScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

const initialState: InboxActionState = { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    status: "idle", // status 필드.
    message: "", // message 필드.
}; // 블록 끝.

const formatDateTime = formatInboxDateTime; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
const roleLabel = getMessageSenderRoleLabel; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

/** 필터·본문·개별/전체 읽음을 그린다. */
export default function ParentInboxScreen({ // 이 파일의 화면. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    messages, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    unreadCount, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
}: { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    messages: ParentInboxMessage[]; // messages 필드.
    unreadCount: number; // unreadCount 필드.
}) { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    const [activeId, setActiveId] = useState(messages[0]?.recipientId ?? ""); // 학부모 수신함. 발송은 막는다.
    const [filter, setFilter] = useState<"all" | "unread">("all"); // 학부모 수신함. 발송은 막는다.
    const [state, formAction, pending] = useActionState( // 개별 읽음. 발송 폼은 없다.
        markMessageRead, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        initialState, // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    ); // 호출/그룹 끝.
    const [allPending, startAllTransition] = useTransition(); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const filtered = useMemo(() => { // 파생 값. 조회 범위를 넓히지 않는다.
        if (filter === "unread") return messages.filter((m) => !m.readAt); // 분기. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        return messages; // 반환. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    }, [filter, messages]); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    const active = // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        filtered.find((m) => m.recipientId === activeId) ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        filtered[0] ?? // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        null; // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.

    function handleSelect(recipientId: string) { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        setActiveId(recipientId); // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
    } // 블록 끝.

    function handleMarkAll() { // 로컬 헬퍼. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
        startAllTransition(async () => { // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
            await markAllMessagesRead(); // 전체 읽음. 학원 안내 배지와 맞춘다.
        }); // 객체/호출 끝.
    } // 블록 끝.

    return ( // 학부모 수신함. 발송은 막는다.
        <section className={styles.page}>{/* 학부모 수신함. 발송은 막는다. */}
            <header className={styles.heading}>{/* 미읽음 칩 + 모두 읽음 */}
                <div>{/* 레이아웃 상자. */}
                    <span>MESSAGES</span>{/* 인라인 표시. */}
                    <h1>쪽지함</h1>{/* 제목. */}
                    <p>학원과 선생님이 보낸 안내를 확인합니다.</p>{/* 문장. */}
                </div>{/* div 닫기. */}
                <div className={styles.headingActions}>{/* 레이아웃 상자. */}
                    {unreadCount > 0 && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <StatusChip tone="warning">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                            미읽음 {unreadCount}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                        </StatusChip> // StatusChip 닫기.
                    )}{/* 구문 끝. */}
                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                        type="button" // type 필드.
                        className={styles.secondaryBtn} // className 필드.
                        disabled={allPending || unreadCount === 0} // disabled 필드.
                        onClick={handleMarkAll} // onClick 필드.
                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                        {allPending ? "처리 중…" : "모두 읽음"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    </button>{/* button 닫기. */}
                </div>{/* div 닫기. */}
            </header>{/* header 닫기. */}

            <div className={styles.filters}>{/* 전체/미읽음 */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="button" // type 필드.
                    className={ // 객체/블록 시작.
                        filter === "all" ? styles.filterActive : styles.filterBtn // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                    } // 블록 끝.
                    onClick={() => setFilter("all")} // onClick 필드.
                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    전체{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                </button>{/* button 닫기. */}
                <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                    type="button" // type 필드.
                    className={ // 객체/블록 시작.
                        filter === "unread" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                            ? styles.filterActive // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                            : styles.filterBtn // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                    } // 블록 끝.
                    onClick={() => setFilter("unread")} // onClick 필드.
                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                    미읽음{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                </button>{/* button 닫기. */}
            </div>{/* div 닫기. */}

            {messages.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.empty}>{/* 수신 없음 */}
                    <h2>받은 쪽지가 없습니다</h2>{/* 소제목. */}
                    <p>학원에서 쪽지를 보내면 이곳에 표시됩니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : filtered.length === 0 ? ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.empty}>{/* 미읽음 필터 결과 없음 */}
                    <h2>미읽음 쪽지가 없습니다</h2>{/* 소제목. */}
                    <p>모든 쪽지를 확인했습니다.</p>{/* 문장. */}
                </div> // div 닫기.
            ) : ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                <div className={styles.layout}>{/* 레이아웃 상자. */}
                    <aside className={styles.listPanel}>{/* 수신 쪽지 */}
                        <ul className={styles.messageList}>{/* 목록. */}
                            {filtered.map((item) => ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <li key={item.recipientId}>{/* 항목. */}
                                    <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                        type="button" // type 필드.
                                        className={ // 객체/블록 시작.
                                            item.recipientId === active?.recipientId // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? styles.itemActive // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : styles.item // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        } // 블록 끝.
                                        onClick={() => // onClick 필드.
                                            handleSelect(item.recipientId) // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        } // 블록 끝.
                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        <div className={styles.itemTop}>{/* 레이아웃 상자. */}
                                            <strong>{item.title}</strong>{/* 강조. */}
                                            {!item.readAt && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                <StatusChip tone="warning">{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                    새 쪽지{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                                </StatusChip> // StatusChip 닫기.
                                            )}{/* 구문 끝. */}
                                        </div>{/* div 닫기. */}
                                        <span>{/* 인라인 표시. */}
                                            {item.senderName} ·{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {formatDateTime(item.createdAt)}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </span>{/* span 닫기. */}
                                    </button>{/* button 닫기. */}
                                </li> // li 닫기.
                            ))}{/* 구문 끝. */}
                        </ul>{/* ul 닫기. */}
                    </aside>{/* aside 닫기. */}

                    {active && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                        <article className={styles.detail}>{/* 본문. 읽음만. */}
                            <div className={styles.detailHead}>{/* 레이아웃 상자. */}
                                <div>{/* 레이아웃 상자. */}
                                    <StatusChip>{/* StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {roleLabel(active.senderRole)}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </StatusChip>{/* StatusChip 닫기. */}
                                    <h2>{active.title}</h2>{/* 소제목. */}
                                    <p>{/* 문장. */}
                                        {active.senderName} ·{" "}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        {formatDateTime(active.createdAt)}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </p>{/* p 닫기. */}
                                </div>{/* div 닫기. */}
                                <StatusChip // StatusChip. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    tone={active.readAt ? "neutral" : "warning"} // tone 필드.
                                >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    {active.readAt ? "읽음" : "미읽음"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </StatusChip>{/* StatusChip 닫기. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.content}>{/* 레이아웃 상자. */}
                                {active.content}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                            </div>{/* div 닫기. */}

                            <div className={styles.detailActions}>{/* 레이아웃 상자. */}
                                {!active.readAt && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <form action={formAction}>{/* markMessageRead */}
                                        <input // 입력. 서버에서 다시 검증한다.
                                            type="hidden" // type 필드.
                                            name="recipientId" // name 필드.
                                            value={active.recipientId} // value 필드.
                                        />{/* 구문 끝. */}
                                        <button // 클릭. 권한을 클라이언트에서 올리지 않는다.
                                            type="submit" // type 필드.
                                            className={styles.primaryBtn} // className 필드.
                                            disabled={pending} // disabled 필드.
                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            {pending // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                ? "처리 중…" // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                                : "읽음 처리"}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </button>{/* button 닫기. */}
                                    </form> // form 닫기.
                                )}{/* 구문 끝. */}

                                {active.hasReport && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    <Link // 이동. layout 가드를 대신하지 않는다.
                                        href="/parent/reports" // href 필드.
                                        className={styles.secondaryBtn} // className 필드.
                                    >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        학습 리포트 보기{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                    </Link> // Link 닫기.
                                )}{/* 구문 끝. */}

                                {active.deepLink && // 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                    active.deepLink.startsWith("/parent/") && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                        <Link // 이동. layout 가드를 대신하지 않는다.
                                            href={active.deepLink} // href 필드.
                                            className={styles.secondaryBtn} // className 필드.
                                        >{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                            관련 화면 이동{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                        </Link> // Link 닫기.
                                    )}{/* 구문 끝. */}
                            </div>{/* div 닫기. */}

                            {state.message && state.status === "error" && ( // 구문. 학부모 Screen. 연결된 자녀만. 결제는 준비 중.
                                <p className={styles.error} role="alert">{/* 문장. */}
                                    {state.message}{/* 학부모 Screen. 연결된 자녀만. 결제는 준비 중. */}
                                </p> // p 닫기.
                            )}{/* 구문 끝. */}
                        </article> // article 닫기.
                    )}{/* 구문 끝. */}
                </div> // div 닫기.
            )}{/* 구문 끝. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
