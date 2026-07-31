import WorkspaceScreen from "@/features/dashboard/WorkspaceScreen";

export default function DirectorChurnPage() {
    return (
        <WorkspaceScreen
            eyebrow="STUDENT CARE"
            title="이탈 위험"
            description="출결, 성적, 연속 결석과 미납 신호를 함께 확인합니다."
            action="임계값 설정"
        />
    );
}
