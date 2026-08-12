"use client";

import { useState } from "react";
import MessageComposer from "@/features/messages/components/MessageComposer";
import MessageListPanel from "@/features/messages/components/MessageListPanel";
import type {
    MessageListItem,
    MessageRecipientOption,
} from "@/features/messages/types";
import styles from "./MessagesScreen.module.css";

type MessageTab = "compose" | "pending" | "mine";

type MessagesScreenProps = {
    mode: "director" | "staff";
    canCompose: boolean;
    deniedMessage?: string;
    students: MessageRecipientOption[];
    classes: MessageRecipientOption[];
    pending: MessageListItem[];
    mine: MessageListItem[];
};

export default function MessagesScreen({
    mode,
    canCompose,
    deniedMessage,
    students,
    classes,
    pending,
    mine,
}: MessagesScreenProps) {
    const [activeTab, setActiveTab] = useState<MessageTab>("compose");
    const [feedback, setFeedback] = useState<string | null>(null);

    function selectTab(tab: MessageTab) {
        setActiveTab(tab);
        setFeedback(null);
    }

    if (!canCompose && mode === "staff") {
        return (
            <section className={styles.page}>
                <header className={styles.heading}>
                    <div>
                        <span>MESSAGES</span>
                        <h1>쪽지</h1>
                        <p>{deniedMessage ?? "쪽지 발송 권한이 없습니다."}</p>
                    </div>
                </header>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MESSAGES</span>
                    <h1>쪽지</h1>
                    <p>
                        {mode === "director"
                            ? "즉시 발송하거나, 직원이 올린 쪽지를 승인합니다."
                            : "작성 후 원장 승인 요청을 보냅니다."}
                    </p>
                </div>
            </header>

            <div className={styles.tabs}>
                <TabButton
                    active={activeTab === "compose"}
                    onClick={() => selectTab("compose")}
                >
                    작성
                </TabButton>
                {mode === "director" && (
                    <TabButton
                        active={activeTab === "pending"}
                        onClick={() => selectTab("pending")}
                    >
                        승인 대기 {pending.length > 0 ? `(${pending.length})` : ""}
                    </TabButton>
                )}
                <TabButton
                    active={activeTab === "mine"}
                    onClick={() => selectTab("mine")}
                >
                    {mode === "director" ? "최근 발송" : "내 요청"}
                </TabButton>
            </div>

            {feedback && <p className={styles.feedback}>{feedback}</p>}

            <div hidden={activeTab !== "compose"}>
                <MessageComposer
                    mode={mode}
                    students={students}
                    classes={classes}
                    onFeedback={setFeedback}
                />
            </div>
            {mode === "director" && (
                <div hidden={activeTab !== "pending"}>
                    <MessageListPanel
                        mode={mode}
                        messages={pending}
                        onFeedback={setFeedback}
                    />
                </div>
            )}
            <div hidden={activeTab !== "mine"}>
                <MessageListPanel
                    mode={mode}
                    messages={mine}
                    onFeedback={setFeedback}
                />
            </div>
        </section>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            className={active ? styles.tabActive : styles.tab}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
