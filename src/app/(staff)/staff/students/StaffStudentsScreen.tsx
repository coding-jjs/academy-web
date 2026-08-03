"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import { createLearningRecord, type LearningRecordState } from "./actions";
import styles from "./StaffStudentsScreen.module.css";

export type AttendanceStatus =
    | "PRESENT"
    | "LATE"
    | "ABSENT"
    | "EXCUSED"
    | "EARLY_LEAVE";

export type StaffClassOption = {
    id: string;
    name: string;
    subject: string;
};

export type StaffStudentRow = {
    id: string;
    name: string;
    schoolName: string | null;
    grade: string | null;
    status: string;
    googleLinked: boolean;
    email: string | null;
    classes: {
        id: string;
        name: string;
        subject: string;
        teacherName: string | null;
    }[];
    parents: { name: string; relationship: string | null }[];
    recentAttendance: {
        status: AttendanceStatus;
        className: string;
        startsAt: string;
        checkInAt: string | null;
    }[];
    recentGrades: {
        id: string;
        title: string;
        subject: string;
        score: number;
        maxScore: number;
        assessedAt: string;
    }[];
    recentRecords: {
        id: string;
        type: string;
        title: string;
        content: string;
        recordDate: string;
        authorName: string;
    }[];
};

const attendanceLabel: Record<AttendanceStatus, string> = {
    PRESENT: "출석",
    LATE: "지각",
    ABSENT: "결석",
    EXCUSED: "공결",
    EARLY_LEAVE: "조퇴",
};

const recordTypeLabel: Record<string, string> = {
    CLASS_NOTE: "수업 기록",
    HOMEWORK: "숙제",
    LIFE_RECORD: "생활 기록",
};

const studentStatusMeta: Record<
    string,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    ENROLLED: { label: "재원", tone: "success" },
    PAUSED: { label: "휴원", tone: "warning" },
    WITHDRAWN: { label: "퇴원", tone: "neutral" },
};

const initialState: LearningRecordState = {
    status: "idle",
    message: "",
};

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));
}

function todayInputValue() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function StaffStudentsScreen({
    viewAllStudents,
    students,
    classes,
}: {
    viewAllStudents: boolean;
    students: StaffStudentRow[];
    classes: StaffClassOption[];
}) {
    const [query, setQuery] = useState("");
    const [classId, setClassId] = useState("ALL");
    const [activeId, setActiveId] = useState(students[0]?.id ?? "");
    const [showForm, setShowForm] = useState(false);
    const [state, formAction, pending] = useActionState(
        createLearningRecord,
        initialState,
    );

    useEffect(() => {
        setActiveId((prev) => {
            if (prev && students.some((s) => s.id === prev)) return prev;
            return students[0]?.id ?? "";
        });
    }, [students]);

    useEffect(() => {
        if (state.status === "success") {
            setShowForm(false);
        }
    }, [state]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return students.filter((s) => {
            const matchClass =
                classId === "ALL" ||
                s.classes.some((c) => c.id === classId);
            const matchQuery =
                !q ||
                s.name.toLowerCase().includes(q) ||
                s.classes.some((c) => c.name.toLowerCase().includes(q));
            return matchClass && matchQuery;
        });
    }, [students, query, classId]);

    const active =
        filtered.find((s) => s.id === activeId) ?? filtered[0] ?? null;

    const statusMeta =
        studentStatusMeta[active?.status ?? ""] ?? {
            label: active?.status ?? "상태",
            tone: "neutral" as const,
        };

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>MY STUDENTS</span>
                    <h1>담당 학생</h1>
                    <p>담당 학생의 출결과 최근 학습 기록을 확인합니다.</p>
                </div>
                <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={!active}
                    onClick={() => setShowForm((v) => !v)}
                >
                    {showForm ? "닫기" : "기록 작성"}
                </button>
            </header>

            <div className={styles.filters}>
                <label className={styles.field}>
                    <span>학생 검색</span>
                    <input
                        type="search"
                        placeholder="이름 또는 반"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </label>
                <label className={styles.field}>
                    <span>반</span>
                    <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                    >
                        <option value="ALL">전체 반</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <StatusChip>
                    {viewAllStudents ? "전체 학생" : "담당 반"} ·{" "}
                    {filtered.length}명
                </StatusChip>
            </div>

            {students.length === 0 ? (
                <div className={styles.empty}>
                    <h2>담당 학생이 없습니다</h2>
                    <p>반 배정이 되면 이곳에 학생이 표시됩니다.</p>
                </div>
            ) : (
                <div className={styles.layout}>
                    <aside className={styles.listPanel}>
                        {filtered.length === 0 ? (
                            <p className={styles.muted}>
                                검색 결과가 없습니다.
                            </p>
                        ) : (
                            <ul className={styles.list}>
                                {filtered.map((s) => (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            className={
                                                s.id === active?.id
                                                    ? styles.itemActive
                                                    : styles.item
                                            }
                                            onClick={() => {
                                                setActiveId(s.id);
                                                setShowForm(false);
                                            }}
                                        >
                                            <strong>{s.name}</strong>
                                            <span>
                                                {s.classes[0]?.name ??
                                                    "반 없음"}
                                                {s.grade
                                                    ? ` · ${s.grade}`
                                                    : ""}
                                            </span>
                                            <div className={styles.itemMeta}>
                                                <StatusChip
                                                    tone={
                                                        s.googleLinked
                                                            ? "success"
                                                            : "neutral"
                                                    }
                                                >
                                                    {s.googleLinked
                                                        ? "연동"
                                                        : "미연동"}
                                                </StatusChip>
                                                <StatusChip>
                                                    학부모 {s.parents.length}명
                                                </StatusChip>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </aside>

                    {active && (
                        <div className={styles.detail}>
                            <article className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <div>
                                        <h2>{active.name}</h2>
                                        <p>
                                            {active.schoolName ??
                                                "학교 미입력"}
                                            {active.grade
                                                ? ` · ${active.grade}`
                                                : ""}
                                        </p>
                                    </div>
                                    <StatusChip tone={statusMeta.tone}>
                                        {statusMeta.label}
                                    </StatusChip>
                                </div>
                                <ul className={styles.metaList}>
                                    <li>
                                        <strong>반</strong>
                                        <span>
                                            {active.classes.length > 0
                                                ? active.classes
                                                      .map((c) => c.name)
                                                      .join(", ")
                                                : "—"}
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Google</strong>
                                        <span>
                                            {active.googleLinked
                                                ? (active.email ?? "연동")
                                                : "미연동"}
                                        </span>
                                    </li>
                                    <li>
                                        <strong>학부모</strong>
                                        <span>
                                            {active.parents.length > 0
                                                ? active.parents
                                                      .map(
                                                          (p) =>
                                                              `${p.name}${
                                                                  p.relationship
                                                                      ? `(${p.relationship})`
                                                                      : ""
                                                              }`,
                                                      )
                                                      .join(", ")
                                                : "—"}
                                        </span>
                                    </li>
                                </ul>
                            </article>

                            {showForm && (
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>기록 작성</h2>
                                    </div>
                                    <form
                                        action={formAction}
                                        className={styles.form}
                                    >
                                        <input
                                            type="hidden"
                                            name="studentId"
                                            value={active.id}
                                        />
                                        <label className={styles.field}>
                                            <span>유형</span>
                                            <select
                                                name="type"
                                                defaultValue="CLASS_NOTE"
                                            >
                                                <option value="CLASS_NOTE">
                                                    수업 기록
                                                </option>
                                                <option value="HOMEWORK">
                                                    숙제
                                                </option>
                                                <option value="LIFE_RECORD">
                                                    생활 기록
                                                </option>
                                            </select>
                                        </label>
                                        <label className={styles.field}>
                                            <span>반 (선택)</span>
                                            <select
                                                name="classId"
                                                defaultValue=""
                                            >
                                                <option value="">없음</option>
                                                {active.classes.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className={styles.field}>
                                            <span>날짜</span>
                                            <input
                                                type="date"
                                                name="recordDate"
                                                defaultValue={todayInputValue()}
                                                required
                                            />
                                        </label>
                                        <label className={styles.field}>
                                            <span>제목</span>
                                            <input
                                                name="title"
                                                required
                                                maxLength={80}
                                                placeholder="예: 오늘 수업 참여도"
                                            />
                                        </label>
                                        <label className={styles.field}>
                                            <span>내용</span>
                                            <textarea
                                                name="content"
                                                rows={5}
                                                required
                                                maxLength={2000}
                                                placeholder="학습·생활 기록을 입력하세요"
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            className={styles.primaryBtn}
                                            disabled={pending}
                                        >
                                            {pending
                                                ? "저장 중…"
                                                : "기록 저장"}
                                        </button>
                                        {state.message && (
                                            <p
                                                className={
                                                    state.status === "success"
                                                        ? styles.success
                                                        : styles.error
                                                }
                                                role="alert"
                                            >
                                                {state.message}
                                            </p>
                                        )}
                                    </form>
                                </article>
                            )}

                            <div className={styles.grid}>
                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>최근 출결</h2>
                                    </div>
                                    {active.recentAttendance.length === 0 ? (
                                        <p className={styles.muted}>
                                            기록 없음
                                        </p>
                                    ) : (
                                        <ul className={styles.simpleList}>
                                            {active.recentAttendance.map(
                                                (row, idx) => (
                                                    <li
                                                        key={`${row.startsAt}-${idx}`}
                                                    >
                                                        <strong>
                                                            {
                                                                attendanceLabel[
                                                                    row.status
                                                                ]
                                                            }
                                                        </strong>
                                                        <span>
                                                            {row.className} ·{" "}
                                                            {formatDate(
                                                                row.startsAt,
                                                            )}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </article>

                                <article className={styles.panel}>
                                    <div className={styles.panelHead}>
                                        <h2>최근 성적</h2>
                                    </div>
                                    {active.recentGrades.length === 0 ? (
                                        <p className={styles.muted}>
                                            기록 없음
                                        </p>
                                    ) : (
                                        <ul className={styles.simpleList}>
                                            {active.recentGrades.map((g) => (
                                                <li key={g.id}>
                                                    <strong>
                                                        {g.score}/{g.maxScore}
                                                    </strong>
                                                    <span>
                                                        {g.subject} · {g.title}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </article>
                            </div>

                            <article className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <h2>학습 기록</h2>
                                </div>
                                {active.recentRecords.length === 0 ? (
                                    <p className={styles.muted}>
                                        등록된 학습 기록이 없습니다.
                                    </p>
                                ) : (
                                    <ul className={styles.simpleList}>
                                        {active.recentRecords.map((r) => (
                                            <li key={r.id}>
                                                <strong>
                                                    {recordTypeLabel[r.type] ??
                                                        r.type}{" "}
                                                    · {r.title}
                                                </strong>
                                                <span>
                                                    {formatDate(r.recordDate)}{" "}
                                                    · {r.authorName}
                                                </span>
                                                <p>{r.content}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}