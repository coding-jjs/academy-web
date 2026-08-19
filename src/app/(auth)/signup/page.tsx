import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signUpWithGoogle } from "@/features/auth/actions";
import SignupFlow from "./SignupFlow";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
    const session = await auth();

    if (session?.user?.id && session.user.onboardingCompleted) {
        redirect("/post-login");
    }

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link href="/" className={styles.brand} aria-label="A학원 홈">
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </Link>

                <Link href="/login" className={styles.loginLink}>
                    이미 계정이 있으신가요? <strong>로그인</strong>
                </Link>
            </header>

            <div className={styles.content}>
                <SignupFlow
                    googleVerified={Boolean(session?.user?.id)}
                    googleSignInAction={signUpWithGoogle}
                />
            </div>
        </main>
    );
}
