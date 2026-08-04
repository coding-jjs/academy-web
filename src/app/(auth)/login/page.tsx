import Link from "next/link";
import { signIn } from "@/lib/auth";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const params = await searchParams;

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link href="/" className={styles.brand} aria-label="A학원 홈">
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </Link>
            </header>

            <section className={styles.loginArea}>
                <div className={styles.loginCard}>
                    <div className={styles.intro}>
                        <span className={styles.eyebrow}>A ACADEMY</span>
                        <h1>A학원에 로그인</h1>
                        <p>
                            출결, 수업 일정, 학습 리포트를
                            <br />
                            한곳에서 편리하게 확인하세요.
                        </p>
                    </div>

                    {params.error && (
                        <p className={styles.error} role="alert">
                            로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.
                        </p>
                    )}

                    <form
                        action={async () => {
                            "use server";
                            await signIn("google", {
                                redirectTo: "/post-login",
                            });
                        }}
                    >
                        <button className={styles.googleButton} type="submit">
                            <GoogleMark />
                            <span>Google로 계속하기</span>
                        </button>
                    </form>

                    <p className={styles.notice}>
                        로그인하면 A학원의 서비스 이용약관과 개인정보 처리방침에
                        동의하게 됩니다.
                    </p>

                    <p className={styles.signupPrompt}>
                        처음 방문하셨나요?
                        <Link href="/signup">회원가입</Link>
                    </p>

                    <Link href="/" className={styles.backLink}>
                        메인으로 돌아가기
                    </Link>
                </div>
            </section>
        </main>
    );
}

function GoogleMark() {
    return (
        <svg
            className={styles.googleMark}
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.4Z"
            />
            <path
                fill="#34A853"
                d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
            />
            <path
                fill="#FBBC05"
                d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
            />
            <path
                fill="#EA4335"
                d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
            />
        </svg>
    );
}
