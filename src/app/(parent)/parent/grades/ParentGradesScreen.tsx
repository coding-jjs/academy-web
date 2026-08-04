"use client";

import { useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import styles from "./ParentGradesScreen.module.css";

export type WrongNoteStatus = "OPEN" | "REVIEWED" | "MASTERED";

export type ParentGradesChild = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    highlights: {
        subject: string;
        score: number;
        delta: number | null;
    }[];
    openWrongCount: number;
    grades: {
        id: string;
        title: string;
        subject: string;
        className: string | null;
        score: number;
        maxScore: number;
        percent: number | null;
        assessedAt: string;
    }[];
    wrongNotes: {
        id: string;
        questionNo: string | null;
        questionText: string | null;
        studentAnswer: string | null;
        correctAnswer: string | null;
        explanation: string | null;
        status: WrongNoteStatus;
        createdAt: string;
        className: string | null;
        subject: string | null;
        gradeTitle: string | null;
        imageCount: number;
    }[];
};

const wrongStatusMeta: Record<
    WrongNoteStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    OPEN: { label: "복습 필요", tone: "warning" },
    REVIEWED: { label: "복습함", tone: "neutral" },
    MASTERED: { label: "완료", tone: "success" },
};

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));
}

function formatDelta(delta: number | null) {
    if (delta == null) return "비교 없음";
    if (delta > 0) return `이전 대비 +${delta}`;
    if (delta < 0) return `이전 대비 ${delta}`;
    return "이전과 동일";
}

export default function ParentGradesScreen({
    childList,
}: {
    childList: ParentGradesChild[];
}) {
    const [activeChildId, setActiveChildId] = useState(childList[0]?.id ?? "");
    const child =
        childList.find((item) => item.id === activeChildId) ??
        childList[0] ??
        null;

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>LEARNING</span>
                    <h1>성적·오답</h1>
                    <p>자녀의 성적 변화와 복습할 오답 기록을 확인합니다.</p>
                </div>
            </header>

            {childList.length === 0 ? (
                <div className={styles.empty}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>학원에서 연결을 완료하면 성적·오답이 표시됩니다.</p>
                </div>
            ) : (
                <>
                    {childList.length > 1 && (
                        <div className={styles.childSwitch}>
                            {childList.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        item.id === child?.id
                                            ? styles.childActive
                                            : styles.childBtn
                                    }
                                    onClick={() => setActiveChildId(item.id)}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {child && (
                        <>
                            <div className={styles.metrics}>
                                {child.highlights.length > 0 ? (
                                    child.highlights.map((item) => (
                                        <article key={item.subject}>
                                            <span>최근 {item.subject}</span>
                                            <strong>{item.score}점</strong>
                                            <p>{formatDelta(item.delta)}</p>
                                        </article>
                                    ))
                                ) : (
                                    <article>
                                        <span>최근 성적</span>
                                        <strong>—</strong>
                                        <p>기록 없음</p>
                                    </article>
                                )}
                                <article>
                                    <span>오답 노트</span>
                                    <strong>{child.wrongNotes.length}</strong>
                                    <p>복습 필요 {child.openWrongCount}개</p>
                                </article>
                            </div>

                            <div className={styles.grid}>
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>성적 기록</h2>
                                        <StatusChip>
                                            {child.grades.length}건
                                        </StatusChip>
                                    </div>
                                    {child.grades.length === 0 ? (
                                        <p className={styles.muted}>
                                            등록된 성적이 없습니다.
                                        </p>
                                    ) : (
                                        <ul className={styles.list}>
                                            {child.grades.map((g) => (
                                                <li key={g.id}>
                                                    <div>
                                                        <strong>
                                                            {g.title}
                                                        </strong>
                                                        <span>
                                                            {g.subject}
                                                            {g.className
                                                                ? ` · ${g.className}`
                                                                : ""}
                                                            {` · ${formatDate(g.assessedAt)}`}
                                                        </span>
                                                    </div>
                                                    <div className={styles.score}>
                                                        <strong>
                                                            {g.score}
                                                            <small>
                                                                /{g.maxScore}
                                                            </small>
                                                        </strong>
                                                        {g.percent != null && (
                                                            <span>
                                                                {g.percent}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>

                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>오답 노트</h2>
                                        <StatusChip tone="warning">
                                            복습 {child.openWrongCount}
                                        </StatusChip>
                                    </div>
                                    {child.wrongNotes.length === 0 ? (
                                        <p className={styles.muted}>
                                            등록된 오답이 없습니다.
                                        </p>
                                    ) : (
                                        <ul className={styles.list}>
                                            {child.wrongNotes.map((note) => (
                                                <li key={note.id}>
                                                    <div>
                                                        <strong>
                                                            {note.subject ??
                                                                note.className ??
                                                                "오답"}
                                                            {note.questionNo
                                                                ? ` · ${note.questionNo}번`
                                                                : ""}
                                                        </strong>
                                                        <span>
                                                            {note.questionText?.slice(
                                                                0,
                                                                48,
                                                            ) ||
                                                                note.gradeTitle ||
                                                                "문제 내용 없음"}
                                                            {note.questionText &&
                                                            note.questionText
                                                                .length > 48
                                                                ? "…"
                                                                : ""}
                                                        </span>
                                                        {note.explanation && (
                                                            <small>
                                                                {note.explanation}
                                                            </small>
                                                        )}
                                                    </div>
                                                    <div className={styles.badges}>
                                                        <StatusChip
                                                            tone={
                                                                wrongStatusMeta[
                                                                    note.status
                                                                ].tone
                                                            }
                                                        >
                                                            {
                                                                wrongStatusMeta[
                                                                    note.status
                                                                ].label
                                                            }
                                                        </StatusChip>
                                                        {note.imageCount > 0 && (
                                                            <StatusChip>
                                                                사진{" "}
                                                                {note.imageCount}
                                                            </StatusChip>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    );
}