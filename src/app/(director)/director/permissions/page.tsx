import WorkspaceScreen from "@/features/dashboard/WorkspaceScreen";

export default function DirectorPermissionsPage() {
    return (
        <WorkspaceScreen
            eyebrow="PERMISSIONS"
            title="권한 관리"
            description="교사와 직원에게 필요한 기능만 안전하게 허용합니다."
            action="권한 설정"
        />
    );
}
