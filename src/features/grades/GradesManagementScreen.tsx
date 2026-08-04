"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    createGradeRecord,
    createWrongNote,
    updateGradeRecord,
    updateWrongNote,
} from "@/features/grades/actions";
import styles from "./GradesManagementScreen.module.css";

export type WrongNoteStatus = "OPEN" | "REVIEWED" | "MASTERED";

export type GradesStudentOption = {
    id: string;
    name: string;
    className: string | null;
    classId: string | null;
};

export type GradesGradeRow = {
    id: string;
    studentId: string;
    title: string;
    subject: string;
    score: number;
    maxScore: number;
    assessedAt: string;
    className: string | null;
};

export type GradesWrongRow = {
    id: string;
    studentId: string;
    gradeRecordId: string | null;
    questionNo: string | null;
    questionText: string | null;
    studentAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    status: WrongNoteStatus;
    createdAt: string;
    gradeTitle: string | null;
};

const wrongMeta: Record<
    WrongNoteStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    OPEN: { label: "복습 필요", tone: "warning" },
    REVIEWED: { label: "복습함", tone: "neutral" },
    MASTERED: { label: "완료", tone: "success" },
};

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));
}

export default function GradesManagementScreen({
    students,
    grades,
    wrongNotes,
    canManage,
    deniedMessage,
}: {
    students: GradesStudentOption[];
    grades: GradesGradeRow[];
    wrongNotes: GradesWrongRow[];
    canManage: boolean;
    deniedMessage?: string;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [tab, setTab] = useState<"grades" | "wrong">("grades");
    const [studentId, setStudentId] = useState(students[0]?.id ?? "");

    const activeStudent =
        students.find((s) => s.id === studentId) ?? students[0] ?? null;

    const studentGrades = useMemo(
        () => grades.filter((g) => g.studentId === activeStudent?.id),
        [grades, activeStudent?.id],
    );
    const studentWrongs = useMemo(
        () => wrongNotes.filter((w) => w.studentId === activeStudent?.id),
        [wrongNotes, activeStudent?.id],
    );

    // grade form
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
    const [gTitle, setGTitle] = useState("주간 테스트");
    const [gSubject, setGSubject] = useState("수학");
    const [gScore, setGScore] = useState("80");
    const [gMax, setGMax] = useState("100");
    const [gDate, setGDate] = useState(todayInput);

    // wrong form
    const [editingWrongId, setEditingWrongId] = useState<string | null>(null);
    const [wGradeId, setWGradeId] = useState("");
    const [wNo, setWNo] = useState("");
    const [wText, setWText] = useState("");
    const [wStudent, setWStudent] = useState("");
    const [wCorrect, setWCorrect] = useState("");
    const [wExplain, setWExplain] = useState("");
    const [wStatus, setWStatus] = useState<WrongNoteStatus>("OPEN");

    function selectStudent(id: string) {
        setStudentId(id);
        setEditingGradeId(null);
        setEditingWrongId(null);
        setWGradeId("");
        setFeedback(null);
    }
    function resetGradeForm() {
        setEditingGradeId(null);
        setGTitle("주간 테스트");
        setGSubject("수학");
        setGScore("80");
        setGMax("100");
        setGDate(todayInput());
    }

    function fillGrade(row: GradesGradeRow) {
        setEditingGradeId(row.id);
        setGTitle(row.title);
        setGSubject(row.subject);
        setGScore(String(row.score));
        setGMax(String(row.maxScore));
        setGDate(row.assessedAt.slice(0, 10));
        setTab("grades");
    }

    function resetWrongForm() {
        setEditingWrongId(null);
        setWGradeId("");
        setWNo("");
        setWText("");
        setWStudent("");
        setWCorrect("");
        setWExplain("");
        setWStatus("OPEN");
    }

    function fillWrong(row: GradesWrongRow) {
        setEditingWrongId(row.id);
        setWGradeId(row.gradeRecordId ?? "");
        setWNo(row.questionNo ?? "");
        setWText(row.questionText ?? "");
        setWStudent(row.studentAnswer ?? "");
        setWCorrect(row.correctAnswer ?? "");
        setWExplain(row.explanation ?? "");
        setWStatus(row.status);
        setTab("wrong");
    }

    function saveGrade() {
        if (!canManage || !activeStudent) return;
        setFeedback(null);
        startTransition(async () => {
            const result = editingGradeId
                ? await updateGradeRecord({
                      gradeId: editingGradeId,
                      title: gTitle,
                      subject: gSubject,
                      score: Number(gScore),
                      maxScore: Number(gMax),
                      assessedAt: gDate,
                  })
                : await createGradeRecord({
                      studentId: activeStudent.id,
                      title: gTitle,
                      subject: gSubject,
                      score: Number(gScore),
                      maxScore: Number(gMax),
                      assessedAt: gDate,
                      classId: activeStudent.classId,
                  });
            setFeedback(result.message);
            if (result.ok) {
                resetGradeForm();
                router.refresh();
            }
        });
    }

    function saveWrong() {
        if (!canManage || !activeStudent) return;
        setFeedback(null);
        startTransition(async () => {
            const result = editingWrongId
                ? await updateWrongNote({
                      wrongNoteId: editingWrongId,
                      questionNo: wNo,
                      questionText: wText,
                      studentAnswer: wStudent,
                      correctAnswer: wCorrect,
                      explanation: wExplain,
                      status: wStatus,
                  })
                : await createWrongNote({
                      studentId: activeStudent.id,
                      gradeRecordId: wGradeId || null,
                      classId: activeStudent.classId,
                      questionNo: wNo,
                      questionText: wText,
                      studentAnswer: wStudent,
                      correctAnswer: wCorrect,
                      explanation: wExplain,
                      status: wStatus,
                  });
            setFeedback(result.message);
            if (result.ok) {
                resetWrongForm();
                router.refresh();
            }
        });
    }

    if (!canManage) {
        return (
            <section className={styles.page}>
                <header className={styles.heading}>
                    <div>
                        <span>GRADES</span>
                        <h1>성적·오답</h1>
                        <p>
                            {deniedMessage ??
                                "성적 입력 권한이 없습니다."}
                        </p>
                    </div>
                </header>
            </section>
        );
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>GRADES</span>
                    <h1>성적·오답</h1>
                    <p>학생 성적을 기록하고 오답 노트를 관리합니다.</p>
                </div>
            </header>

            {students.length === 0 ? (
                <p className={styles.hint}>표시할 학생이 없습니다.</p>
            ) : (
                <div className={styles.layout}>
                    <article className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>학생</h2>
                            <StatusChip>{students.length}명</StatusChip>
                        </div>
                        <ul className={styles.studentList}>
                            {students.map((s) => (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        className={
                                            s.id === activeStudent?.id
                                                ? styles.studentActive
                                                : styles.studentBtn
                                        }
                                        onClick={() => selectStudent(s.id)}
                                    >
                                        <strong>{s.name}</strong>
                                        <small>{s.className ?? "미배정"}</small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </article>

                    <article className={styles.panel}>
                        <div className={styles.panelHead}>
                            <h2>
                                {activeStudent
                                    ? `${activeStudent.name}`
                                    : "기록"}
                            </h2>
                            <div className={styles.tabs}>
                                <button
                                    type="button"
                                    className={
                                        tab === "grades"
                                            ? styles.tabActive
                                            : styles.tab
                                    }
                                    onClick={() => setTab("grades")}
                                >
                                    성적
                                </button>
                                <button
                                    type="button"
                                    className={
                                        tab === "wrong"
                                            ? styles.tabActive
                                            : styles.tab
                                    }
                                    onClick={() => setTab("wrong")}
                                >
                                    오답
                                </button>
                            </div>
                        </div>

                        {tab === "grades" ? (
                            <>
                                <div className={styles.form}>
                                    <label className={styles.field}>
                                        <span>제목</span>
                                        <input
                                            value={gTitle}
                                            onChange={(e) =>
                                                setGTitle(e.target.value)
                                            }
                                            disabled={pending}
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>과목</span>
                                        <input
                                            value={gSubject}
                                            onChange={(e) =>
                                                setGSubject(e.target.value)
                                            }
                                            disabled={pending}
                                        />
                                    </label>
                                    <div className={styles.row2}>
                                        <label className={styles.field}>
                                            <span>점수</span>
                                            <input
                                                type="number"
                                                value={gScore}
                                                onChange={(e) =>
                                                    setGScore(e.target.value)
                                                }
                                                disabled={pending}
                                            />
                                        </label>
                                        <label className={styles.field}>
                                            <span>만점</span>
                                            <input
                                                type="number"
                                                value={gMax}
                                                onChange={(e) =>
                                                    setGMax(e.target.value)
                                                }
                                                disabled={pending}
                                            />
                                        </label>
                                    </div>
                                    <label className={styles.field}>
                                        <span>평가일</span>
                                        <input
                                            type="date"
                                            value={gDate}
                                            onChange={(e) =>
                                                setGDate(e.target.value)
                                            }
                                            disabled={pending}
                                        />
                                    </label>
                                    <div className={styles.actions}>
                                        {editingGradeId && (
                                            <button
                                                type="button"
                                                className={styles.secondaryBtn}
                                                disabled={pending}
                                                onClick={resetGradeForm}
                                            >
                                                새로 작성
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.primaryBtn}
                                            disabled={pending || !activeStudent}
                                            onClick={saveGrade}
                                        >
                                            {pending
                                                ? "처리 중…"
                                                : editingGradeId
                                                  ? "성적 수정"
                                                  : "성적 저장"}
                                        </button>
                                    </div>
                                </div>

                                <ul className={styles.list}>
                                    {studentGrades.length === 0 ? (
                                        <li className={styles.hint}>
                                            등록된 성적이 없습니다.
                                        </li>
                                    ) : (
                                        studentGrades.map((g) => (
                                            <li key={g.id} className={styles.row}>
                                                <div>
                                                    <strong>
                                                        {g.title} · {g.subject}
                                                    </strong>
                                                    <small>
                                                        {g.score}/{g.maxScore} ·{" "}
                                                        {formatDate(g.assessedAt)}
                                                    </small>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.secondaryBtn
                                                    }
                                                    disabled={pending}
                                                    onClick={() => fillGrade(g)}
                                                >
                                                    수정
                                                </button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </>
                        ) : (
                            <>
                                <div className={styles.form}>
                                    <label className={styles.field}>
                                        <span>연결 성적 (선택)</span>
                                        <select
                                            value={wGradeId}
                                            onChange={(e) =>
                                                setWGradeId(e.target.value)
                                            }
                                            disabled={pending || !!editingWrongId}
                                        >
                                            <option value="">없음</option>
                                            {studentGrades.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.title} ({g.subject})
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className={styles.field}>
                                        <span>문항 번호</span>
                                        <input
                                            value={wNo}
                                            onChange={(e) =>
                                                setWNo(e.target.value)
                                            }
                                            disabled={pending}
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>문제</span>
                                        <textarea
                                            value={wText}
                                            onChange={(e) =>
                                                setWText(e.target.value)
                                            }
                                            disabled={pending}
                                            rows={3}
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>학생 답</span>
                                        <input
                                            value={wStudent}
                                            onChange={(e) =>
                                                setWStudent(e.target.value)
                                            }
                                            disabled={pending}
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>정답</span>
                                        <input
                                            value={wCorrect}
                                            onChange={(e) =>
                                                setWCorrect(e.target.value)
                                            }
                                            disabled={pending}
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>해설</span>
                                        <textarea
                                            value={wExplain}
                                            onChange={(e) =>
                                                setWExplain(e.target.value)
                                            }
                                            disabled={pending}
                                            rows={3}
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>상태</span>
                                        <select
                                            value={wStatus}
                                            onChange={(e) =>
                                                setWStatus(
                                                    e.target
                                                        .value as WrongNoteStatus,
                                                )
                                            }
                                            disabled={pending}
                                        >
                                            <option value="OPEN">복습 필요</option>
                                            <option value="REVIEWED">복습함</option>
                                            <option value="MASTERED">완료</option>
                                        </select>
                                    </label>
                                    <div className={styles.actions}>
                                        {editingWrongId && (
                                            <button
                                                type="button"
                                                className={styles.secondaryBtn}
                                                disabled={pending}
                                                onClick={resetWrongForm}
                                            >
                                                새로 작성
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.primaryBtn}
                                            disabled={pending || !activeStudent}
                                            onClick={saveWrong}
                                        >
                                            {pending
                                                ? "처리 중…"
                                                : editingWrongId
                                                  ? "오답 수정"
                                                  : "오답 저장"}
                                        </button>
                                    </div>
                                </div>

                                <ul className={styles.list}>
                                    {studentWrongs.length === 0 ? (
                                        <li className={styles.hint}>
                                            등록된 오답이 없습니다.
                                        </li>
                                    ) : (
                                        studentWrongs.map((w) => {
                                            const meta = wrongMeta[w.status];
                                            return (
                                                <li
                                                    key={w.id}
                                                    className={styles.row}
                                                >
                                                    <div>
                                                        <strong>
                                                            {w.questionNo
                                                                ? `${w.questionNo}. `
                                                                : ""}
                                                            {w.questionText ??
                                                                "(내용 없음)"}
                                                        </strong>
                                                        <small>
                                                            {w.gradeTitle
                                                                ? `${w.gradeTitle} · `
                                                                : ""}
                                                            {formatDate(
                                                                w.createdAt,
                                                            )}
                                                        </small>
                                                    </div>
                                                    <div className={styles.rowSide}>
                                                        <StatusChip
                                                            tone={meta.tone}
                                                        >
                                                            {meta.label}
                                                        </StatusChip>
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.secondaryBtn
                                                            }
                                                            disabled={pending}
                                                            onClick={() =>
                                                                fillWrong(w)
                                                            }
                                                        >
                                                            수정
                                                        </button>
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
            )}

            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}
