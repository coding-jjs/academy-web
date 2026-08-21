"use client";

/**
 * 원장·직원 쪽지 화면. 작성 / (원장) 승인 대기 / 내 요청·발송 탭을 나눈다.
 *
 * 호출: `/director/messages`, `/teacher/messages`, `/employee/messages`.
 * 직원은 canCompose가 없으면 작성 UI를 숨겨 sendMessage 없는 계정에 폼을 보이지 않는다.
 * 원장은 승인 대기 탭을 열고, 직원은 pending을 받아도 탭을 그리지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 인박스 UI → 학부모/학생 화면.
 * - 권한 키를 클라이언트에서 해석하지 않음. canCompose는 페이지가 계산한다.
 *
 * 관련: `MessageComposer.tsx`, `MessageListPanel.tsx`.
 */

import { useState } from "react";
import MessageComposer from "@/features/messages/components/MessageComposer";
import MessageListPanel from "@/features/messages/components/MessageListPanel";
import type {
    MessageListItem,
    MessageRecipientOption,
} from "@/features/messages/types";
import {
    buttonStyles,
    cx,
    fieldStyles,
    pageHeadingStyles,
    screenStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
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

/**
 * 쪽지 작성·승인 셸.
 *
 * @param mode director면 즉시 발송·승인 큐, staff면 승인 요청만.
 * @param canCompose false이고 staff면 폼 없이 안내만 보여 준다.
 */
export default function MessagesScreen({
    mode,
    canCompose,
    deniedMessage,
    students,
    classes: _classes,
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
            <section
                className={screenStyles.animatedPage}
            >
                <header className={cx(pageHeadingStyles.root, styles.heading)}>
                    <div>
                        <span className={pageHeadingStyles.eyebrow}>MESSAGES</span>
                        <h1>쪽지</h1>
                        <p>{deniedMessage ?? "쪽지 발송 권한이 없습니다."}</p>
                    </div>
                </header>
            </section>
        );
    }

    return (
        <section className={screenStyles.animatedPage}>
            <header
                className={cx(pageHeadingStyles.root, styles.heading)}
            >
                <div>
                    <span className={pageHeadingStyles.eyebrow}>MESSAGES</span>
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
            {feedback && (
                <p className={cx(typographyStyles.success, styles.feedback)}>{feedback}</p>
            )}

            <div hidden={activeTab !== "compose"}>
                <MessageComposer
                    mode={mode}
                    students={students}
                    onFeedback={setFeedback}
                />
            </div>
            {mode === "director" && (
                <div hidden={activeTab !== "pending"}>
                    <MessageListPanel
                        mode={mode}
                        messages={pending}
                        onFeedback={setFeedback}
                        enableBulkApprove
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
