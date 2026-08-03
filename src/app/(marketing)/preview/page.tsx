import type { Metadata } from "next";
import AcademyWireframe from "@/features/wireframe/AcademyWireframe";

export const metadata: Metadata = {
    title: "미리보기 · A학원",
    description: "원장·교사·학부모·학생·게스트 역할별 화면 와이어프레임 미리보기",
};

export default function PreviewPage() {
    return (
        <AcademyWireframe
            initialRole="director"
            showPreviewControls={true}
        />
    );
}