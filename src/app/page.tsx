import AcademyWireframe from "@/features/wireframe/AcademyWireframe";

export default function LandingPage() {
    return (
        <AcademyWireframe
            initialRole="guest"
            initialScreenId="landing"
            showPreviewControls={false}
        />
    );
}
