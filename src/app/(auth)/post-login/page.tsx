import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHomePath } from "@/lib/role-routes";

export default async function PostLoginPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    redirect(getRoleHomePath(session.user.role));
}
