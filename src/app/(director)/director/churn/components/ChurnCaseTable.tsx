"use client";

/**
 * 재원생 이탈 테이블. 케이스 없는 행도 "신호 없음"으로 남긴다.
 *
 * 호출: `DirectorChurnScreen`.
 * 배정은 담당 반 후보만. 확정/재상담은 PENDING_REVIEW만.
 */

import { useMemo, useState } from "react";
import StatusChip from "@/components/ui/StatusChip";
import {
    a11yStyles,
    buttonStyles,
    cx,
    emptyStateStyles,
    fieldStyles,
    surfaceStyles,
} from "@/components/ui/shared-styles";
import { formatAssigneeOption } from "@/features/churn/assignees";
import { CHURN_STATUS_METADATA } from "@/features/churn/presentation";
import type { DirectorChurnCase, ChurnThreshold } from "@/features/churn/types";
import styles from "../DirectorChurnScreen.module.css";

export default function ChurnCaseTable({
    cases,
    threshold,
    isPending,
    onAssign,
    onConfirm,
    onReturn,
}: {
    cases: DirectorChurnCase[];
    threshold: ChurnThreshold;
    isPending: boolean;
    onAssign: (churnCase: DirectorChurnCase, teacherUserId: string) => void;
    onConfirm: (churnCase: DirectorChurnCase) => void;
    onReturn: (churnCase: DirectorChurnCase) => void;
}) {
    return (
        <div className={cx(surfaceStyles.root, styles.tablePanel)}>
            <div className={styles.thresholdBar}>
                <StatusChip tone="neutral">기본값</StatusChip>
                <span>
                    출석 {threshold.attendanceDropPercentPoint}%p · 성적
                    {threshold.scoreDropPoints}점 · 결석
                    {threshold.consecutiveAbsences}회 · 미납
                    {threshold.unpaidDays}일
                </span>
            </div>
            {cases.length === 0 ? (
                <div className={cx(emptyStateStyles.root, styles.emptyPanel)}>
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
                                <th>상담 기록</th>
                                <th>상태</th>
                                <th>조치</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map((item) => {
                                const metadata = item.status
                                    ? CHURN_STATUS_METADATA[item.status]
                                    : null;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.studentName}</strong>
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
                                        <td>{item.teacherName ?? "미지정"}</td>
                                        <td>{item.reason}</td>
                                        <td>
                                            {item.latestMemo ? (
                                                <span className={styles.memoPreview}>
                                                    {item.latestMemo.content}
                                                </span>
                                            ) : (
                                                <small>기록 없음</small>
                                            )}
                                        </td>
                                        <td>
                                            {metadata ? (
                                                <StatusChip tone={metadata.tone}>
                                                    {metadata.label}
                                                </StatusChip>
                                            ) : (
                                                <StatusChip tone="neutral">
                                                    정상
                                                </StatusChip>
                                            )}
                                        </td>
                                        <td>
                                            <RowActions
                                                key={`${item.churnCaseId}:${item.assigneeUserId ?? ""}:${item.suggestedAssigneeUserId ?? ""}`}
                                                item={item}
                                                isPending={isPending}
                                                onAssign={onAssign}
                                                onConfirm={onConfirm}
                                                onReturn={onReturn}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function RowActions({
    item,
    isPending,
    onAssign,
    onConfirm,
    onReturn,
}: {
    item: DirectorChurnCase;
    isPending: boolean;
    onAssign: (churnCase: DirectorChurnCase, teacherUserId: string) => void;
    onConfirm: (churnCase: DirectorChurnCase) => void;
    onReturn: (churnCase: DirectorChurnCase) => void;
}) {
    const defaultAssigneeId = useMemo(() => {
        if (
            item.suggestedAssigneeUserId &&
            item.assignees.some(
                (assignee) => assignee.id === item.suggestedAssigneeUserId,
            )
        ) {
            return item.suggestedAssigneeUserId;
        }
        return item.assignees[0]?.id ?? "";
    }, [item.assignees, item.suggestedAssigneeUserId]);
    const [assigneeUserId, setAssigneeUserId] = useState(defaultAssigneeId);

    if (!item.churnCaseId || !item.status) {
        return <span className={styles.actionMuted}>—</span>;
    }

    if (item.status === "PENDING_REVIEW") {
        return (
            <div className={styles.actionStack}>
                <button
                    type="button"
                    className={cx(buttonStyles.primary, styles.tableActionBtn)}
                    disabled={isPending}
                    onClick={() => onConfirm(item)}
                >
                    개선 확정
                </button>
                <button
                    type="button"
                    className={cx(buttonStyles.secondary, styles.tableActionBtn)}
                    disabled={isPending}
                    onClick={() => onReturn(item)}
                >
                    재상담
                </button>
            </div>
        );
    }

    if (item.status === "DETECTED" || item.status === "COUNSELING") {
        if (item.assignees.length === 0) {
            return <small>담당 반 선생님이 없습니다</small>;
        }
        return (
            <div className={styles.actionStack}>
                <label className={cx(fieldStyles.root, styles.teacherSelect)}>
                    <span className={a11yStyles.srOnly}>담당자</span>
                    <select
                        value={assigneeUserId}
                        disabled={isPending}
                        onChange={(event) =>
                            setAssigneeUserId(event.target.value)
                        }
                    >
                        {item.assignees.map((assignee) => (
                            <option key={assignee.id} value={assignee.id}>
                                {formatAssigneeOption(assignee)}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    className={cx(buttonStyles.action, styles.tableActionBtn)}
                    disabled={isPending || !assigneeUserId}
                    onClick={() => onAssign(item, assigneeUserId)}
                >
                    {item.status === "COUNSELING" ? "담당 변경" : "상담 배정"}
                </button>
            </div>
        );
    }

    return <span className={styles.actionMuted}>—</span>;
}
