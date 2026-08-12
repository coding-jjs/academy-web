"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    directorSendMessage,
    submitMessageForApproval,
} from "@/features/messages/actions";
import { MESSAGE_AUDIENCE_LABELS } from "@/features/messages/presentation";
import type {
    MessageAudience,
    MessageRecipientOption,
} from "@/features/messages/types";
import styles from "../MessagesScreen.module.css";

type MessageMode = "director" | "staff";
type TargetType = "none" | "student" | "class";

type MessageComposerProps = {
    mode: MessageMode;
    students: MessageRecipientOption[];
    classes: MessageRecipientOption[];
    onFeedback: (message: string) => void;
};

export default function MessageComposer({
    mode,
    students,
    classes,
    onFeedback,
}: MessageComposerProps) {
    const router = useRouter();
    const [isSending, startSending] = useTransition();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [audience, setAudience] = useState<MessageAudience>("PARENT");
    const [targetType, setTargetType] = useState<TargetType>(
        mode === "director" ? "none" : "student",
    );
    const [targetStudentId, setTargetStudentId] = useState(
        students[0]?.id ?? "",
    );
    const [targetClassId, setTargetClassId] = useState(classes[0]?.id ?? "");

    const availableAudiences: MessageAudience[] =
        mode === "director"
            ? ["ALL", "STAFF", "PARENT", "STUDENT"]
            : ["PARENT", "STUDENT"];

    function sendMessage() {
        startSending(async () => {
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
                          audience,
                          ...target,
                      })
                    : await submitMessageForApproval({
                          title,
                          content,
                          audience: audience as "PARENT" | "STUDENT",
                          ...target,
                      });

            onFeedback(result.message ?? (result.ok ? "완료" : "실패"));
            if (result.ok) {
                setTitle("");
                setContent("");
                router.refresh();
            }
        });
    }

    return (
        <div className={styles.compose}>
            <label className={styles.field}>
                <span>수신 대상</span>
                <select
                    value={audience}
                    onChange={(event) =>
                        setAudience(event.target.value as MessageAudience)
                    }
                >
                    {availableAudiences.map((audienceOption) => (
                        <option key={audienceOption} value={audienceOption}>
                            {MESSAGE_AUDIENCE_LABELS[audienceOption]}
                        </option>
                    ))}
                </select>
            </label>

            <label className={styles.field}>
                <span>범위</span>
                <select
                    value={targetType}
                    onChange={(event) =>
                        setTargetType(event.target.value as TargetType)
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
                        onChange={(event) =>
                            setTargetStudentId(event.target.value)
                        }
                    >
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.name}
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
                        onChange={(event) =>
                            setTargetClassId(event.target.value)
                        }
                    >
                        {classes.map((academyClass) => (
                            <option key={academyClass.id} value={academyClass.id}>
                                {academyClass.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <label className={styles.field}>
                <span>제목</span>
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                    placeholder="쪽지 제목"
                />
            </label>
            <label className={styles.field}>
                <span>본문</span>
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={8}
                    placeholder="전달할 내용을 입력하세요"
                />
            </label>
            <button
                type="button"
                className={styles.primaryBtn}
                disabled={isSending || !title.trim() || !content.trim()}
                onClick={sendMessage}
            >
                {isSending
                    ? "처리 중…"
                    : mode === "director"
                      ? "즉시 발송"
                      : "승인 요청"}
            </button>
        </div>
    );
}
