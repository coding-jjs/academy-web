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

import Link from "next/link"; // 공개 홈·로그인 링크. 역할 홈이 아니다.
import { redirect } from "next/navigation"; // 온보딩 끝난 세션은 /post-login. 가입 화면에 두지 않는다.
import { auth } from "@/lib/auth"; // JWT만. requireRole 없음 — GUEST·미로그인 진입.
import { signUpWithGoogle } from "@/features/auth/actions"; // intent=signup. 로그인용 signInWithGoogle이 아니다.
import SignupFlow from "./SignupFlow"; // 1단계 Google 또는 2단계 상세 폼.
import styles from "./page.module.css"; // 인증 카드. AdminShell 없음.

export const dynamic = "force-dynamic"; // 세션·온보딩 플래그가 빌드 캐시에 안 남게.

/**
 * Google 미완료면 1단계, 완료·온보딩 전이면 2단계 폼을 연다.
 * 온보딩이 끝난 세션은 역할 홈으로 보낸다.
 */
export default async function SignupPage() { // 공개 `/signup`. proxy matcher 밖. requireRole 없음.
    const session = await auth(); // 온보딩 끝난 계정은 가입 화면에 두지 않는다.

    if (session?.user?.id && session.user.onboardingCompleted) { // 끝난 GUEST/역할 계정은 /post-login.
        redirect("/post-login"); // 역할 홈 분기. 가입 폼을 다시 열지 않는다.
    } // 블록 끝.

    return ( // Google 1단계 또는 상세 폼. 역할 부여는 원장 몫.
        <main className={styles.page}>{/* 인증 카드. AdminShell 없음. */}
            <header className={styles.header}>{/* 브랜드 + 이미 계정 있으면 로그인. */}
                <Link href="/" className={styles.brand} aria-label="A학원 홈">{/* 공개 홈. 역할 홈이 아니다. */}
                    <span className={styles.brandMark}>A</span>{/* 브랜드 마크. */}
                    <strong>A학원</strong>{/* 학원 이름. */}
                </Link>{/* 홈 링크 끝. */}

                <Link href="/login" className={styles.loginLink}>{/* 로그인용 Google은 신규를 만들지 않는다. */}
                    이미 계정이 있으신가요? <strong>로그인</strong>{/* /login. 가입 폼이 아니다. */}
                </Link>{/* 로그인 링크 끝. */}
            </header>{/* header 끝. */}

            <div className={styles.content}>{/* SignupFlow에 Google 검증 여부만. */}
                <SignupFlow // 1단계 signUpWithGoogle(intent=signup). 로그인용 signInWithGoogle이 아니다.
                    googleVerified={Boolean(session?.user?.id)} // 세션 있으면 2단계. 없으면 Google 버튼.
                    googleSignInAction={signUpWithGoogle} // intent=signup. 미등록 로그인을 막지 않는다 — 가입이 목적.
                />{/* SignupFlow 끝. */}
            </div>{/* content 끝. */}
        </main> // main 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
