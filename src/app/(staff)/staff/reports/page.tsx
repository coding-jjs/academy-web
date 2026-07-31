import WorkspaceScreen from "@/features/dashboard/WorkspaceScreen";

export default function StaffReportsPage() {
    return (
        <WorkspaceScreen
            eyebrow="AI REPORT"
            title="AI 리포트 작성"
            description="학습 기록을 바탕으로 리포트 초안을 만들고 검토합니다."
            action="새 리포트"
        />
    );
}
