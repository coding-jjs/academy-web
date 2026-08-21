/**
 * `/login` 공개 로그인 화면.
 *
 * Google 버튼은 `signInWithGoogle`(intent=login)만 탄다. 미등록 이메일은
 * Unregistered로 돌아오고 신규 GUEST를 만들지 않는다. 가입은 `/signup`.
 *
 * `?error=` 쿼리: Unregistered / Blocked / CredentialsSignin / 기타.
 * ENABLE_DEV_LOGIN이면 @test.local ACTIVE 유저 목록을 select로 보여 준다.
 *
 * `dynamic = force-dynamic`: 테스트 계정 목록과 플래그가 빌드 캐시에 안 남게.
 */

import Link from "next/link";
import {
    buttonStyles,
    cx,
    fieldStyles,
    pageHeadingStyles,
    surfaceStyles,
    typographyStyles,
} from "@/components/ui/shared-styles";
import {
    DEV_LOGIN_ROLES,
    isDevLoginEnabled,
} from "@/lib/dev-login";
import {
    signInAsTestUser,
    signInWithGoogle,
} from "@/features/auth/actions";
import { getDevelopmentTestUsers } from "@/features/auth/data";
import { roleLabels } from "@/lib/role-routes";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

/**
 * 공개 `/login` 서버 페이지. `requireRole`은 쓰지 않는다 — 미로그인 진입이 전제다.
 *
 * @param searchParams Auth.js가 붙인 `?error=` 코드. 본문은 `getLoginErrorMessage`가 한글화한다.
 */
export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const params = await searchParams;
    const devLoginEnabled = isDevLoginEnabled();
    const testUsers = await getDevelopmentTestUsers();

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <Link href="/" className={styles.brand} aria-label="A학원 홈">
                    <span className={styles.brandMark}>A</span>
                    <strong>A학원</strong>
                </Link>
            </header>
            <section className={styles.loginArea}>
                <div className={cx(surfaceStyles.root, styles.loginCard)}>
                    <div className={styles.intro}>
                        <span className={pageHeadingStyles.eyebrow}>A ACADEMY</span>
                        <h1>A학원에 로그인</h1>
                        <p>
                            출결, 수업 일정, 학습 리포트를
                            <br />
                            한곳에서 편리하게 확인하세요.
                        </p>
                    </div>
                    {params.error && (
                        <p className={cx(typographyStyles.error, styles.error)} role="alert">
                            {getLoginErrorMessage(params.error)}
                        </p>
                    )}

                    <form action={signInWithGoogle}>
                        <button className={styles.googleButton} type="submit">
                            <GoogleMark />
                            <span>Google로 계속하기</span>
                        </button>
                    </form>
                    {devLoginEnabled && (
                        <section className={styles.devLogin}>
                            <div className={styles.divider}>
                                <span>개발 테스트</span>
                            </div>
                            <div className={styles.devLoginBox}>
                                <span className={styles.devBadge}>
                                    DEVELOPMENT ONLY
                                </span>
                                <h2>역할별 테스트 로그인</h2>
                                <p>
                                    테스트 계정을 선택하면 해당 역할의 화면으로
                                    바로 이동합니다.
                                </p>
                                {testUsers.length > 0 ? (
                                    <form action={signInAsTestUser}>
                                        <label className={cx(fieldStyles.root, styles.devField)}>
                                            <span>테스트 계정</span>
                                            <select className={fieldStyles.select} name="email" required defaultValue="">
                                                <option value="" disabled>
                                                    역할과 계정을 선택하세요
                                                </option>
                                                {DEV_LOGIN_ROLES.map((role) => {
                                                    const users = testUsers.filter(
                                                        (user) => user.role === role,
                                                    );
                                                    if (users.length === 0) return null;

                                                    return (
                                                        <optgroup
                                                            key={role}
                                                            label={roleLabels[role]}
                                                        >
                                                            {users.map((user) => (
                                                                <option
                                                                    key={user.email}
                                                                    value={user.email}
                                                                >
                                                                    {user.name} · {user.email}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })}
                                            </select>
                                        </label>
                                        <button
                                            type="submit"
                                            className={cx(buttonStyles.primaryLg, styles.devLoginButton)}
                                        >
                                            선택한 계정으로 로그인
                                        </button>
                                    </form>
                                ) : (
                                    <p className={styles.devEmpty}>
                                        활성 테스트 계정이 없습니다. 테스트 시드를 먼저
                                        생성해 주세요.
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    <p className={cx(typographyStyles.hint, styles.notice)}>
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

/** Auth.js / signIn 콜백이 붙인 error 코드를 한글 문장으로. 알 수 없는 코드는 범용 실패. */
function getLoginErrorMessage(error: string) {
    if (error === "Unregistered") {
        return "가입되지 않은 계정입니다. 회원가입을 진행해 주세요.";
    }
    if (error === "Blocked") {
        return "로그인할 수 없는 계정입니다. 학원에 문의해 주세요.";
    }
    return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

/** Google 브랜드 마크 SVG. 로고 클릭이 아니라 버튼 장식만. */
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
