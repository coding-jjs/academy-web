import { previewMetrics } from "@/lib/dummy-data";
import StatusChip from "@/components/ui/StatusChip";
import styles from "./WorkspaceScreen.module.css";

export default function WorkspaceScreen({
    eyebrow,
    title,
    description,
    action,
    compact = false,
}: {
    eyebrow: string;
    title: string;
    description: string;
    action?: string;
    compact?: boolean;
}) {
    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>{eyebrow}</span>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                {action && <button type="button">{action}</button>}
            </header>

            {!compact && (
                <div className={styles.metrics}>
                    {previewMetrics.map((metric, index) => (
                        <article key={metric.label}>
                            <StatusChip
                                tone={index === 0 ? "success" : "neutral"}
                            >
                                {metric.label}
                            </StatusChip>
                            <strong>{metric.value}</strong>
                            <p>{metric.detail}</p>
                        </article>
                    ))}
                </div>
            )}

            <div className={styles.grid}>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>최근 활동</h2>
                        <StatusChip tone="success">정상</StatusChip>
                    </div>
                    <ul>
                        <li>
                            <strong>김O진</strong>
                            <span>오늘 수업 일정이 등록되었습니다.</span>
                            <small>방금 전</small>
                        </li>
                        <li>
                            <strong>AI 리포트</strong>
                            <span>검토할 리포트가 준비되었습니다.</span>
                            <small>12분 전</small>
                        </li>
                        <li>
                            <strong>상담 문의</strong>
                            <span>새로운 문의가 접수되었습니다.</span>
                            <small>1시간 전</small>
                        </li>
                    </ul>
                </article>
                <article className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h2>오늘 일정</h2>
                        <StatusChip>7월 28일</StatusChip>
                    </div>
                    <div className={styles.schedule}>
                        <div>
                            <strong>16:30</strong>
                            <span>중2 수학 A</span>
                        </div>
                        <div>
                            <strong>18:10</strong>
                            <span>중2 영어 B</span>
                        </div>
                        <div>
                            <strong>19:50</strong>
                            <span>학부모 상담</span>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}
