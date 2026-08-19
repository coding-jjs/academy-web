"use client"; // 클라이언트 UI. 권한·쓰기는 서버 Action.

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

import { useState } from "react"; // 로컬 UI. 권한 판정은 서버.
import MessageComposer from "@/features/messages/components/MessageComposer"; // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
import MessageListPanel from "@/features/messages/components/MessageListPanel"; // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
import type { // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    MessageListItem, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    MessageRecipientOption, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
} from "@/features/messages/types"; // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
import { // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    buttonStyles, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    cx, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    fieldStyles, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    pageHeadingStyles, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    screenStyles, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    typographyStyles, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
} from "@/components/ui/shared-styles"; // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
import styles from "./MessagesScreen.module.css"; // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.

type MessageTab = "compose" | "pending" | "mine"; // MessageTab 타입. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.

type MessagesScreenProps = { // MessagesScreenProps 타입. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    mode: "director" | "staff"; // director vs staff. 직원은 승인 버튼을 안 그린다.
    canCompose: boolean; // canCompose. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    deniedMessage?: string; // deniedMessage. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    students: MessageRecipientOption[]; // students. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    classes: MessageRecipientOption[]; // classes. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    pending: MessageListItem[]; // PENDING_APPROVAL. 수신 행이 없어 인박스에 없다.
    mine: MessageListItem[]; // 직원 내 요청 또는 원장 최근 SENT.
};

/**
 * 쪽지 작성·승인 셸.
 *
 * @param mode director면 즉시 발송·승인 큐, staff면 승인 요청만.
 * @param canCompose false이고 staff면 폼 없이 안내만 보여 준다.
 */
export default function MessagesScreen({ // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    mode, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    canCompose, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    deniedMessage, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    students, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    classes: _classes, // 반 옵션은 페이지가 넘기지만 작곡기는 학생/학부모 체크만 쓴다.
    pending, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    mine, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
}: MessagesScreenProps) { // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    const [activeTab, setActiveTab] = useState<MessageTab>("compose"); // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    const [feedback, setFeedback] = useState<string | null>(null); // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.

    function selectTab(tab: MessageTab) { // selectTab. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        setActiveTab(tab); // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        setFeedback(null); // 이전 저장 안내를 지운다.
    }

    if (!canCompose && mode === "staff") { // 가드. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        return ( // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            <section // sendMessage 없으면 작성 UI 없이 안내만. canCompose는 page가 계산한다.
                className={screenStyles.animatedPage} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            > // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <header className={cx(pageHeadingStyles.root, styles.heading)}> // header. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    <div> // div. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        <span className={pageHeadingStyles.eyebrow}>MESSAGES</span> // span. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        <h1>쪽지</h1> // h1. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        <p>{deniedMessage ?? "쪽지 발송 권한이 없습니다."}</p> // p. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    </div> // div 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                </header> // header 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            </section> // section 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        );
    }

    return ( // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        <section className={screenStyles.animatedPage}> // section. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            <header // 원장은 즉시 발송·승인, 직원은 승인 요청만.
                className={cx(pageHeadingStyles.root, styles.heading)} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            > // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <div> // div. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    <span className={pageHeadingStyles.eyebrow}>MESSAGES</span> // span. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    <h1>쪽지</h1> // h1. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    <p> // p. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        {mode === "director" // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                            ? "즉시 발송하거나, 직원이 올린 쪽지를 승인합니다." // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                            : "작성 후 원장 승인 요청을 보냅니다."} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    </p> // p 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                </div> // div 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            </header> // header 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.

            <div className={styles.tabs}> // div. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <TabButton // TabButton. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    active={activeTab === "compose"} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    onClick={() => selectTab("compose")} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                > // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    작성 // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                </TabButton> // TabButton 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                {mode === "director" && ( // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    <TabButton // 원장만. 직원 pending 배열은 비어 있어도 탭을 숨긴다.
                        active={activeTab === "pending"} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        onClick={() => selectTab("pending")} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    > // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        승인 대기 {pending.length > 0 ? `(${pending.length})` : ""} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    </TabButton> // TabButton 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                )}
                <TabButton // TabButton. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    active={activeTab === "mine"} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    onClick={() => selectTab("mine")} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                > // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    {mode === "director" ? "최근 발송" : "내 요청"} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                </TabButton> // TabButton 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            </div> // div 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.

            {feedback && ( // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <p className={cx(typographyStyles.success, styles.feedback)}>{feedback}</p> // p. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            )}

            <div hidden={activeTab !== "compose"}> // div. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <MessageComposer // hidden으로 유지해 탭을 바꿔도 입력을 잃지 않는다.
                    mode={mode} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    students={students} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    onFeedback={setFeedback} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                /> // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            </div> // div 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            {mode === "director" && ( // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <div hidden={activeTab !== "pending"}> // div. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    <MessageListPanel // MessageListPanel. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        mode={mode} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        messages={pending} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        onFeedback={setFeedback} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                        enableBulkApprove // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    /> // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                </div> // div 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            )}
            <div hidden={activeTab !== "mine"}> // div. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                <MessageListPanel // MessageListPanel. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    mode={mode} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    messages={mine} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                    onFeedback={setFeedback} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
                /> // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            </div> // div 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        </section> // section 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    );
}

function TabButton({ // TabButton. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    active, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    onClick, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    children, // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
}: { // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    active: boolean; // active. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    onClick: () => void; // onClick. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    children: React.ReactNode; // children. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
}) { // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    return ( // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        <button // button. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            type="button" // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            className={active ? styles.tabActive : styles.tab} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            onClick={onClick} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        > // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
            {children} // 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
        </button> // button 닫기. 원장·직원 쪽지 작성 UI. 직원은 PARENT/STUDENT만.
    );
}
