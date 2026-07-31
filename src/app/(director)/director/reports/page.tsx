import WorkspaceScreen from "@/features/dashboard/WorkspaceScreen";

export default function DirectorReportsPage() {
    return (
        <WorkspaceScreen
            eyebrow="AI REPORT"
            title="리포트 승인"
            description="교사가 작성한 초안을 검토하고 학부모에게 발송합니다."
            action="선택 승인"
        />
    );
}
