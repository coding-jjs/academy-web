"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import styles from "./ChatbotWidget.module.css";

const BUDDY_SRC = "/mascots/nav-buddy.png";

type ChatRole = "parent" | "student" | "teacher" | "employee" | "director";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

const SUGGESTIONS: Record<ChatRole, string[]> = {
    parent: [
        "최근 성적 알려줘",
        "이번 달 출석 알려줘",
        "수학 시험 결과는?",
        "이번 주 시간표 알려줘",
    ],
    student: [
        "내 최근 성적 알려줘",
        "오늘 수업 뭐야?",
        "가장 최근 시험 점수는?",
        "이번 주 시간표 알려줘",
    ],
    teacher: ["담당 학생 최근 성적 요약해줘", "미해결 오답이 있는 학생 알려줘"],
    employee: [
        "재원 학생 최근 성적 요약해줘",
        "미해결 오답이 있는 학생 알려줘",
    ],
    director: [
        "재원 학생 최근 성적 요약해줘",
        "미해결 오답이 있는 학생 알려줘",
    ],
};

function useIsClient() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}

const WELCOME: Record<ChatRole, string> = {
    parent: "안녕하세요. 자녀의 출석·성적·오답 정보를 알려드려요. 아래에서 질문을 고르거나 직접 입력해 보세요.",
    student:
        "안녕하세요. 내 출석·성적·오답 정보를 알려드려요. 아래에서 질문을 고르거나 직접 입력해 보세요.",
    teacher:
        "안녕하세요. 담당 학생의 최근 성적·오답·출결을 확인된 기록 기준으로 알려드려요. 학생 이름을 넣어 물어보시면 이번 달 출석과 오늘 수업까지 더 자세히 답합니다.",
    employee:
        "안녕하세요. 조회 가능한 재원 학생의 최근 성적·오답·출결을 확인된 기록 기준으로 알려드려요. 학생 이름을 넣어 물어보시면 이번 달 출석과 오늘 수업까지 더 자세히 답합니다.",
    director:
        "안녕하세요. 재원 학생의 최근 성적·오답·출결을 확인된 기록 기준으로 알려드려요. 학생이 많으면 이름을 넣어 물어보시면 이번 달 출석과 오늘 수업까지 더 자세히 답합니다.",
};

export default function ChatbotWidget({ role }: { role: ChatRole }) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const mounted = useIsClient();
    const listRef = useRef<HTMLDivElement>(null);

    function usePrefersReducedMotion() {
        return useSyncExternalStore(
            (onStoreChange) => {
                const media = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                );
                media.addEventListener("change", onStoreChange);
                return () => media.removeEventListener("change", onStoreChange);
            },
            () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            () => true,
        );
    }
    const prefersReducedMotion = usePrefersReducedMotion();

    function handleOpen() {
        setOpen(true);
        setMessages((prev) =>
            prev.length === 0
                ? [{ id: "welcome", role: "assistant", content: WELCOME[role] }]
                : prev,
        );
    }

    useEffect(() => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: prefersReducedMotion ? "auto" : "smooth",
        });
    }, [messages, pending, prefersReducedMotion]);

    if (!mounted) return null;

    async function sendMessage(raw: string) {
        const message = raw.trim();
        if (!message || pending) return;

        setError(null);
        setInput("");
        setPending(true);

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: message,
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = (await response.json()) as {
                reply?: string;
                message?: string;
                error?: string;
            };
            const reply =
                data.reply ?? data.message ?? "답변을 가져오지 못했습니다.";

            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: reply,
                },
            ]);

            if (!response.ok && !data.reply) {
                setError(data.message ?? "요청에 실패했습니다.");
            }
        } catch {
            setError("네트워크 오류가 발생했습니다.");
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content:
                        "지금은 답변을 받을 수 없습니다. 잠시 후 다시 시도해 주세요.",
                },
            ]);
        } finally {
            setPending(false);
        }
    }

    return createPortal(
        <div className={styles.root}>
            {open && (
                <section className={styles.panel} aria-label="학습 도우미">
                    <header className={styles.header}>
                        <div className={styles.headerTitle}>
                            <Image
                                src={BUDDY_SRC}
                                alt=""
                                width={36}
                                height={36}
                                className={styles.headerBuddy}
                            />
                            <div>
                                <strong>학습 도우미</strong>
                                <small>
                                    {role === "parent"
                                        ? "자녀 출결·성적·오답 정보"
                                        : role === "student"
                                          ? "내 출결·성적·오답 정보"
                                          : "담당·재원 학생 성적·오답·출결"}
                                </small>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={styles.close}
                            onClick={() => setOpen(false)}
                        >
                            닫기
                        </button>
                    </header>
                    <div className={styles.messages} ref={listRef}>
                        {messages.map((item) =>
                            item.role === "user" ? (
                                <div
                                    key={item.id}
                                    className={`${styles.bubble} ${styles.user}`}
                                >
                                    {item.content}
                                </div>
                            ) : (
                                <div
                                    key={item.id}
                                    className={styles.assistantRow}
                                >
                                    <Image
                                        src={BUDDY_SRC}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className={styles.bubbleBuddy}
                                    />
                                    <div
                                        className={`${styles.bubble} ${styles.assistant}`}
                                    >
                                        {item.content}
                                    </div>
                                </div>
                            ),
                        )}
                        {pending && (
                            <div className={styles.assistantRow}>
                                <Image
                                    src={BUDDY_SRC}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className={styles.bubbleBuddy}
                                />
                                <div
                                    className={`${styles.bubble} ${styles.assistant}`}
                                >
                                    답변 생성 중…
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.suggestions}>
                        {SUGGESTIONS[role].map((text) => (
                            <button
                                key={text}
                                type="button"
                                className={styles.suggestion}
                                disabled={pending}
                                onClick={() => sendMessage(text)}
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}
                    <form
                        className={styles.composer}
                        onSubmit={(event) => {
                            event.preventDefault();
                            void sendMessage(input);
                        }}
                    >
                        <input
                            className={styles.input}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="질문을 입력하세요"
                            maxLength={500}
                            disabled={pending}
                            aria-label="질문 입력"
                        />
                        <button
                            type="submit"
                            className={styles.send}
                            disabled={pending || input.trim().length === 0}
                        >
                            전송
                        </button>
                    </form>
                </section>
            )}
            <button
                type="button"
                className={styles.toggle}
                aria-expanded={open}
                aria-label={open ? "학습 도우미 닫기" : "학습 도우미 열기"}
                onClick={() => {
                    if (open) {
                        setOpen(false);
                        return;
                    }
                    handleOpen();
                }}
            >
                {open ? (
                    "×"
                ) : (
                    <Image
                        src={BUDDY_SRC}
                        alt=""
                        width={44}
                        height={44}
                        className={styles.toggleBuddy}
                    />
                )}
            </button>
        </div>,
        document.body,
    );
}
