"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 원장 이탈 징후 화면 (클라이언트).
 *
 * `/director/churn`. 임계값 `saveChurnThreshold`, 스캔 `runChurnDetection`,
 * 배정 `assignChurnCounseling`, 확정 `confirmChurnImproved`,
 * 재상담 `returnChurnToCounseling`.
 *
 * props: cases, threshold — churn data.
 * 미납 일수는 임계값에 있지만 청구 정산 UI는 아직 없다.
 * 학부모 쪽지는 이 화면에서 보내지 않는다.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
    ChurnThreshold,
    DirectorChurnCase,
} from "@/features/churn/types";
import {
    assignChurnCounseling,
    confirmChurnImproved,
    returnChurnToCounseling,
    runChurnDetection,
    saveChurnThreshold,
} from "@/features/churn/actions";
import {
    buttonStyles,
    cx,
    pageHeadingStyles,
    screenStyles,
    surfaceStyles,
} from "@/components/ui/shared-styles";
import ChurnCaseTable from "./components/ChurnCaseTable";
import ChurnThresholdForm from "./components/ChurnThresholdForm";
import styles from "./DirectorChurnScreen.module.css";

export default function DirectorChurnScreen({
    cases,
    threshold,
}: {
    cases: DirectorChurnCase[];
    threshold: ChurnThreshold;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showThreshold, setShowThreshold] = useState(false);
    const statistics = useMemo(() => getChurnStatistics(cases), [cases]);

    function runAction(
        action: () => Promise<{ ok: boolean; message: string }>,
        onSuccess?: () => void,
    ) {
        setFeedback(null);
        startTransition(async () => {
            const result = await action();
            setFeedback(result.message);
            if (result.ok) {
                onSuccess?.();
                router.refresh();
            }
        });
    }

    return (
        <section className={screenStyles.animatedPage}>
            <header className={pageHeadingStyles.root}>
                <div>
                    <span className={pageHeadingStyles.eyebrow}>STUDENT CARE</span>
                    <h1>이탈 위험</h1>
                    <p>
                        담당 반 선생님·직원에게 상담을 맡기고, 기록을 확인한 뒤
                        개선을 확정합니다.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={cx(buttonStyles.primary, styles.toolbarBtn)}
                        disabled={isPending}
                        onClick={() => runAction(runChurnDetection)}
                    >
                        {isPending ? "감지 중…" : "이탈 감지 실행"}
                    </button>
                    <button
                        type="button"
                        className={cx(buttonStyles.secondary, styles.toolbarBtn)}
                        disabled={isPending}
                        onClick={() =>
                            setShowThreshold((visible) => !visible)
                        }
                    >
                        임계값 설정
                    </button>
                </div>
            </header>
            {showThreshold && (
                <ChurnThresholdForm
                    threshold={threshold}
                    isPending={isPending}
                    onSave={(input) =>
                        runAction(
                            () => saveChurnThreshold(input),
                            () => setShowThreshold(false),
                        )
                    }
                />
            )}
            <div className={styles.metrics}>
                {statistics.map((item) => (
                    <article key={item.label} className={surfaceStyles.root}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.detail}</p>
                    </article>
                ))}
            </div>
            <ChurnCaseTable
                cases={cases}
                threshold={threshold}
                isPending={isPending}
                onAssign={(item, teacherUserId) =>
                    item.churnCaseId
                        ? runAction(() =>
                              assignChurnCounseling({
                                  churnCaseId: item.churnCaseId!,
                                  teacherUserId,
                              }),
                          )
                        : undefined
                }
                onConfirm={(item) =>
                    item.churnCaseId
                        ? runAction(() =>
                              confirmChurnImproved({
                                  churnCaseId: item.churnCaseId!,
                              }),
                          )
                        : undefined
                }
                onReturn={(item) =>
                    item.churnCaseId
                        ? runAction(() =>
                              returnChurnToCounseling({
                                  churnCaseId: item.churnCaseId!,
                              }),
                          )
                        : undefined
                }
            />
            {feedback && <p className={styles.feedback}>{feedback}</p>}
        </section>
    );
}

function getChurnStatistics(cases: DirectorChurnCase[]) {
    const counts = { DETECTED: 0, COUNSELING: 0, PENDING_REVIEW: 0 };
    for (const item of cases) {
        if (item.status && item.status in counts) {
            counts[item.status as keyof typeof counts] += 1;
        }
    }
    return [
        {
            label: "위험 감지",
            value: `${counts.DETECTED}명`,
            detail: "담당자 배정 필요",
        },
        {
            label: "상담 중",
            value: `${counts.COUNSELING}명`,
            detail: "담당자 기록 대기",
        },
        {
            label: "검토 대기",
            value: `${counts.PENDING_REVIEW}명`,
            detail: "원장 확인 필요",
        },
    ];
}
