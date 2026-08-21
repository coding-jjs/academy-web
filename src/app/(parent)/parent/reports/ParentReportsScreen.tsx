"use client";

/**
 * 자녀에게 발송된 AI 리포트 본문 UI (클라이언트).
 *
 * props: childList(받은 리포트만), activeChildId.
 * 초안/반려는 page 데이터가 이미 걸렀다. 학부모가 교사 작성 과정을 보지 않게 한다.
 *
 * 자녀 전환은 child 쿠키. 승인·반려 Action은 없다 → 원장 DirectorReportsScreen.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StatusChip from "@/components/ui/StatusChip";
import type { ParentReportChild } from "@/features/reports/parent-types";
import styles from "./ParentReportsScreen.module.css";
import { writeParentChildCookie } from "@/features/families/parent-child-cooke";

/** 자녀 탭과 선택한 리포트 본문·이력을 그린다. */
export default function ParentReportsScreen({
    childList,
    activeChildId,
}: {
    childList: ParentReportChild[];
    activeChildId: string;
}) {
    const activeChild =
        childList.find((child) => child.id === activeChildId) ??
        childList[0] ??
        null;
    const [activeReportId, setActiveReportId] = useState<string | null>(
        activeChild?.reports[0]?.id ?? null,
    );
    const activeReport = useMemo(() => {
        if (!activeChild) return null;
        return (
            activeChild.reports.find(
                (report) => report.id === activeReportId,
            ) ??
            activeChild.reports[0] ??
            null
        );
    }, [activeChild, activeReportId]);

    const pastReports = useMemo(() => {
        if (!activeChild || !activeReport) return activeChild?.reports ?? [];
        return activeChild.reports.filter(
            (report) => report.id !== activeReport.id,
        );
    }, [activeChild, activeReport]);
    const router = useRouter();

    function selectChild(childId: string) {
        writeParentChildCookie(childId);
        router.replace(`/parent/reports?childId=${childId}`);
    }

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>AI REPORT</span>
                    <h1>학습 리포트</h1>
                    <p>선생님이 전한 자녀의 성장 기록을 확인합니다.</p>
                </div>
            </header>
            {childList.length === 0 ? (
                <div className={styles.emptyPanel}>
                    <h2>연결된 자녀가 없습니다</h2>
                    <p>
                        학원에서 학부모-학생 연결을 완료하면 이곳에 학습
                        리포트가 표시됩니다.
                    </p>
                </div>
            ) : (
                <>
                    {childList.length > 1 && (
                        <div className={styles.childTabs} role="tablist">
                            {childList.map((child) => (
                                <button
                                    key={child.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={child.id === activeChildId}
                                    className={
                                        child.id === activeChildId
                                            ? styles.activeTab
                                            : undefined
                                    }
                                    onClick={() => selectChild(child.id)}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {!activeReport ? (
                        <div className={styles.emptyPanel}>
                            <h2>아직 받은 리포트가 없습니다</h2>
                            <p>
                                선생님이 작성하고 원장 승인 후 발송되면 여기에서
                                확인할 수 있습니다.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.content}>
                            <article className={styles.hero}>
                                <StatusChip tone="success">
                                    {formatPeriodLabel(
                                        activeReport.periodStart,
                                        activeReport.periodEnd,
                                    )}
                                    리포트
                                </StatusChip>
                                <h2>
                                    {activeChild?.className
                                        ? `${activeChild.className} 학습 보고서`
                                        : `${activeChild?.name} 학습 보고서`}
                                </h2>
                                <p>{activeReport.content || "(내용 없음)"}</p>
                                <div className={styles.heroMeta}>
                                    <span>
                                        {activeReport.teacherName}
                                        {activeReport.sentAt
                                            ? ` · ${formatDate(activeReport.sentAt)}`
                                            : ""}
                                    </span>
                                    <StatusChip
                                        tone={
                                            activeReport.parentReadAt
                                                ? "neutral"
                                                : "warning"
                                        }
                                    >
                                        {activeReport.parentReadAt
                                            ? "읽음"
                                            : "새 리포트"}
                                    </StatusChip>
                                </div>
                            </article>
                            {activeReport.keywords.length > 0 && (
                                <article className={styles.panel}>
                                    <h3>평가 키워드</h3>
                                    <ul className={styles.keywordList}>
                                        {activeReport.keywords.map(
                                            (keyword) => (
                                                <li key={keyword}>{keyword}</li>
                                            ),
                                        )}
                                    </ul>
                                </article>
                            )}

                            <article className={styles.panel}>
                                <div className={styles.panelHead}>
                                    <h3>지난 보고서</h3>
                                    <StatusChip>
                                        {pastReports.length}건
                                    </StatusChip>
                                </div>
                                {pastReports.length === 0 ? (
                                    <p className={styles.empty}>
                                        이전 보고서가 없습니다.
                                    </p>
                                ) : (
                                    <ul className={styles.reportList}>
                                        {pastReports.map((report) => (
                                            <li key={report.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveReportId(
                                                            report.id,
                                                        )
                                                    }
                                                >
                                                    <span>
                                                        <strong>
                                                            {formatPeriodLabel(
                                                                report.periodStart,
                                                                report.periodEnd,
                                                            )}
                                                            학습 보고서
                                                        </strong>
                                                        <small>
                                                            {report.teacherName}
                                                        </small>
                                                    </span>
                                                    <span>보기</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

/** 리포트 기간을 KST 월 라벨로. */
function formatPeriodLabel(startIso: string, endIso: string) {
    const end = new Date(endIso);
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "long",
    }).format(end);
}

/** ISO를 KST 월/일 짧은 표시로. */
function formatDate(iso: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
        day: "numeric",
    }).format(new Date(iso));
}
