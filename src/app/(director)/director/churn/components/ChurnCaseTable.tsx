import StatusChip from "@/components/ui/StatusChip";
import { CHURN_STATUS_METADATA, getChurnActionLabel } from "@/features/churn/presentation";
import type { ChurnThreshold, DirectorChurnCase } from "@/features/churn/types";
import styles from "../DirectorChurnScreen.module.css";

export default function ChurnCaseTable({ cases, threshold, isPending, onAction }: { cases: DirectorChurnCase[]; threshold: ChurnThreshold; isPending: boolean; onAction: (churnCase: DirectorChurnCase) => void }) {
    return (
        <div className={styles.tablePanel}>
            <div className={styles.thresholdBar}><StatusChip tone="neutral">기본값</StatusChip><span>출석 {threshold.attendanceDropPercentPoint}%p · 성적 {threshold.scoreDropPoints}점 · 결석 {threshold.consecutiveAbsences}회 · 미납 {threshold.unpaidDays}일</span></div>
            {cases.length === 0 ? <div className={styles.emptyPanel}><h2>등록된 학생이 없습니다</h2><p>학생이 등록되면 이탈 신호를 여기서 확인합니다.</p></div> : <div className={styles.tableWrap}><table><thead><tr><th>학생</th><th>담당</th><th>감지 사유</th><th>상태</th><th>조치</th></tr></thead><tbody>{cases.map((item) => { const metadata = item.status ? CHURN_STATUS_METADATA[item.status] : null; return <tr key={item.id}>
                <td><strong>{item.studentName}</strong><small>{item.className ?? ([item.schoolName, item.grade].filter(Boolean).join(" · ") || "반 미배정")}</small></td><td>{item.teacherName ?? "미지정"}</td><td>{item.reason}</td><td>{metadata ? <StatusChip tone={metadata.tone}>{metadata.label}</StatusChip> : <StatusChip tone="neutral">정상</StatusChip>}</td><td><button type="button" className={styles.actionBtn} disabled={isPending || !item.churnCaseId || !item.status} onClick={() => onAction(item)}>{getChurnActionLabel(item.status)}</button></td>
            </tr>; })}</tbody></table></div>}
        </div>
    );
}
