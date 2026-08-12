"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import type {
    ParentStudentInboxChild,
    StudentNewsItem,
} from "@/features/messages/inbox-types";
import ChildMessagesPanel from "./components/ChildMessagesPanel";
import ChildNewsPanel from "./components/ChildNewsPanel";
import styles from "./ParentStudentInboxScreen.module.css";
import { writeParentChildCookie } from "@/features/families/parent-child-cooke";

export default function ParentStudentInboxScreen({
    childList,
    news,
    activeChildId,
}: {
    childList: ParentStudentInboxChild[];
    news: StudentNewsItem[];
    activeChildId: string;
}) {
    const [activeTab, setActiveTab] = useState<"messages" | "news">("messages");
    const activeChild =
        childList.find((child) => child.id === activeChildId) ??
        childList[0] ??
        null;
    const router = useRouter();

    function selectChild(childId: string) {
        setActiveTab("messages");
        writeParentChildCookie(childId);
        router.replace(`/parent/student-inbox?childId=${childId}`);
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>STUDENT MESSAGES</span>
                    <h1>학생 공지·쪽지</h1>
                    <p>자녀 계정으로 전달된 학원 공지와 쪽지를 확인합니다.</p>
                </div>
                <StatusChip tone="neutral">읽기 전용</StatusChip>
            </header>
            {childList.length === 0 ? (
                <div className={styles.empty}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>학원에서 연결을 완료하면 이곳에 표시됩니다.</p>
                </div>
            ) : (
                <>
                    {childList.length > 1 && (
                        <div className={styles.childSwitch}>
                            {childList.map((child) => (
                                <button
                                    key={child.id}
                                    type="button"
                                    className={
                                        child.id === activeChild?.id
                                            ? styles.childActive
                                            : styles.childBtn
                                    }
                                    onClick={() => selectChild(child.id)}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className={styles.filters}>
                        <button
                            type="button"
                            className={
                                activeTab === "messages"
                                    ? styles.filterActive
                                    : styles.filterBtn
                            }
                            onClick={() => setActiveTab("messages")}
                        >
                            자녀 쪽지
                        </button>
                        <button
                            type="button"
                            className={
                                activeTab === "news"
                                    ? styles.filterActive
                                    : styles.filterBtn
                            }
                            onClick={() => setActiveTab("news")}
                        >
                            학생 공지
                        </button>
                    </div>
                    {activeTab === "messages" && activeChild ? (
                        <ChildMessagesPanel
                            key={activeChild.id}
                            child={activeChild}
                        />
                    ) : (
                        <ChildNewsPanel news={news} />
                    )}
                </>
            )}
        </section>
    );
}
