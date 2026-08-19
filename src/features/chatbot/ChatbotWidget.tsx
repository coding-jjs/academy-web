"use client"; // 클라이언트 상태. 서버 사실 조회는 API.

/**
 * 인증 셸에 붙는 학습 도우미 위젯이다.
 *
 * 호출: `MemberShell` / `AdminShell`이 역할 문자열을 넘긴다.
 * 질문은 POST `/api/chat` 로만 보낸다. API 키·사실 조회·프롬프트는 서버에 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 컨텍스트 JSON을 클라이언트에 내려주지 않는다.
 * - GUEST는 셸에서 이 위젯을 붙이지 않는다.
 *
 * 관련: `app/api/chat/route.ts`, `prompt.ts`.
 */

import Image from "next/image"; // 의존성. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
import { useEffect, useRef, useState, useSyncExternalStore } from "react"; // 의존성. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
import { createPortal } from "react-dom"; // 의존성. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
import styles from "./ChatbotWidget.module.css"; // 의존성. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.

const BUDDY_SRC = "/mascots/nav-buddy.png"; // BUDDY_SRC. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.

type ChatRole = "parent" | "student" | "teacher" | "employee" | "director"; // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.

type ChatMessage = { // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    id: string; // id. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    role: "user" | "assistant"; // role. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    content: string; // 서버 문장만. JSON 스냅샷은 클라이언트에 없다.
};

/** 역할별 추천 질문. 서버 컨텍스트가 아니라 클릭 시 그대로 POST 본문이 된다. */
const SUGGESTIONS: Record<ChatRole, string[]> = { // SUGGESTIONS: Record<ChatRole, string[]> 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    parent: [ // parent: [ 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "최근 성적 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "이번 달 출석 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "수학 시험 결과는?", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "이번 주 시간표 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    ], // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    student: [ // student: [ 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "내 최근 성적 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "오늘 수업 뭐야?", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "가장 최근 시험 점수는?", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "이번 주 시간표 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    ], // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    teacher: ["담당 학생 최근 성적 요약해줘", "미해결 오답이 있는 학생 알려줘"], // teacher. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    employee: [ // employee: [ 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "재원 학생 최근 성적 요약해줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "미해결 오답이 있는 학생 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    ], // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    director: [ // director: [ 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "재원 학생 최근 성적 요약해줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "미해결 오답이 있는 학생 알려줘", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    ], // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
};

/** SSR에서 document.body 포털을 피한다. 클라이언트에서만 true. */
function useIsClient() { // useIsClient. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    return useSyncExternalStore( // 반환. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        () => () => {}, // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        () => true, // 클라이언트에서만 true. document.body 포털을 피한다.
        () => false, // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    );
}

/** 첫 오픈 시 로컬 환영 문. 서버 호출 없이 역할만 반영한다. */
const WELCOME: Record<ChatRole, string> = { // WELCOME: Record<ChatRole, string> 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    parent: "안녕하세요. 자녀의 출석·성적·오답 정보를 알려드려요. 아래에서 질문을 고르거나 직접 입력해 보세요.", // parent. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    student: // student. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "안녕하세요. 내 출석·성적·오답 정보를 알려드려요. 아래에서 질문을 고르거나 직접 입력해 보세요.", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    teacher: // teacher. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "안녕하세요. 담당 학생의 최근 성적·오답·출결을 확인된 기록 기준으로 알려드려요. 학생 이름을 넣어 물어보시면 이번 달 출석과 오늘 수업까지 더 자세히 답합니다.", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    employee: // employee. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "안녕하세요. 조회 가능한 재원 학생의 최근 성적·오답·출결을 확인된 기록 기준으로 알려드려요. 학생 이름을 넣어 물어보시면 이번 달 출석과 오늘 수업까지 더 자세히 답합니다.", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    director: // director. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        "안녕하세요. 재원 학생의 최근 성적·오답·출결을 확인된 기록 기준으로 알려드려요. 학생이 많으면 이름을 넣어 물어보시면 이번 달 출석과 오늘 수업까지 더 자세히 답합니다.", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
};

/**
 * 플로팅 패널. 메시지는 세션에 저장하지 않고 이 컴포넌트 state만 쓴다.
 */
export default function ChatbotWidget({ role }: { role: ChatRole }) { // ChatbotWidget. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    const [open, setOpen] = useState(false); // [open, setOpen]. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    const [input, setInput] = useState(""); // [input, setInput]. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    const [pending, setPending] = useState(false); // [pending, setPending]. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    const [error, setError] = useState<string | null>(null); // [error, setError]. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    const [messages, setMessages] = useState<ChatMessage[]>([]); // 세션에 저장하지 않고 이 컴포넌트 state만 쓴다.
    const mounted = useIsClient(); // mounted. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    const listRef = useRef<HTMLDivElement>(null); // listRef. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.

    function usePrefersReducedMotion() { // 이 위젯 스크롤에만 쓰는 훅. 서버 스냅샷은 true(움직임 없음)로 맞춰 hydration을 피한다.
        return useSyncExternalStore( // 반환. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            (onStoreChange) => { // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                const media = window.matchMedia( // media. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    "(prefers-reduced-motion: reduce)", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                );
                media.addEventListener("change", onStoreChange); // 블록 끝.
                return () => media.removeEventListener("change", onStoreChange); // 반환. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            },
            () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            () => true, // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        );
    }
    const prefersReducedMotion = usePrefersReducedMotion(); // prefersReducedMotion. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.

    function handleOpen() { // handleOpen. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        setOpen(true); // handleOpen 끝.
        setMessages((prev) => // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            prev.length === 0 // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                ? [{ id: "welcome", role: "assistant", content: WELCOME[role] }] // 대화가 비어 있을 때만. 닫았다 열어도 기록을 지우지 않는다.
                : prev, // 삼항 나머지. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        );
    }

    useEffect(() => { // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        listRef.current?.scrollTo({ // 새 메시지·대기 시 맨 아래로. reduced-motion이면 auto.
            top: listRef.current.scrollHeight, // top. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            behavior: prefersReducedMotion ? "auto" : "smooth", // behavior. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        });
    }, [messages, pending, prefersReducedMotion]); // 호출 끝.

    if (!mounted) return null; // SSR에서 document.body 포털을 피한다.

    async function sendMessage(raw: string) { // sendMessage. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        const message = raw.trim(); // message. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        if (!message || pending) return; // 빈 칸·전송 중 중복 POST를 막는다.

        setError(null); // 낙관적으로 사용자 말풍선을 먼저 붙이고 서버 답변을 기다린다.
        setInput(""); // sendMessage 끝.
        setPending(true); // sendMessage 끝.

        const userMessage: ChatMessage = { // userMessage: ChatMessage 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            id: crypto.randomUUID(), // id. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            role: "user", // role. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            content: message, // content. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        };
        setMessages((prev) => [...prev, userMessage]); // sendMessage 끝.

        try { // 실패 시 템플릿/롤백. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            const response = await fetch("/api/chat", { // 본문은 질문 문자열만. 역할·스냅샷은 서버가 세션으로 만든다. proxy matcher 밖.
                method: "POST", // method. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                headers: { "Content-Type": "application/json" }, // headers. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                body: JSON.stringify({ message }), // body. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            });
            const data = (await response.json()) as { // data 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                reply?: string; // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                message?: string; // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                error?: string; // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            };
            const reply = // reply. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                data.reply ?? data.message ?? "답변을 가져오지 못했습니다."; // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.

            setMessages((prev) => [ // 서버 문장만 붙인다. JSON 스냅샷은 클라이언트에 내려주지 않는다.
                ...prev, // 전개. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                { // sendMessage 끝.
                    id: crypto.randomUUID(), // id. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    role: "assistant", // role. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    content: reply, // content. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                },
            ]);

            if (!response.ok && !data.reply) { // 가드. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                setError(data.message ?? "요청에 실패했습니다."); // 블록 끝.
            }
        } catch { // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            setError("네트워크 오류가 발생했습니다."); // 내부 스택은 보여 주지 않는다.
            setMessages((prev) => [ // setMessages((prev) 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                ...prev, // 전개. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                { // 블록 끝.
                    id: crypto.randomUUID(), // id. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    role: "assistant", // role. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    content: // content. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        "지금은 답변을 받을 수 없습니다. 잠시 후 다시 시도해 주세요.", // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                },
            ]);
        } finally { // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            setPending(false); // 블록 끝.
        }
    }

    return createPortal( // 레이아웃 밖으로 띄워 스크롤 컨테이너에 가리지 않게 한다. AdminShell·MemberShell에서 마운트.
        <div className={styles.root}> // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            {open && ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                <section className={styles.panel} aria-label="학습 도우미"> // section. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    <header className={styles.header}> {/* 역할별 부제만. 컨텍스트 JSON은 안 보여 준다. */}
                        <div className={styles.headerTitle}> // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            <Image // Image. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                src={BUDDY_SRC} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                alt="" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                width={36} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                height={36} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                className={styles.headerBuddy} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            /> // 블록 끝.
                            <div> // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                <strong>학습 도우미</strong> // strong. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                <small> // small. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    {role === "parent" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        ? "자녀 출결·성적·오답 정보" // 삼항. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        : role === "student" // 삼항 나머지. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                          ? "내 출결·성적·오답 정보" // 삼항. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                          : "담당·재원 학생 성적·오답·출결"} // 삼항 나머지. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                </small> // small 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        <button // button. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            type="button" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            className={styles.close} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            onClick={() => setOpen(false)} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        > // 블록 끝.
                            닫기 // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        </button> // button 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    </header> // header 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    <div className={styles.messages} ref={listRef}> {/* user/assistant 말풍선. pending이면 생성 중 표시. */}
                        {messages.map((item) => // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            item.role === "user" ? ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                <div // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    key={item.id} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    className={`${styles.bubble} ${styles.user}`} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                > // 블록 끝.
                                    {item.content} // 표현식. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            ) : ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                <div // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    key={item.id} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    className={styles.assistantRow} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                > // 블록 끝.
                                    <Image // Image. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        src={BUDDY_SRC} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        alt="" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        width={32} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        height={32} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        className={styles.bubbleBuddy} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    /> // 블록 끝.
                                    <div // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                        className={`${styles.bubble} ${styles.assistant}`} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    > // 블록 끝.
                                        {item.content} // 표현식. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            ),
                        )}
                        {pending && ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            <div className={styles.assistantRow}> // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                <Image // Image. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    src={BUDDY_SRC} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    alt="" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    width={32} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    height={32} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    className={styles.bubbleBuddy} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                /> // 블록 끝.
                                <div // div. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                    className={`${styles.bubble} ${styles.assistant}`} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                > // 블록 끝.
                                    답변 생성 중… // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        )}
                    </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    <div className={styles.suggestions}> {/* 클릭 시 그대로 POST 본문. 서버 컨텍스트가 아니다. */}
                        {SUGGESTIONS[role].map((text) => ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            <button // button. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                key={text} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                type="button" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                className={styles.suggestion} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                disabled={pending} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                                onClick={() => sendMessage(text)} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            > // 블록 끝.
                                {text} // 표현식. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            </button> // button 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        ))}
                    </div> // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    {error && ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        <p className={styles.error} role="alert"> // p. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            {error} // 표현식. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        </p> // p 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    )}
                    <form // form. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        className={styles.composer} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        onSubmit={(event) => { // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            event.preventDefault(); // 블록 끝.
                            void sendMessage(input); // 질문은 /api/chat 로만 보낸다. API 키는 서버에 둔다.
                        }}
                    > // 블록 끝.
                        <input // input. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            className={styles.input} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            value={input} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            onChange={(event) => setInput(event.target.value)} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            placeholder="질문을 입력하세요" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            maxLength={500} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            disabled={pending} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            aria-label="질문 입력" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        /> // 블록 끝.
                        <button // button. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            type="submit" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            className={styles.send} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                            disabled={pending || input.trim().length === 0} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        > // 블록 끝.
                            전송 // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        </button> // button 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    </form> // form 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                </section> // section 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
            )}
            <button // button. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                type="button" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                className={styles.toggle} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                aria-expanded={open} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                aria-label={open ? "학습 도우미 닫기" : "학습 도우미 열기"} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                onClick={() => { // 닫혀 있으면 마스코트, 열려 있으면 ×.
                    if (open) { // 가드. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        setOpen(false); // 블록 끝.
                        return; // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    }
                    handleOpen(); // sendMessage 끝.
                }}
            > // 호출 끝.
                {open ? ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    "×" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                ) : ( // 블록 시작. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    <Image // Image. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        src={BUDDY_SRC} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        alt="" // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        width={44} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        height={44} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                        className={styles.toggleBuddy} // 블록 끝. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
                    /> // 블록 끝.
                )}
            </button> // button 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        </div>, // div 닫기. 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
        document.body, // 클라이언트 위젯. 컨텍스트 JSON을 안 내려줌.
    );
}
