import type { Metadata } from "next";
import HomeScreen from "@/features/home/HomeScreen";
import { auth } from "@/lib/auth";
import { getRoleHomePath, roleLabels } from "@/lib/role-routes";

export const metadata: Metadata = {
    title: "A학원 · 배움의 흐름을 함께",
    description:
        "수업, 기록, 상담을 연결해 학생의 성장을 함께 만드는 A학원입니다.",
};

export default async function HomePage() {
    const session = await auth();
    const user = session?.user;

    return (
        <HomeScreen
            viewer={
                user
                    ? {
                          name: user.name?.trim() || user.email || "사용자",
                          roleLabel: roleLabels[user.role],
                          dashboardHref: getRoleHomePath(user.role),
                      }
                    : null
            }
        />
    );
}
