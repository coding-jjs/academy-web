"use client";

/**
 * 본인 오답 노트 목록 (클라이언트).
 *
 * props: wrongNotes — 읽기 전용. 상태 변경·삭제 Action 없음.
 * 이미지는 http(s) 또는 상대경로만 렌더해 javascript: URL을 막는다.
 */

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { formatGradeDate } from "@/features/grades/formatters";
import { WRONG_NOTE_STATUS_METADATA } from "@/features/grades/presentation";
import type { StudentGradesData, WrongNoteStatus } from "@/features/grades/types";
import styles from "../StudentGradesScreen.module.css";

const FILTERS = [["ALL", "전체"], ["OPEN", "복습 필요"], ["REVIEWED", "복습함"], ["MASTERED", "완료"]] as const;

/** 상태 필터와 선택한 오답 상세를 그린다. */
export default function StudentWrongNotesPanel({ wrongNotes }: { wrongNotes: StudentGradesData["wrongNotes"] }) {
    const [filter, setFilter] = useState<"ALL" | WrongNoteStatus>("ALL");
    const [activeWrongNoteId, setActiveWrongNoteId] = useState(wrongNotes[0]?.id ?? "");
    const filteredWrongNotes = useMemo(() => filter === "ALL" ? wrongNotes : wrongNotes.filter((note) => note.status === filter), [filter, wrongNotes]);
    const activeWrongNote = filteredWrongNotes.find((note) => note.id === activeWrongNoteId) ?? filteredWrongNotes[0] ?? null;

    function selectFilter(nextFilter: "ALL" | WrongNoteStatus) {
        setFilter(nextFilter);
        setActiveWrongNoteId("");
    }

    return (
        <>
            <div className={styles.filters}>{FILTERS.map(([id, label]) => <button key={id} type="button" className={filter === id ? styles.filterActive : styles.filterBtn} onClick={() => selectFilter(id)}>{label}</button>)}</div>
            {filteredWrongNotes.length === 0 ? (
                <div className={styles.empty}><h2>오답이 없습니다</h2><p>선택한 조건의 오답 노트가 없습니다.</p></div>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.listPanel}><ul className={styles.list}>{filteredWrongNotes.map((note) => { const metadata = WRONG_NOTE_STATUS_METADATA[note.status]; return <li key={note.id}><button type="button" className={note.id === activeWrongNote?.id ? styles.itemActive : styles.item} onClick={() => setActiveWrongNoteId(note.id)}><div className={styles.itemTop}><strong>{note.subject ?? note.className ?? "오답"}{note.questionNo ? ` · ${note.questionNo}번` : ""}</strong><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip></div><span>{getWrongNotePreview(note.questionText, note.gradeTitle)}</span></button></li>; })}</ul></aside>
                    {activeWrongNote && (
                        <WrongNoteDetail wrongNote={activeWrongNote} />
                    )}
                </div>
            )}
        </>
    );
}

/** 문제·내 답·정답·해설·안전 URL 이미지만 보여 준다. */
function WrongNoteDetail({ wrongNote }: { wrongNote: StudentGradesData["wrongNotes"][number] }) {
    const metadata = WRONG_NOTE_STATUS_METADATA[wrongNote.status];
    return (
        <article className={styles.detail}>
            <div className={styles.detailHead}><StatusChip tone={metadata.tone}>{metadata.label}</StatusChip><h2>{wrongNote.subject ?? "오답"}{wrongNote.questionNo ? ` · ${wrongNote.questionNo}번` : ""}</h2><p>{formatGradeDate(wrongNote.createdAt)}{wrongNote.className ? ` · ${wrongNote.className}` : ""}</p></div>
            <div className={styles.qa}><div><span>문제</span><p>{wrongNote.questionText || "문제 텍스트 없음"}</p></div><div><span>내 답</span><p>{wrongNote.studentAnswer || "—"}</p></div><div><span>정답</span><p>{wrongNote.correctAnswer || "—"}</p></div>{wrongNote.explanation && <div><span>해설</span><p>{wrongNote.explanation}</p></div>}</div>
            {wrongNote.imageUrls.length > 0 && <div className={styles.images}>{wrongNote.imageUrls.filter(isSafeImageUrl).map((url) => <img key={url} src={url} alt="오답 사진" />)}</div>}
        </article>
    );
}

/** 목록 미리보기. 본문이 없으면 성적 제목으로 대체. */
function getWrongNotePreview(questionText: string | null, gradeTitle: string | null) {
    if (!questionText) return gradeTitle || "문제 내용 없음";
    return questionText.length > 40 ? `${questionText.slice(0, 40)}…` : questionText;
}

/** http(s) 또는 사이트 상대경로만 허용. */
function isSafeImageUrl(url: string) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return url.startsWith("/");
    }
}
