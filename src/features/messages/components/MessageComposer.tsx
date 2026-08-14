"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    directorSendMessage,
    submitMessageForApproval,
} from "@/features/messages/actions";
import { MESSAGE_AUDIENCE_LABELS } from "@/features/messages/presentation";
import type {
    MessageParentOption,
    MessageRecipientOption,
} from "@/features/messages/types";
import {
    buttonStyles,
    cx,
    fieldStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import styles from "../MessagesScreen.module.css";

type MessageMode = "director" | "staff";

type MessageComposerProps = {
    mode: MessageMode;
    students: MessageRecipientOption[];
    onFeedback: (message: string) => void;
};

export default function MessageComposer({
    mode,
    students,
    onFeedback,
}: MessageComposerProps) {
    const router = useRouter();
    const [isSending, startSending] = useTransition();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [audience, setAudience] = useState<"PARENT" | "STUDENT">("STUDENT");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

    const parentOptions = useMemo(() => {
        const byId = new Map<
            string,
            MessageParentOption & { childNames: string[] }
        >();
        for (const student of students) {
            for (const parent of student.parents ?? []) {
                const existing = byId.get(parent.userId);
                if (existing) {
                    if (!existing.childNames.includes(student.name)) {
                        existing.childNames.push(student.name);
                    }
                } else {
                    byId.set(parent.userId, {
                        userId: parent.userId,
                        name: parent.name,
                        childNames: [student.name],
                    });
                }
            }
        }
        return [...byId.values()].sort((a, b) =>
            a.name.localeCompare(b.name, "ko"),
        );
    }, [students]);

    const selectableStudentIds = students.map((student) => student.id);
    const selectableParentIds = parentOptions.map((parent) => parent.userId);
    const studentListLabel = mode === "director" ? "학생" : "담당 학생";
    const parentListLabel = "연결된 학부모";
    const emptyStudentLabel =
        mode === "director" ? "학생이 없습니다." : "담당 학생이 없습니다.";
    const emptyParentLabel =
        mode === "director"
            ? "학생과 연결된 학부모가 없습니다."
            : "담당 학생과 연결된 학부모가 없습니다.";
    const submitLabel = mode === "director" ? "즉시 발송" : "승인 요청";

    function toggleId(
        id: string,
        selected: string[],
        setSelected: (ids: string[]) => void,
    ) {
        setSelected(
            selected.includes(id)
                ? selected.filter((item) => item !== id)
                : [...selected, id],
        );
    }

    function sendMessage() {
        startSending(async () => {
            const broadcast =
                audience === "STUDENT"
                    ? selectableStudentIds.length > 0 &&
                      selectedStudentIds.length === selectableStudentIds.length
                    : selectableParentIds.length > 0 &&
                      selectedParentIds.length === selectableParentIds.length;

            const payload = {
                title,
                content,
                audience,
                broadcast,
                ...(audience === "STUDENT"
                    ? { targetStudentIds: selectedStudentIds }
                    : { targetParentUserIds: selectedParentIds }),
            } as const;

            const result =
                mode === "director"
                    ? await directorSendMessage(payload)
                    : await submitMessageForApproval(payload);

            onFeedback(result.message ?? (result.ok ? "완료" : "실패"));
            if (result.ok) {
                setTitle("");
                setContent("");
                setSelectedStudentIds([]);
                setSelectedParentIds([]);
                router.refresh();
            }
        });
    }

    const selectedCount =
        audience === "STUDENT"
            ? selectedStudentIds.length
            : selectedParentIds.length;
    const canSubmit =
        title.trim() && content.trim() && selectedCount > 0 && !isSending;

    return (
        <div className={styles.composeSplit}>
            <div className={styles.composeMain}>
                <label className={fieldStyles.root}>
                    <span>제목</span>
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={120}
                        placeholder="쪽지 제목"
                    />
                </label>
                <label className={fieldStyles.root}>
                    <span>본문</span>
                    <textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        rows={12}
                        placeholder="전달할 내용을 입력하세요"
                    />
                </label>
                <button
                    type="button"
                    className={buttonStyles.primary}
                    disabled={!canSubmit}
                    onClick={sendMessage}
                >
                    {isSending ? "처리 중…" : submitLabel}
                </button>
            </div>

            <aside className={styles.composeSide}>
                <label className={fieldStyles.root}>
                    <span>수신 대상</span>
                    <select
                        value={audience}
                        onChange={(event) => {
                            setAudience(
                                event.target.value as "PARENT" | "STUDENT",
                            );
                            setSelectedStudentIds([]);
                            setSelectedParentIds([]);
                        }}
                    >
                        <option value="STUDENT">
                            {MESSAGE_AUDIENCE_LABELS.STUDENT}
                        </option>
                        <option value="PARENT">
                            {MESSAGE_AUDIENCE_LABELS.PARENT}
                        </option>
                    </select>
                </label>

                {audience === "STUDENT" ? (
                    <div className={fieldStyles.root}>
                        <div className={styles.listHeader}>
                            <span>
                                {studentListLabel} ({selectedStudentIds.length}/
                                {students.length})
                            </span>
                            <div className={styles.listActions}>
                                <button
                                    type="button"
                                    className={styles.ghostBtn}
                                    onClick={() =>
                                        setSelectedStudentIds(
                                            selectableStudentIds,
                                        )
                                    }
                                    disabled={students.length === 0}
                                >
                                    전체 선택
                                </button>
                                <button
                                    type="button"
                                    className={styles.ghostBtn}
                                    onClick={() => setSelectedStudentIds([])}
                                    disabled={selectedStudentIds.length === 0}
                                >
                                    전체 해제
                                </button>
                            </div>
                        </div>
                        {students.length === 0 ? (
                            <p className={cx(typographyStyles.hint, styles.listEmpty)}>{emptyStudentLabel}</p>
                        ) : (
                            <ul className={styles.checkList}>
                                {students.map((student) => (
                                    <li key={student.id}>
                                        <label className={styles.checkItem}>
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(
                                                    student.id,
                                                )}
                                                onChange={() =>
                                                    toggleId(
                                                        student.id,
                                                        selectedStudentIds,
                                                        setSelectedStudentIds,
                                                    )
                                                }
                                            />
                                            <span>{student.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div className={fieldStyles.root}>
                        <div className={styles.listHeader}>
                            <span>
                                {parentListLabel} ({selectedParentIds.length}/
                                {parentOptions.length})
                            </span>
                            <div className={styles.listActions}>
                                <button
                                    type="button"
                                    className={styles.ghostBtn}
                                    onClick={() =>
                                        setSelectedParentIds(
                                            selectableParentIds,
                                        )
                                    }
                                    disabled={parentOptions.length === 0}
                                >
                                    전체 선택
                                </button>
                                <button
                                    type="button"
                                    className={styles.ghostBtn}
                                    onClick={() => setSelectedParentIds([])}
                                    disabled={selectedParentIds.length === 0}
                                >
                                    전체 해제
                                </button>
                            </div>
                        </div>
                        {parentOptions.length === 0 ? (
                            <p className={cx(typographyStyles.hint, styles.listEmpty)}>{emptyParentLabel}</p>
                        ) : (
                            <ul className={styles.checkList}>
                                {parentOptions.map((parent) => (
                                    <li key={parent.userId}>
                                        <label className={styles.checkItem}>
                                            <input
                                                type="checkbox"
                                                checked={selectedParentIds.includes(
                                                    parent.userId,
                                                )}
                                                onChange={() =>
                                                    toggleId(
                                                        parent.userId,
                                                        selectedParentIds,
                                                        setSelectedParentIds,
                                                    )
                                                }
                                            />
                                            <span>
                                                {parent.name}
                                                <small>
                                                    자녀:{" "}
                                                    {parent.childNames.join(
                                                        ", ",
                                                    )}
                                                </small>
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </aside>
        </div>
    );
}
