import WorkspaceScreen from "@/features/dashboard/WorkspaceScreen";

export default function DirectorStudentsPage() {
    return (
        <WorkspaceScreen
            eyebrow="STUDENTS"
            title="학생 관리"
            description="재원 상태, 반 배정, 출결과 학습 기록을 관리합니다."
            action="학생 등록"
        />
    );
}
