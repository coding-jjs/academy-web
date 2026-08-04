"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    approveMessage,
    directorSendMessage,
    rejectMessage,
    submitMessageForApproval,
    type MessageListItem,
} from "@/lib/message-actions";
import styles from "./MessagesScreen.module.css";

type Mode = "director" | "staff";

type Option = { id: string; name: string };

const audienceLabels: Record<string, string> = {
    ALL: "전체 사용자",
    STAFF: "직원(교사·사무)",
    PARENT: "학부모(+연결 학생)",
    STUDENT: "학생",
};

const statusMeta: Record<
    string,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    PENDING_APPROVAL: { label: "승인 대기", tone: "warning" },
    SENT: { label: "발송됨", tone: "success" },
    REJECTED: { label: "반려", tone: "danger" },
    DRAFT: { label: "임시", tone: "neutral" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

export default function MessagesScreen({
    mode,
    canCompose,
    deniedMessage,
    students,
    classes,
    pending,
    mine,
}: {
    mode: Mode;
    canCompose: boolean;
    deniedMessage?: string;
    students: Option[];
    classes: Option[];
    pending: MessageListItem[];
    mine: MessageListItem[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [tab, setTab] = useState<"compose" | "pending" | "mine">(
        mode === "director" ? "compose" : "compose",
    );

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [audience, setAudience] = useState<string>(
        mode === "director" ? "PARENT" : "PARENT",
    );
    const [targetType, setTargetType] = useState<"none" | "student" | "class">(
        mode === "director" ? "none" : "student",
    );
    const [targetStudentId, setTargetStudentId] = useState(
        students[0]?.id ?? "",
    );
    const [targetClassId, setTargetClassId] = useState(classes[0]?.id ?? "");
    const [activeId, setActiveId] = useState<string | null>(
        pending[0]?.id ?? mine[0]?.id ?? null,
    );
    const [rejectionReason, setRejectionReason] = useState("");

    const directorAudiences = ["ALL", "STAFF", "PARENT", "STUDENT"] as const;
    const staffAudiences = ["PARENT", "STUDENT"] as const;

    const list = tab === "pending" ? pending : tab === "mine" ? mine : [];
    const active = useMemo(
        () => list.find((m) => m.id === activeId) ?? list[0] ?? null,
        [activeId, list],
    );

    function refresh() {
        router.refresh();
    }

    function handleSend() {
        setFeedback(null);
        startTransition(async () => {
            const target =
                targetType === "student"
                    ? { targetStudentId }
                    : targetType === "class"
                      ? { targetClassId }
                      : {};

            const result =
                mode === "director"
                    ? await directorSendMessage({
                          title,
                          content,
                          audience: audience as "ALL" | "STAFF" | "PARENT" | "STUDENT",
                          ...target,
                      })
                    : await submitMessageForApproval({
                          title,
                          content,
                          audience: audience as "PARENT" | "STUDENT",
                          ...target,
                      });

            setFeedback(result.message ?? (result.ok ? "완료" : "실패"));
            if (result.ok) {
                setTitle("");
                setContent("");
                refresh();
            }
        });
    }

    function handleApprove(messageId: string) {
        setFeedback(null);
        startTransition(async () => {
            const result = await approveMessage({ messageId });
            setFeedback(result.message ?? "");
            if (result.ok) refresh();
        });
    }

    function handleReject(messageId: string) {
        setFeedback(null);
        startTransition(async () => {
            const result = await rejectMessage({
                messageId,
                rejectionReason,
            });
            setFeedback(result.message ?? "");
            if (result.ok) {
                setRejectionReason("");
                refresh();
            }
        });
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
                <button
                    type="button"
                    className={tab === "compose" ? styles.tabActive : styles.tab}
                    onClick={() => setTab("compose")}
                >
                    작성
                </button>
                {mode === "director" && (
                    <button
                        type="button"
                        className={
                            tab === "pending" ? styles.tabActive : styles.tab
                        }
                        onClick={() => setTab("pending")}
                    >
                        승인 대기 {pending.length > 0 ? `(${pending.length})` : ""}
                    </button>
                )}
                <button
                    type="button"
                    className={tab === "mine" ? styles.tabActive : styles.tab}
                    onClick={() => setTab("mine")}
                >
                    {mode === "director" ? "최근 발송" : "내 요청"}
                </button>
            </div>

            {feedback && <p className={styles.feedback}>{feedback}</p>}

            {tab === "compose" ? (
                <div className={styles.compose}>
                    <label className={styles.field}>
                        <span>수신 대상</span>
                        <select
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                        >
                            {(mode === "director"
                                ? directorAudiences
                                : staffAudiences
                            ).map((key) => (
                                <option key={key} value={key}>
                                    {audienceLabels[key]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.field}>
                        <span>범위</span>
                        <select
                            value={targetType}
                            onChange={(e) =>
                                setTargetType(
                                    e.target.value as "none" | "student" | "class",
                                )
                            }
                        >
                            {mode === "director" && (
                                <option value="none">전체(대상 유형 기준)</option>
                            )}
                            <option value="student">학생 단위</option>
                            <option value="class">반 단위</option>
                        </select>
                    </label>

                    {targetType === "student" && (
                        <label className={styles.field}>
                            <span>학생</span>
                            <select
                                value={targetStudentId}
                                onChange={(e) =>
                                    setTargetStudentId(e.target.value)
                                }
                            >
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {targetType === "class" && (
                        <label className={styles.field}>
                            <span>반</span>
                            <select
                                value={targetClassId}
                                onChange={(e) => setTargetClassId(e.target.value)}
                            >
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className={styles.field}>
                        <span>제목</span>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
                            placeholder="쪽지 제목"
                        />
                    </label>

                    <label className={styles.field}>
                        <span>본문</span>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            placeholder="전달할 내용을 입력하세요"
                        />
                    </label>

                    <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={isPending || !title.trim() || !content.trim()}
                        onClick={handleSend}
                    >
                        {isPending
                            ? "처리 중…"
                            : mode === "director"
                              ? "즉시 발송"
                              : "승인 요청"}
                    </button>
                </div>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.listPanel}>
                        {list.length === 0 ? (
                            <p className={styles.empty}>목록이 비어 있습니다.</p>
                        ) : (
                            <ul className={styles.messageList}>
                                {list.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className={
                                                item.id === active?.id
                                                    ? styles.itemActive
                                                    : styles.item
                                            }
                                            onClick={() => setActiveId(item.id)}
                                        >
                                            <div className={styles.itemTop}>
                                                <strong>{item.title}</strong>
                                                <StatusChip
                                                    tone={
                                                        statusMeta[item.status]
                                                            ?.tone ?? "neutral"
                                                    }
                                                >
                                                    {statusMeta[item.status]
                                                        ?.label ?? item.status}
                                                </StatusChip>
                                            </div>
                                            <span>
                                                {item.authorName} ·{" "}
                                                {audienceLabels[
                                                    item.audience ?? ""
                                                ] ?? "-"}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>

                    {active && (
                        <article className={styles.detail}>
                            <div className={styles.detailHead}>
                                <h2>{active.title}</h2>
                                <StatusChip
                                    tone={
                                        statusMeta[active.status]?.tone ??
                                        "neutral"
                                    }
                                >
                                    {statusMeta[active.status]?.label ??
                                        active.status}
                                </StatusChip>
                            </div>
                            <p className={styles.meta}>
                                {active.authorName}
                                {active.recipientCount > 0
                                    ? ` · 수신 ${active.recipientCount}명`
                                    : ""}
                            </p>
                            <div className={styles.content}>{active.content}</div>

                            {active.status === "REJECTED" &&
                                active.rejectionReason && (
                                    <p className={styles.rejectBox}>
                                        반려 사유: {active.rejectionReason}
                                    </p>
                                )}

                            {mode === "director" &&
                                active.status === "PENDING_APPROVAL" && (
                                    <div className={styles.detailActions}>
                                        <button
                                            type="button"
                                            className={styles.primaryBtn}
                                            disabled={isPending}
                                            onClick={() =>
                                                handleApprove(active.id)
                                            }
                                        >
                                            승인·발송
                                        </button>
                                        <label className={styles.field}>
                                            <span>반려 사유</span>
                                            <input
                                                value={rejectionReason}
                                                onChange={(e) =>
                                                    setRejectionReason(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="반려 시 필수"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className={styles.secondaryBtn}
                                            disabled={
                                                isPending ||
                                                !rejectionReason.trim()
                                            }
                                            onClick={() =>
                                                handleReject(active.id)
                                            }
                                        >
                                            반려
                                        </button>
                                    </div>
                                )}
                        </article>
                    )}
                </div>
            )}
        </section>
    );
}