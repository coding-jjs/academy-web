/**
 * `/signup` 공개 가입 화면.
 *
 * 흐름: `auth()`로 세션만 보고 → 이미 온보딩이 끝난 계정이면 `/post-login`으로
 * redirect → 아니면 `SignupFlow`에 Google 폼 + 상세 입력을 넘긴다.
 * `requireRole`은 쓰지 않는다. GUEST·미로그인 모두 들어와야 한다.
 *
 * 데이터: 이 page는 `*data.ts`를 읽지 않는다. Google 버튼은
 * `signUpWithGoogle`(intent=signup), 상세 폼은 `SignupForm` → `completeSignup`.
 *
 * 의도적으로 하지 않는 일:
 * - 역할을 부여하지 않는다 → 원장 `assignUserRole`.
 * - 로그인 전용 Google(`signInWithGoogle`)을 쓰지 않는다. 미등록이면 가입을 막는다.
 *
 * `dynamic = force-dynamic`: 세션·온보딩 플래그가 빌드 캐시에 안 남게.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signUpWithGoogle } from "@/features/auth/actions";
import SignupFlow from "./SignupFlow";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

/**
 * Google 미완료면 1단계, 완료·온보딩 전이면 2단계 폼을 연다.
 * 온보딩이 끝난 세션은 역할 홈으로 보낸다.
 */
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
