"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import {
    advanceChurnCase,
    runChurnDetection,
    saveChurnThreshold,
    sendChurnParentNote,
} from "./actions";
import styles from "./DirectorChurnScreen.module.css";

export type ChurnCaseStatus =
    | "DETECTED"
    | "COUNSELING"
    | "IMPROVED"
    | "WITHDRAWN";

export type ChurnSignalType =
    | "ATTENDANCE_DROP"
    | "SCORE_DROP"
    | "CONSECUTIVE_ABSENCE"
    | "UNPAID_DAYS";

export type DirectorChurnCase = {
    id: string;
    churnCaseId: string | null;
    studentId: string;
    studentName: string;
    schoolName: string | null;
    grade: string | null;
    className: string | null;
    teacherName: string | null;
    reason: string;
    status: ChurnCaseStatus | null;
    detectedAt: string | null;
};

export type ChurnThreshold = {
    attendanceDropPercentPoint: number;
    scoreDropPoints: number;
    consecutiveAbsences: number;
    unpaidDays: number;
};

const statusMeta: Record<
    ChurnCaseStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    DETECTED: { label: "위험 감지", tone: "danger" },
    COUNSELING: { label: "상담 중", tone: "warning" },
    IMPROVED: { label: "개선", tone: "success" },
    WITHDRAWN: { label: "퇴원", tone: "neutral" },
};

function actionLabel(status: ChurnCaseStatus | null) {
    if (status === "DETECTED") return "상담 시작";
    if (status === "COUNSELING") return "개선 처리";
    if (status === "IMPROVED" || status === "WITHDRAWN") return "쪽지";
    return "—";
}

export default function DirectorChurnScreen({
    cases,
    threshold,
}: {
    cases: DirectorChurnCase[];
    threshold: ChurnThreshold;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showThreshold, setShowThreshold] = useState(false);

    const [attendanceDrop, setAttendanceDrop] = useState(
        String(threshold.attendanceDropPercentPoint),
    );
    const [scoreDrop, setScoreDrop] = useState(
        String(threshold.scoreDropPoints),
    );
    const [absences, setAbsences] = useState(
        String(threshold.consecutiveAbsences),
    );
    const [unpaid, setUnpaid] = useState(String(threshold.unpaidDays));

    const stats = useMemo(() => {
        const counts = { DETECTED: 0, COUNSELING: 0, IMPROVED: 0 };
        for (const item of cases) {
            if (item.status && item.status in counts) {
                counts[item.status as keyof typeof counts] += 1;
            }
        }
        return [
            {
                label: "위험 감지",
                value: `${counts.DETECTED}명`,
                detail: "자동 규칙 충족",
            },
            {
                label: "상담 중",
                value: `${counts.COUNSELING}명`,
                detail: "담당 선생님 조치 중",
            },
            {
                label: "개선",
                value: `${counts.IMPROVED}명`,
                detail: "최근 처리",
            },
        ];
    }, [cases]);

    function runDetect() {
        setFeedback(null);
        startTransition(async () => {
            const result = await runChurnDetection();
            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    function runAction(item: DirectorChurnCase) {
        if (!item.churnCaseId || !item.status) return;
        setFeedback(null);

        startTransition(async () => {
            const result =
                item.status === "IMPROVED" || item.status === "WITHDRAWN"
                    ? await sendChurnParentNote({
                          churnCaseId: item.churnCaseId!,
                      })
                    : await advanceChurnCase({
                          churnCaseId: item.churnCaseId!,
                      });

            setFeedback(result.message);
            if (result.ok) router.refresh();
        });
    }

    function runSaveThreshold() {
        setFeedback(null);
        startTransition(async () => {
            const result = await saveChurnThreshold({
                attendanceDropPercentPoint: Number(attendanceDrop),
                scoreDropPoints: Number(scoreDrop),
                consecutiveAbsences: Number(absences),
                unpaidDays: Number(unpaid),
            });
            setFeedback(result.message);
            if (result.ok) {
                setShowThreshold(false);
                router.refresh();
            }
        });
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>STUDENT CARE</span>
                    <h1>이탈 위험</h1>
                    <p>출결, 성적, 연속 결석과 미납 신호를 함께 확인합니다.</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        disabled={pending}
                        onClick={runDetect}
                    >
                        {pending ? "감지 중…" : "이탈 감지 실행"}
                    </button>
                    <button
                        type="button"
                        className={styles.thresholdBtn}
                        disabled={pending}
                        onClick={() => setShowThreshold((v) => !v)}
                    >
                        임계값 설정
                    </button>
                </div>
            </header>

            {showThreshold && (
                <div className={styles.thresholdForm}>
                    <label>
                        출석 하락 (%p)
                        <input
                            type="number"
                            value={attendanceDrop}
                            onChange={(e) => setAttendanceDrop(e.target.value)}
                            disabled={pending}
                        />
                    </label>
                    <label>
                        성적 하락 (점)
                        <input
                            type="number"
                            value={scoreDrop}
                            onChange={(e) => setScoreDrop(e.target.value)}
                            disabled={pending}
                        />
                    </label>
                    <label>
                        연속 결석 (회)
                        <input
                            type="number"
                            value={absences}
                            onChange={(e) => setAbsences(e.target.value)}
                            disabled={pending}
                        />
                    </label>
                    <label>
                        미납 (일)
                        <input
                            type="number"
                            value={unpaid}
                            onChange={(e) => setUnpaid(e.target.value)}
                            disabled={pending}
                        />
                    </label>
                    <button
                        type="button"
                        className={styles.actionBtn}
                        disabled={pending}
                        onClick={runSaveThreshold}
                    >
                        {pending ? "저장 중…" : "저장"}
                    </button>
                </div>
            )}

            <div className={styles.metrics}>
                {stats.map((item) => (
                    <article key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.detail}</p>
                    </article>
                ))}
            </div>

            <div className={styles.tablePanel}>
                <div className={styles.thresholdBar}>
                    <StatusChip tone="neutral">기본값</StatusChip>
                    <span>
                        출석 {threshold.attendanceDropPercentPoint}%p · 성적{" "}
                        {threshold.scoreDropPoints}점 · 결석{" "}
                        {threshold.consecutiveAbsences}회 · 미납{" "}
                        {threshold.unpaidDays}일
                    </span>
                </div>

                {cases.length === 0 ? (
                    <div className={styles.emptyPanel}>
                        <h2>등록된 학생이 없습니다</h2>
                        <p>학생이 등록되면 이탈 신호를 여기서 확인합니다.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table>
                            <thead>
                                <tr>
                                    <th>학생</th>
                                    <th>담당</th>
                                    <th>감지 사유</th>
                                    <th>상태</th>
                                    <th>조치</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((item) => {
                                    const meta = item.status
                                        ? statusMeta[item.status]
                                        : null;
                                    const canAct = Boolean(
                                        item.churnCaseId && item.status,
                                    );

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>
                                                    {item.studentName}
                                                </strong>
                                                <small>
                                                    {item.className ??
                                                        ([
                                                            item.schoolName,
                                                            item.grade,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" · ") ||
                                                            "반 미배정")}
                                                </small>
                                            </td>
                                            <td>
                                                {item.teacherName ?? "미지정"}
                                            </td>
                                            <td>{item.reason}</td>
                                            <td>
                                                {meta ? (
                                                    <StatusChip
                                                        tone={meta.tone}
                                                    >
                                                        {meta.label}
                                                    </StatusChip>
                                                ) : (
                                                    <StatusChip tone="neutral">
                                                        정상
                                                    </StatusChip>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.actionBtn}
                                                    disabled={
                                                        pending || !canAct
                                                    }
                                                    onClick={() =>
                                                        runAction(item)
                                                    }
                                                >
                                                    {actionLabel(item.status)}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}
