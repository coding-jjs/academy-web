/**
 * 이탈 케이스 표 (서버 컴포넌트).
 *
 * props: cases, threshold, isPending, onAction.
 * 상태 전이·학부모 쪽지는 부모 Screen이 churn actions로 보낸다.
 */

import StatusChip from "@/components/ui/StatusChip"; // 의존성. 원장 Screen. layout requireRole DIRECTOR.
import { // 의존성. 원장 Screen. layout requireRole DIRECTOR.
    buttonStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    cx, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    emptyStateStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
    surfaceStyles, // 구문. 원장 Screen. layout requireRole DIRECTOR.
} from "@/components/ui/shared-styles"; // 원장 Screen. layout requireRole DIRECTOR.
import { CHURN_STATUS_METADATA, getChurnActionLabel } from "@/features/churn/presentation"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import type { ChurnThreshold, DirectorChurnCase } from "@/features/churn/types"; // features 데이터/액션. 원장 Screen. layout requireRole DIRECTOR.
import styles from "../DirectorChurnScreen.module.css"; // 이 화면 스타일. 로직을 바꾸지 않는다.

/** 임계값 바와 학생별 조치 버튼을 그린다. */
export default function ChurnCaseTable({ cases, threshold, isPending, onAction }: { cases: DirectorChurnCase[]; threshold: ChurnThreshold; isPending: boolean; onAction: (churnCase: DirectorChurnCase) => void }) { // 이 파일의 화면. 원장 Screen. layout requireRole DIRECTOR.
    return ( // JSX 반환. 원장 Screen. layout requireRole DIRECTOR.
        <div className={cx(surfaceStyles.root, styles.tablePanel)}>{/* 이탈 큐 표. 청구 정산 UI가 아니다. */}
            <div className={styles.thresholdBar}><StatusChip tone="neutral">기본값</StatusChip><span>출석 {threshold.attendanceDropPercentPoint}%p · 성적 {threshold.scoreDropPoints}점 · 결석 {threshold.consecutiveAbsences}회 · 미납 {threshold.unpaidDays}일</span></div>{/* 레이아웃 상자. */}
            {cases.length === 0 ? ( // 케이스 없음. 원생이 없으면 신호를 안 만든다.
                <div className={cx(emptyStateStyles.root, styles.emptyPanel)}><h2>등록된 학생이 없습니다</h2><p>학생이 등록되면 이탈 신호를 여기서 확인합니다.</p></div> // 레이아웃 상자.
            ) : ( // 조치 버튼은 부모 Screen이 churn actions로 보낸다.
                <div className={styles.tableWrap}><table><thead><tr><th>학생</th><th>담당</th><th>감지 사유</th><th>상태</th><th>조치</th></tr></thead><tbody>{cases.map((item) => { const metadata = item.status ? CHURN_STATUS_METADATA[item.status] : null; return <tr key={item.id}>{/* 레이아웃 상자. */}
                <td><strong>{item.studentName}</strong><small>{item.className ?? ([item.schoolName, item.grade].filter(Boolean).join(" · ") || "반 미배정")}</small></td><td>{item.teacherName ?? "미지정"}</td><td>{item.reason}</td><td>{metadata ? <StatusChip tone={metadata.tone}>{metadata.label}</StatusChip> : <StatusChip tone="neutral">정상</StatusChip>}</td><td><button type="button" className={cx(buttonStyles.action, styles.tableActionBtn)} disabled={isPending || !item.churnCaseId || !item.status} onClick={() => onAction(item)}>{getChurnActionLabel(item.status)}</button></td>{/* 칸. */}
            </tr>; })}</tbody></table></div> // tr 닫기.
            )}{/* 구문 끝. */}
        </div> // div 닫기.
    ); // 호출/그룹 끝.
} // 블록 끝.
