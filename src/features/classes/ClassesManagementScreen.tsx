"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    cancelClassSession,
    createClass,
    createClassSession,
    updateClass,
} from "@/app/(director)/director/classes/actions";
import styles from "./ClassesManagementScreen.module.css";

export type TeacherOption = {
    id: string;
    name: string;
    role: "TEACHER" | "STAFF";
};

export type ClassSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type ClassSessionRow = {
    id: string;
    startsAt: string;
    endsAt: string;
    classroom: string | null;
    status: ClassSessionStatus;
};

export type ClassRow = {
    id: string;
    name: string;
    subject: string;
    teacherUserId: string | null;
    teacherName: string | null;
    active: boolean;
    enrollmentCount: number;
    sessions: ClassSessionRow[];
};

const sessionMeta: Record<
    ClassSessionStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    SCHEDULED: { label: "예정", tone: "warning" },
    COMPLETED: { label: "완료", tone: "success" },
    CANCELLED: { label: "취소", tone: "neutral" },
};

function toDatetimeLocalKst(iso: string) {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(d);
    const get = (type: string) =>
        parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function defaultSessionRange() {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return {
        startsAt: toDatetimeLocalKst(start.toISOString()),
        endsAt: toDatetimeLocalKst(end.toISOString()),
    };
}

function formatRange(startIso: string, endIso: string) {
    const fmt = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${fmt.format(new Date(startIso))} ~ ${fmt.format(new Date(endIso))}`;
}

export default function ClassesManagementScreen({
    classes,
    teachers,
}: {
    classes: ClassRow[];
    teachers: TeacherOption[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [activeId, setActiveId] = useState(classes[0]?.id ?? "");

    const active = useMemo(
        () => classes.find((c) => c.id === activeId) ?? classes[0] ?? null,
        [classes, activeId],
    );

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("수학");
    const [teacherUserId, setTeacherUserId] = useState("");
    const [activeFlag, setActiveFlag] = useState(true);

    const range = defaultSessionRange();
    const [startsAt, setStartsAt] = useState(range.startsAt);
    const [endsAt, setEndsAt] = useState(range.endsAt);
    const [classroom, setClassroom] = useState("");

    useEffect(() => {
        if (!active) {
            setEditing(false);
            setName("");
            setSubject("수학");
            setTeacherUserId("");
            setActiveFlag(true);
            return;
        }
        setEditing(true);
        setName(active.name);
        setSubject(active.subject);
        setTeacherUserId(active.teacherUserId ?? "");
        setActiveFlag(active.active);
        setFeedback(null);
    }, [active]);

    function startCreate() {
        setActiveId("");
        setEditing(false);
        setName("");
        setSubject("수학");
        setTeacherUserId("");
        setActiveFlag(true);
        setFeedback(null);
    }

    function saveClass() {
        setFeedback(null);
        startTransition(async () => {
            const result = editing && active
                ? await updateClass({
                      classId: active.id,
                      name,
                      subject,
                      teacherUserId: teacherUserId || null,
                      active: activeFlag,
                  })
                : await createClass({
                      name,
                      subject,
                      teacherUserId: teacherUserId || null,
                  });

            setFeedback(result.message);
            if (result.ok) {
                if (result.id) setActiveId(result.id);
                router.refresh();
            }
        });
    }

    function addSession() {
        if (!active) return;
        setFeedback(null);
        startTransition(async () => {
            const result = await createClassSession({
                classId: active.id,
                startsAt,
                endsAt,
                classroom,
            });
            setFeedback(result.message);
            if (result.ok) {
                const next = defaultSessionRange();
                setStartsAt(next.startsAt);
                setEndsAt(next.endsAt);
                setClassroom("");
                router.refresh();
            }
        });
    }

    function cancelSession(sessionId: string) {
        setFeedback(null);
        startTransition(async () => {
            const result = await cancelClassSession({ sessionId });
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>CLASSES</span>
                    <h1>반·수업</h1>
                    <p>
                        반을 만들고 수업 일정을 등록하면 출석·시간표에
                        반영됩니다.
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.secondaryBtn}
                    disabled={pending}
                    onClick={startCreate}
                >
                    새 반
                </button>
            </header>

            <div className={styles.layout}>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>반 목록</h2>
                        <StatusChip>{classes.length}개</StatusChip>
                    </div>
                    {classes.length === 0 ? (
                        <p className={styles.hint}>아직 반이 없습니다.</p>
                    ) : (
                        <ul className={styles.list}>
                            {classes.map((c) => (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        className={
                                            c.id === active?.id
                                                ? styles.itemActive
                                                : styles.itemBtn
                                        }
                                        onClick={() => setActiveId(c.id)}
                                    >
                                        <strong>
                                            {c.name}
                                            {!c.active ? " (비활성)" : ""}
                                        </strong>
                                        <small>
                                            {c.subject} ·{" "}
                                            {c.teacherName ?? "담당 미지정"} ·
                                            수강 {c.enrollmentCount}명
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </article>

                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>{editing ? "반 수정" : "반 만들기"}</h2>
                    </div>

                    <div className={styles.form}>
                        <label className={styles.field}>
                            <span>반 이름</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={pending}
                                placeholder="예: 중2 수학 A"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>과목</span>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={pending}
                            />
                        </label>
                        <label className={styles.field}>
                            <span>담당</span>
                            <select
                                value={teacherUserId}
                                onChange={(e) =>
                                    setTeacherUserId(e.target.value)
                                }
                                disabled={pending}
                            >
                                <option value="">미지정</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} (
                                        {t.role === "TEACHER" ? "교사" : "직원"}
                                        )
                                    </option>
                                ))}
                            </select>
                        </label>
                        {editing && (
                            <label className={styles.check}>
                                <input
                                    type="checkbox"
                                    checked={activeFlag}
                                    onChange={(e) =>
                                        setActiveFlag(e.target.checked)
                                    }
                                    disabled={pending}
                                />
                                활성 반
                            </label>
                        )}
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            disabled={pending || !name.trim()}
                            onClick={saveClass}
                        >
                            {pending
                                ? "처리 중…"
                                : editing
                                  ? "반 저장"
                                  : "반 만들기"}
                        </button>
                    </div>

                    {active && editing && (
                        <>
                            <div className={styles.panelHead}>
                                <h2>수업 일정</h2>
                                <StatusChip>
                                    {active.sessions.length}건
                                </StatusChip>
                            </div>

                            <div className={styles.form}>
                                <label className={styles.field}>
                                    <span>시작 (KST)</span>
                                    <input
                                        type="datetime-local"
                                        value={startsAt}
                                        onChange={(e) =>
                                            setStartsAt(e.target.value)
                                        }
                                        disabled={pending}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span>종료 (KST)</span>
                                    <input
                                        type="datetime-local"
                                        value={endsAt}
                                        onChange={(e) =>
                                            setEndsAt(e.target.value)
                                        }
                                        disabled={pending}
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span>강의실 (선택)</span>
                                    <input
                                        value={classroom}
                                        onChange={(e) =>
                                            setClassroom(e.target.value)
                                        }
                                        disabled={pending}
                                        placeholder="예: 301호"
                                    />
                                </label>
                                <button
                                    type="button"
                                    className={styles.primaryBtn}
                                    disabled={pending || !active.active}
                                    onClick={addSession}
                                >
                                    {pending ? "처리 중…" : "수업 추가"}
                                </button>
                            </div>

                            <ul className={styles.sessionList}>
                                {active.sessions.length === 0 ? (
                                    <li className={styles.hint}>
                                        등록된 수업이 없습니다.
                                    </li>
                                ) : (
                                    active.sessions.map((s) => {
                                        const meta = sessionMeta[s.status];
                                        return (
                                            <li
                                                key={s.id}
                                                className={styles.sessionRow}
                                            >
                                                <div>
                                                    <strong>
                                                        {formatRange(
                                                            s.startsAt,
                                                            s.endsAt,
                                                        )}
                                                    </strong>
                                                    <small>
                                                        {s.classroom ??
                                                            "강의실 미정"}
                                                    </small>
                                                </div>
                                                <div className={styles.rowSide}>
                                                    <StatusChip
                                                        tone={meta.tone}
                                                    >
                                                        {meta.label}
                                                    </StatusChip>
                                                    {s.status ===
                                                        "SCHEDULED" && (
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.secondaryBtn
                                                            }
                                                            disabled={pending}
                                                            onClick={() =>
                                                                cancelSession(
                                                                    s.id,
                                                                )
                                                            }
                                                        >
                                                            취소
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        </>
                    )}
                </article>
            </div>

            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}