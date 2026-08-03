"use client";

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import styles from "./StudentGradesScreen.module.css";

export type WrongNoteStatus = "OPEN" | "REVIEWED" | "MASTERED";

export type StudentGradesData = {
    linked: boolean;
    studentName: string;
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
        imageUrls: string[];
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

function isSafeImageUrl(url: string) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return url.startsWith("/");
    }
}

export default function StudentGradesScreen({
    data,
}: {
    data: StudentGradesData;
}) {
    const [tab, setTab] = useState<"grades" | "wrong">("grades");
    const [wrongFilter, setWrongFilter] = useState<"ALL" | WrongNoteStatus>(
        "ALL",
    );
    const [activeWrongId, setActiveWrongId] = useState(
        data.wrongNotes[0]?.id ?? "",
    );

    const filteredWrong = useMemo(() => {
        if (wrongFilter === "ALL") return data.wrongNotes;
        return data.wrongNotes.filter((n) => n.status === wrongFilter);
    }, [data.wrongNotes, wrongFilter]);

    const activeWrong =
        filteredWrong.find((n) => n.id === activeWrongId) ??
        filteredWrong[0] ??
        null;

    if (!data.linked) {
        return (
            <section className={styles.page}>
                <header className={styles.heading}>
                    <div>
                        <span>LEARNING</span>
                        <h1>성적·오답</h1>
                        <p>최근 성적 변화와 복습할 오답을 확인합니다.</p>
                    </div>
                </header>
                <div className={styles.empty}>
                    <h2>연결된 학생 정보가 없습니다</h2>
                    <p>학원에서 학생 계정 연결 후 성적·오답을 볼 수 있습니다.</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>LEARNING</span>
                    <h1>성적·오답</h1>
                    <p>최근 성적 변화와 복습할 오답을 확인합니다.</p>
                </div>
            </header>

            <div className={styles.metrics}>
                {data.highlights.length > 0 ? (
                    data.highlights.map((item) => (
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
                    <strong>{data.wrongNotes.length}</strong>
                    <p>복습 필요 {data.openWrongCount}개</p>
                </article>
            </div>

            <div className={styles.filters}>
                <button
                    type="button"
                    className={
                        tab === "grades" ? styles.filterActive : styles.filterBtn
                    }
                    onClick={() => setTab("grades")}
                >
                    성적
                </button>
                <button
                    type="button"
                    className={
                        tab === "wrong" ? styles.filterActive : styles.filterBtn
                    }
                    onClick={() => setTab("wrong")}
                >
                    오답
                </button>
            </div>

            {tab === "grades" && (
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>성적 기록</h2>
                        <StatusChip>{data.grades.length}건</StatusChip>
                    </div>
                    {data.grades.length === 0 ? (
                        <p className={styles.muted}>등록된 성적이 없습니다.</p>
                    ) : (
                        <ul className={styles.list}>
                            {data.grades.map((g) => (
                                <li key={g.id}>
                                    <div>
                                        <strong>{g.title}</strong>
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
                                            <small>/{g.maxScore}</small>
                                        </strong>
                                        {g.percent != null && (
                                            <span>{g.percent}%</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            )}

            {tab === "wrong" && (
                <>
                    <div className={styles.filters}>
                        {(
                            [
                                ["ALL", "전체"],
                                ["OPEN", "복습 필요"],
                                ["REVIEWED", "복습함"],
                                ["MASTERED", "완료"],
                            ] as const
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                className={
                                    wrongFilter === id
                                        ? styles.filterActive
                                        : styles.filterBtn
                                }
                                onClick={() => {
                                    setWrongFilter(id);
                                    setActiveWrongId("");
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {filteredWrong.length === 0 ? (
                        <div className={styles.empty}>
                            <h2>오답이 없습니다</h2>
                            <p>선택한 조건의 오답 노트가 없습니다.</p>
                        </div>
                    ) : (
                        <div className={styles.layout}>
                            <aside className={styles.listPanel}>
                                <ul className={styles.list}>
                                    {filteredWrong.map((note) => (
                                        <li key={note.id}>
                                            <button
                                                type="button"
                                                className={
                                                    note.id === activeWrong?.id
                                                        ? styles.itemActive
                                                        : styles.item
                                                }
                                                onClick={() =>
                                                    setActiveWrongId(note.id)
                                                }
                                            >
                                                <div className={styles.itemTop}>
                                                    <strong>
                                                        {note.subject ??
                                                            note.className ??
                                                            "오답"}
                                                        {note.questionNo
                                                            ? ` · ${note.questionNo}번`
                                                            : ""}
                                                    </strong>
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
                                                </div>
                                                <span>
                                                    {note.questionText?.slice(
                                                        0,
                                                        40,
                                                    ) ||
                                                        note.gradeTitle ||
                                                        "문제 내용 없음"}
                                                    {note.questionText &&
                                                    note.questionText.length >
                                                        40
                                                        ? "…"
                                                        : ""}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </aside>

                            {activeWrong && (
                                <article className={styles.detail}>
                                    <div className={styles.detailHead}>
                                        <StatusChip
                                            tone={
                                                wrongStatusMeta[
                                                    activeWrong.status
                                                ].tone
                                            }
                                        >
                                            {
                                                wrongStatusMeta[
                                                    activeWrong.status
                                                ].label
                                            }
                                        </StatusChip>
                                        <h2>
                                            {activeWrong.subject ?? "오답"}
                                            {activeWrong.questionNo
                                                ? ` · ${activeWrong.questionNo}번`
                                                : ""}
                                        </h2>
                                        <p>
                                            {formatDate(activeWrong.createdAt)}
                                            {activeWrong.className
                                                ? ` · ${activeWrong.className}`
                                                : ""}
                                        </p>
                                    </div>

                                    <div className={styles.qa}>
                                        <div>
                                            <span>문제</span>
                                            <p>
                                                {activeWrong.questionText ||
                                                    "문제 텍스트 없음"}
                                            </p>
                                        </div>
                                        <div>
                                            <span>내 답</span>
                                            <p>
                                                {activeWrong.studentAnswer ||
                                                    "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <span>정답</span>
                                            <p>
                                                {activeWrong.correctAnswer ||
                                                    "—"}
                                            </p>
                                        </div>
                                        {activeWrong.explanation && (
                                            <div>
                                                <span>해설</span>
                                                <p>{activeWrong.explanation}</p>
                                            </div>
                                        )}
                                    </div>

                                    {activeWrong.imageUrls.length > 0 && (
                                        <div className={styles.images}>
                                            {activeWrong.imageUrls
                                                .filter(isSafeImageUrl)
                                                .map((url) => (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        key={url}
                                                        src={url}
                                                        alt="오답 사진"
                                                    />
                                                ))}
                                        </div>
                                    )}
                                </article>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}