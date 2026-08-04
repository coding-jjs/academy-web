import type { Metadata } from "next";
import HomeScreen from "@/features/home/HomeScreen";

export const metadata: Metadata = {
    title: "A학원 · 배움의 흐름을 함께",
    description:
        "수업, 기록, 상담을 연결해 학생의 성장을 함께 만드는 A학원입니다.",
};

export default function HomePage() {
    return <HomeScreen />;
}
