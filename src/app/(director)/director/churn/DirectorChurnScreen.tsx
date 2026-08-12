"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChurnThreshold, DirectorChurnCase } from "@/features/churn/types";
import {
    advanceChurnCase,
    runChurnDetection,
    saveChurnThreshold,
    sendChurnParentNote,
} from "@/features/churn/actions";
import ChurnCaseTable from "./components/ChurnCaseTable";
import ChurnThresholdForm from "./components/ChurnThresholdForm";
import styles from "./DirectorChurnScreen.module.css";

export default function DirectorChurnScreen({ cases, threshold }: { cases: DirectorChurnCase[]; threshold: ChurnThreshold }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showThreshold, setShowThreshold] = useState(false);
    const statistics = useMemo(() => getChurnStatistics(cases), [cases]);

    function runAction(action: () => Promise<{ ok: boolean; message: string }>, onSuccess?: () => void) {
        setFeedback(null);
        startTransition(async () => { const result = await action(); setFeedback(result.message); if (result.ok) { onSuccess?.(); router.refresh(); } });
    }

    function handleCaseAction(item: DirectorChurnCase) {
        if (!item.churnCaseId || !item.status) return;
        const input = { churnCaseId: item.churnCaseId };
        runAction(() => item.status === "IMPROVED" || item.status === "WITHDRAWN" ? sendChurnParentNote(input) : advanceChurnCase(input));
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}><div><span>STUDENT CARE</span><h1>이탈 위험</h1><p>출결, 성적, 연속 결석과 미납 신호를 함께 확인합니다.</p></div><div className={styles.headerActions}><button type="button" className={styles.actionBtn} disabled={isPending} onClick={() => runAction(runChurnDetection)}>{isPending ? "감지 중…" : "이탈 감지 실행"}</button><button type="button" className={styles.thresholdBtn} disabled={isPending} onClick={() => setShowThreshold((visible) => !visible)}>임계값 설정</button></div></header>
            {showThreshold && <ChurnThresholdForm threshold={threshold} isPending={isPending} onSave={(input) => runAction(() => saveChurnThreshold(input), () => setShowThreshold(false))} />}
            <div className={styles.metrics}>{statistics.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><p>{item.detail}</p></article>)}</div>
            <ChurnCaseTable cases={cases} threshold={threshold} isPending={isPending} onAction={handleCaseAction} />
            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}

function getChurnStatistics(cases: DirectorChurnCase[]) {
    const counts = { DETECTED: 0, COUNSELING: 0, IMPROVED: 0 };
    for (const item of cases) if (item.status && item.status in counts) counts[item.status as keyof typeof counts] += 1;
    return [
        { label: "위험 감지", value: `${counts.DETECTED}명`, detail: "자동 규칙 충족" },
        { label: "상담 중", value: `${counts.COUNSELING}명`, detail: "담당 선생님 조치 중" },
        { label: "개선", value: `${counts.IMPROVED}명`, detail: "최근 처리" },
    ];
}
