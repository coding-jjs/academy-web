"use client"; // 클라이언트 컴포넌트. 서버 data 로더가 아니다.

/**
 * 원장 이탈 징후 화면 (클라이언트).
 *
 * `/director/churn`. 임계값 저장 `saveChurnThreshold`, 스캔 `runChurnDetection`,
 * 상태 전이 `advanceChurnCase`, 학부모 쪽지 `sendChurnParentNote`.
 *
 * props: cases, threshold — churn data.
 * 미납 일수는 임계값에 있지만 청구 정산 UI는 아직 없다.
 */

import { useMemo, useState, useTransition } from "react"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { useRouter } from "next/navigation"; // redirect/router. data 쓰기가 아니다.
import type { ChurnThreshold, DirectorChurnCase } from "@/features/churn/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    advanceChurnCase, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    runChurnDetection, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    saveChurnThreshold, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    sendChurnParentNote, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/features/churn/actions"; // 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    fieldStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    pageHeadingStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    screenStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import ChurnCaseTable from "./components/ChurnCaseTable"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import ChurnThresholdForm from "./components/ChurnThresholdForm"; // 같은 라우트 모듈. 원장 Screen. layout requireRole DIRECTOR.
import styles from "./DirectorChurnScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 감지 실행·임계값 폼·케이스 표를 묶는다. */
export default function DirectorChurnScreen({ cases, threshold }: { cases: DirectorChurnCase[]; threshold: ChurnThreshold }) { // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    const router = useRouter(); // 성공 후 refresh. 역할을 바꾸지 않는다.
    const [isPending, startTransition] = useTransition(); // pending. 중복 제출을 막는다.
    const [feedback, setFeedback] = useState<string | null>(null); // Action 결과 안내. JWT를 여기서 안 갱신한다.
    const [showThreshold, setShowThreshold] = useState(false); // 이탈 큐. 청구 정산 UI가 아니다.
    const statistics = useMemo(() => getChurnStatistics(cases), [cases]); // 감지·상담 중·개선 건수.

    function runAction(action: () => Promise<{ ok: boolean; message: string }>, onSuccess?: () => void) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        setFeedback(null); // 감지/저장/전이/쪽지. 성공이면 refresh.
        startTransition(async () => { const result = await action(); setFeedback(result.message); if (result.ok) { onSuccess?.(); router.refresh(); } }); // 전환. 권한 키를 바꾸지 않는다.
    } // 블록 끝.

    function handleCaseAction(item: DirectorChurnCase) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
        if (!item.churnCaseId || !item.status) return; // 분기. 원장 Screen. layout requireRole DIRECTOR.
        const input = { churnCaseId: item.churnCaseId }; // 원장 Screen. layout requireRole DIRECTOR.
        runAction(() => item.status === "IMPROVED" || item.status === "WITHDRAWN" ? sendChurnParentNote(input) : advanceChurnCase(input)); // 개선·퇴원이면 학부모 쪽지, 아니면 다음 상태.
    } // 블록 끝.

    return ( // 이탈 큐. 청구 정산 UI가 아니다.
        <section className={screenStyles.animatedPage}>{/* 이탈 큐. 청구 정산 UI가 아니다. */}
            <header className={pageHeadingStyles.root}><div><span className={pageHeadingStyles.eyebrow}>STUDENT CARE</span><h1>이탈 위험</h1><p>출결, 성적, 연속 결석과 미납 신호를 함께 확인합니다.</p></div><div className={styles.headerActions}><button type="button" className={cx(buttonStyles.primary, styles.toolbarBtn)} disabled={isPending} onClick={() => runAction(runChurnDetection)}>{isPending ? "감지 중…" : "이탈 감지 실행"}</button><button type="button" className={cx(buttonStyles.secondary, styles.toolbarBtn)} disabled={isPending} onClick={() => setShowThreshold((visible) => !visible)}>임계값 설정</button></div></header>{/* 감지 실행 + 임계값 토글. 미납 일수는 있어도 정산 UI는 없다. */}
            {showThreshold && <ChurnThresholdForm threshold={threshold} isPending={isPending} onSave={(input) => runAction(() => saveChurnThreshold(input), () => setShowThreshold(false))} />}{/* 임계값. 청구 정산은 연결하지 않는다. */}
            <div className={styles.metrics}>{statistics.map((item) => <article key={item.label} className={surfaceStyles.root}><span>{item.label}</span><strong>{item.value}</strong><p>{item.detail}</p></article>)}</div>{/* 케이스 건수 카드 */}
            <ChurnCaseTable cases={cases} threshold={threshold} isPending={isPending} onAction={handleCaseAction} />{/* 이탈 케이스 표 */}
            {feedback && <p className={styles.feedback}>{feedback}</p>}{/* 원장 Screen. layout requireRole DIRECTOR. */}
        </section> // section 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** 감지·상담 중·개선 건수를 카드용으로 집계한다. */
function getChurnStatistics(cases: DirectorChurnCase[]) { // 로컬 헬퍼. 원장 Screen. layout requireRole DIRECTOR.
    const counts = { DETECTED: 0, COUNSELING: 0, IMPROVED: 0 }; // 감지·상담 중·개선만. 미납 정산은 없다.
    for (const item of cases) if (item.status && item.status in counts) counts[item.status as keyof typeof counts] += 1; // 반복. 조회 범위를 넓히지 않는다.
    return [ // 반환. 원장 Screen. layout requireRole DIRECTOR.
        { label: "위험 감지", value: `${counts.DETECTED}명`, detail: "자동 규칙 충족" }, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        { label: "상담 중", value: `${counts.COUNSELING}명`, detail: "담당 선생님 조치 중" }, // 구문. 원장 Screen. layout requireRole DIRECTOR.
        { label: "개선", value: `${counts.IMPROVED}명`, detail: "최근 처리" }, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    ]; // 원장 Screen. layout requireRole DIRECTOR.
} // 블록 끝.
