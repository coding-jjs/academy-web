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

import Link from "next/link"; // 공개 홈·가입 링크. 역할 홈이 아니다.
import { // 공유 필드·버튼 스타일. 역할 셸 CSS가 아니다.
    buttonStyles, // 개발 로그인 제출 버튼.
    cx, // 클래스 결합.
    fieldStyles, // 테스트 계정 select.
    pageHeadingStyles, // 카드 eyebrow.
    surfaceStyles, // 로그인 카드 표면.
    typographyStyles, // 에러·안내 문장.
} from "@/components/ui/shared-styles"; // 로그인 카드용. AdminShell이 아니다.
import { // 개발 전용 시드 역할 목록.
    DEV_LOGIN_ROLES, // 역할별 optgroup 순서.
    isDevLoginEnabled, // ENABLE_DEV_LOGIN. 프로덕션에선 꺼진다.
} from "@/lib/dev-login"; // Google 가입과 별개.
import { // 로그인 Server Action. 신규 GUEST를 만들지 않는다.
    signInAsTestUser, // 시드 계정. Google OAuth가 아니다.
    signInWithGoogle, // intent=login. signup Google과 다르다.
} from "@/features/auth/actions"; // 미등록이면 Unregistered.
import { getDevelopmentTestUsers } from "@/features/auth/data"; // 활성 테스트 계정. Google 가입과 별개.
import { roleLabels } from "@/lib/role-routes"; // 한글 역할 라벨. 역할 부여 UI가 아니다.
import styles from "./page.module.css"; // 인증 카드. AdminShell/MemberShell 없음.

export const dynamic = "force-dynamic"; // 테스트 계정 목록과 플래그가 빌드 캐시에 안 남게.

/**
 * 공개 `/login` 서버 페이지. `requireRole`은 쓰지 않는다 — 미로그인 진입이 전제다.
 *
 * @param searchParams Auth.js가 붙인 `?error=` 코드. 본문은 `getLoginErrorMessage`가 한글화한다.
 */
export default async function LoginPage({ // 공개 `/login`. proxy matcher 밖. requireRole 없음.
    searchParams, // Auth.js가 붙인 ?error= 코드.
}: { // page props.
    searchParams: Promise<{ error?: string }>; // Unregistered / Blocked / CredentialsSignin 등.
}) { // LoginPage props 끝.
    const params = await searchParams; // Auth.js가 붙인 ?error= 코드.
    const devLoginEnabled = isDevLoginEnabled(); // ENABLE_DEV_LOGIN이면 @test.local 목록. 프로덕션에선 꺼진다.
    const testUsers = await getDevelopmentTestUsers(); // 활성 테스트 계정. Google 가입과 별개.

    return ( // 공개 로그인 카드. 역할 셸 없음. requireRole 없음.
        <main className={styles.page}>{/* 인증 화면. AdminShell/MemberShell 없음. */}
            <header className={styles.header}>{/* 공개 홈으로만. 역할 셸 없음. */}
                <Link href="/" className={styles.brand} aria-label="A학원 홈">{/* 공개 홈 /. 역할 홈이 아니다. */}
                    <span className={styles.brandMark}>A</span>{/* 브랜드 마크. */}
                    <strong>A학원</strong>{/* 학원 이름. */}
                </Link>{/* 홈 링크 끝. */}
            </header>{/* header 끝. */}

            <section className={styles.loginArea}>{/* 로그인 카드 영역. */}
                <div className={cx(surfaceStyles.root, styles.loginCard)}>{/* Google intent=login. 신규 GUEST를 만들지 않는다. */}
                    <div className={styles.intro}>{/* 로그인 카드 제목. */}
                        <span className={pageHeadingStyles.eyebrow}>A ACADEMY</span>{/* 영문 eyebrow. */}
                        <h1>A학원에 로그인</h1>{/* 카드 제목. 가입 폼이 아니다. */}
                        <p>{/* 로그인 안내. 업무 Screen이 아니다. */}
                            출결, 수업 일정, 학습 리포트를{/* 역할 홈에서 볼 내용. */}
                            <br />{/* 줄바꿈. */}
                            한곳에서 편리하게 확인하세요.{/* 공개 카피. */}
                        </p>{/* 안내 끝. */}
                    </div>{/* intro 끝. */}

                    {params.error && ( // Unregistered/Blocked 등. 가입은 /signup.
                        <p className={cx(typographyStyles.error, styles.error)} role="alert">{/* 한글 에러. 시크릿을 노출하지 않는다. */}
                            {getLoginErrorMessage(params.error)}{/* Unregistered면 가입 유도. */}
                        </p> // 에러 문장 끝.
                    )}{/* 구문 끝. */}

                    <form action={signInWithGoogle}>{/* Google 로그인. 미등록이면 Unregistered — 신규 GUEST를 만들지 않는다. */}
                        <button className={styles.googleButton} type="submit">{/* intent=login. signup Google과 다르다. */}
                            <GoogleMark />{/* 장식 SVG. 클릭 타깃은 버튼. */}
                            <span>Google로 계속하기</span>{/* 로그인용. 가입은 /signup. */}
                        </button>{/* Google 버튼 끝. */}
                    </form>{/* Google form 끝. */}

                    {devLoginEnabled && ( // 개발 전용. 시드 계정 select. Google과 별개.
                        <section className={styles.devLogin}>{/* ENABLE_DEV_LOGIN. 프로덕션에선 안 그린다. */}
                            <div className={styles.divider}>{/* 개발 구분선. */}
                                <span>개발 테스트</span>{/* 프로덕션 카피가 아니다. */}
                            </div>{/* divider 끝. */}
                            <div className={styles.devLoginBox}>{/* @test.local ACTIVE 유저. 역할 홈으로 바로 이동. */}
                                <span className={styles.devBadge}>{/* 개발 전용 뱃지. */}
                                    DEVELOPMENT ONLY{/* 프로덕션에선 이 블록 자체가 없다. */}
                                </span>{/* 뱃지 끝. */}
                                <h2>역할별 테스트 로그인</h2>{/* 시드 계정. 역할 부여 UI가 아니다. */}
                                <p>{/* 개발 안내. */}
                                    테스트 계정을 선택하면 해당 역할의 화면으로{/* /post-login과 같게 역할 홈으로. */}
                                    바로 이동합니다.{/* Google OAuth가 아니다. */}
                                </p>{/* 안내 끝. */}

                                {testUsers.length > 0 ? ( // 시드가 있으면 select. 없으면 개발 로그인을 막는다.
                                    <form action={signInAsTestUser}>{/* 테스트 계정 로그인. Google OAuth가 아니다. */}
                                        <label className={cx(fieldStyles.root, styles.devField)}>{/* 이메일 select. */}
                                            <span>테스트 계정</span>{/* 필드 라벨. */}
                                            <select className={fieldStyles.select} name="email" required defaultValue="">{/* 이메일로 시드 유저를 고른다. */}
                                                <option value="" disabled>{/* 미선택. 빈 제출을 막는다. */}
                                                    역할과 계정을 선택하세요{/* placeholder. */}
                                                </option>{/* placeholder 끝. */}
                                                {DEV_LOGIN_ROLES.map((role) => { // 역할별 optgroup. 실제 역할 부여 UI가 아니다.
                                                    const users = testUsers.filter( // 해당 역할 ACTIVE만.
                                                        (user) => user.role === role, // 역할 필터. 차단 계정은 data가 안 준다.
                                                    ); // 호출/그룹 끝.
                                                    if (users.length === 0) return null; // 그 역할 시드가 없으면 그룹을 숨긴다.

                                                    return ( // 역할 라벨 optgroup.
                                                        <optgroup // 한글 역할 라벨.
                                                            key={role} // AppRole.
                                                            label={roleLabels[role]} // 한글. 역할 부여 폼이 아니다.
                                                        >{/* optgroup 열기. */}
                                                            {users.map((user) => ( // 이메일 value. 비밀번호 없음.
                                                                <option // 시드 이메일.
                                                                    key={user.email} // 유니크 키.
                                                                    value={user.email} // signInAsTestUser가 이메일을 읽는다.
                                                                >{/* option 열기. */}
                                                                    {user.name} · {user.email}{/* 표시. 비밀번호 필드 없음. */}
                                                                </option> // option 끝.
                                                            ))}{/* 구문 끝. */}
                                                        </optgroup> // optgroup 끝.
                                                    ); // 호출/그룹 끝.
                                                })}{/* 구문 끝. */}
                                            </select>{/* select 끝. */}
                                        </label>{/* label 끝. */}
                                        <button // 선택한 시드 계정으로 세션. 가입이 아니다.
                                            type="submit" // 폼 제출.
                                            className={cx(buttonStyles.primaryLg, styles.devLoginButton)} // 개발 로그인 버튼.
                                        >{/* button 열기. */}
                                            선택한 계정으로 로그인{/* 역할 홈으로. Google이 아니다. */}
                                        </button>{/* 제출 버튼 끝. */}
                                    </form> // 테스트 로그인 form 끝.
                                ) : ( // 시드 없음.
                                    <p className={styles.devEmpty}>{/* 시드가 없으면 개발 로그인을 막는다. */}
                                        활성 테스트 계정이 없습니다. 테스트 시드를 먼저{/* 시드 스크립트 안내. */}
                                        생성해 주세요.{/* Google 가입이 아니다. */}
                                    </p> // 빈 안내 끝.
                                )}{/* 구문 끝. */}
                            </div>{/* devLoginBox 끝. */}
                        </section> // 개발 로그인 섹션 끝.
                    )}{/* 구문 끝. */}

                    <p className={cx(typographyStyles.hint, styles.notice)}>{/* 약관 동의 카피. */}
                        로그인하면 A학원의 서비스 이용약관과 개인정보 처리방침에{/* 공개 안내. */}
                        동의하게 됩니다.{/* 가입 약관과 같은 취지. */}
                    </p>{/* 약관 끝. */}

                    <p className={styles.signupPrompt}>{/* 로그인용 Google은 신규를 만들지 않으니 signup으로 보낸다. */}
                        처음 방문하셨나요?{/* 미등록 Unregistered와 같은 유도. */}
                        <Link href="/signup">회원가입</Link>{/* intent=signup. 로그인 Google이 아니다. */}
                    </p>{/* 가입 유도 끝. */}

                    <Link href="/" className={styles.backLink}>{/* 공개 홈. 역할 대시보드가 아니다. */}
                        메인으로 돌아가기{/* /guest가 아니라 공개 /. */}
                    </Link>{/* 홈 링크 끝. */}
                </div>{/* loginCard 끝. */}
            </section>{/* loginArea 끝. */}
        </main> // main 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.

/** Auth.js / signIn 콜백이 붙인 error 코드를 한글 문장으로. 알 수 없는 코드는 범용 실패. */
function getLoginErrorMessage(error: string) { // Unregistered/Blocked만 특수. 나머지는 범용.
    if (error === "Unregistered") { // 미가입. 로그인 Google은 GUEST를 만들지 않는다.
        return "가입되지 않은 계정입니다. 회원가입을 진행해 주세요."; // /signup 유도.
    } // 블록 끝.
    if (error === "Blocked") { // 차단 계정. 학원 문의.
        return "로그인할 수 없는 계정입니다. 학원에 문의해 주세요."; // 가입 재시도가 아니다.
    } // 블록 끝.
    return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요."; // CredentialsSignin 등 범용 실패.
} // 블록 끝.

/** Google 브랜드 마크 SVG. 로고 클릭이 아니라 버튼 장식만. */
function GoogleMark() { // 버튼 안 SVG. 클릭 타깃이 아니다.
    return ( // 버튼 안 SVG. 클릭 타깃이 아니다.
        <svg // Google 컬러 마크.
            className={styles.googleMark} // 버튼 왼쪽 장식.
            viewBox="0 0 24 24" // 24 아이콘.
            aria-hidden="true" // 버튼 텍스트가 이름. 마크는 장식.
        >{/* svg 열기. */}
            <path // 파랑.
                fill="#4285F4" // Google 블루.
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.4Z" // 오른쪽 파랑.
            />{/* 파랑 path 끝. */}
            <path // 초록.
                fill="#34A853" // Google 그린.
                d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" // 아래 초록.
            />{/* 초록 path 끝. */}
            <path // 노랑.
                fill="#FBBC05" // Google 옐로.
                d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z" // 왼쪽 노랑.
            />{/* 노랑 path 끝. */}
            <path // 빨강.
                fill="#EA4335" // Google 레드.
                d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" // 위 빨강.
            />{/* 빨강 path 끝. */}
        </svg> // svg 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
