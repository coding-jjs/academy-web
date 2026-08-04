import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/role-routes";

export default async function PostLoginPage() {
    const session = await auth();

    // 세션이 없으면 로그인 화면으로 이동
    if (!session?.user) {
        redirect("/login");
    }

    redirect(getRoleHomePath(session.user.role));
}
