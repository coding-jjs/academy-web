/**
 * 원장·교사·직원 공통 크롬.
 * 역할 내비 + 챗봇 + 로그아웃을 한곳에 모아 업무 페이지는 children만 그리게 한다.
 *
 * 호출: `(director|teacher|employee)/layout.tsx`가 `requireRole` 이후 이 셸을 씌운다.
 * 서버 컴포넌트. `auth()`로 이름만 읽고, 역할 가드는 레이아웃이 이미 끝낸 상태다.
 *
 * 읽기 전용 UI. 메뉴는 `roleNavigation`, 라벨은 `adminRoleLabels`.
 * STAFF의 role prefix는 `employee` — DB enum과 URL이 다르다.
 *
 * 의도적으로 하지 않는 일:
 * - 권한 키로 메뉴를 숨기지 않는다. billing이 꺼진 직원도 링크는 보이고, 페이지가 막는다.
 * - 학부모/학생 셸을 겸하지 않는다 → `MemberShell`.
 * - 세션이 없을 때 로그인 링크를 그려 두지만, 정상 레이아웃에선 requireRole이 먼저 redirect한다.
 *
 * 관련: `MemberShell.tsx`, `navigation.ts`, `role-routes.ts`, `ChatbotWidget`.
 */

import Link from "next/link"; // 브랜드 홈 `/`. 역할 홈은 getRoleHomePath.
import type { ReactNode } from "react"; // page.tsx Screen.
import { roleNavigation } from "@/lib/navigation"; // 역할 단위 고정. grant로 숨기지 않는다.
import { adminRoleLabels } from "@/lib/role-routes"; // employee → 직원. DB enum STAFF.
import type { RolePrefix } from "@/types/roles"; // director/teacher/employee만.
import { auth } from "@/lib/auth"; // 이름만. 역할 가드는 layout requireRole.
import ChatbotWidget from "@/features/chatbot/ChatbotWidget"; // 세션이 있을 때만. 역할 컨텍스트.
import NavLink from "./NavLink"; // 클라이언트 경로 강조. 셸은 서버.
import styles from "./Shells.module.css"; // 업무 크롬. Screen 토큰은 shared-styles.
import LogoutButton from "../auth/LogoutButton"; // Server Action. 확인 모달 없음.

/**
 * 업무 역할 레이아웃 뼈대.
 *
 * @param role URL prefix. `employee`여야 STAFF 메뉴가 나온다 (teacher가 아님).
 */
export default async function AdminShell({ // 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김.
    role, // director/teacher/employee. STAFF는 employee.
    children, // page.tsx Screen. 도메인 쿼리는 data.ts.
}: { // 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김.
    role: Extract<RolePrefix, "director" | "teacher" | "employee">; // MemberShell과 겸하지 않는다.
    children: ReactNode; // requireRole 이후. JWT 옛 role은 layout이 DB로 덮음.
}) { // 권한 키로 메뉴를 숨기지 않는다.
    const session = await auth(); // 이름은 여기만 읽는다. 역할 가드는 레이아웃의 requireRole이 이미 끝냈다.
    const roleLabel = adminRoleLabels[role]; // employee → 직원. DB enum STAFF와 URL을 맞춘다.
    const userName = session?.user?.name ?? roleLabel; // JWT 이름. 없으면 역할 라벨.

    return ( // 업무 페이지는 children만. billing 메뉴는 직원에게 보이고 페이지가 막는다.
        <div className={styles.adminPage}> {/* 원장·교사·직원 공통 크롬. 학부모는 MemberShell. */}
            <header className={styles.adminHeader}> {/* 브랜드 + 이름/로그아웃. 세션이 없으면 로그인 링크(정상 경로에선 redirect됨). */}
                <Link href="/" className={styles.brand}> {/* 소개 홈. 역할 홈은 post-login. */}
                    <span>A</span> {/* 브랜드 마크. */}
                    <div> {/* 학원명 + 역할 페이지. */}
                        <strong>A학원</strong> {/* 브랜드. */}
                        <small>{roleLabel} 페이지</small> {/* 원장/선생님/직원. */}
                    </div> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                </Link> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                <div className={styles.headerTools}> {/* 이름·로그아웃. 권한 키는 안 보여 준다. */}
                    {session?.user ? ( // 로그인된 원장·교사·직원만 이름과 로그아웃.
                        <> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                            <span className={styles.userName}> {/* JWT 이름. requireRole이 id/role을 DB로 덮음. */}
                                {userName} {roleLabel} {/* 이름 + 역할. */}
                            </span> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                            <LogoutButton className={styles.logoutButton} /> {/* 학원 PC 공유를 빨리 끊는다. */}
                        </> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                    ) : ( // 분기. 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김.
                        <Link href="/login" className={styles.sessionLink}> {/* 정상 레이아웃에선 requireRole이 먼저 /login. */}
                            로그인 {/* 정상 레이아웃에선 requireRole이 먼저 /login. */}
                        </Link> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                    )}
                </div> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
            </header> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
            <div className={styles.adminBody}> {/* 사이드바 + 본문. */}
                <aside className={styles.sidebar}> {/* 권한 키로 메뉴를 숨기지 않는다. billing이 꺼져도 링크는 보이고 페이지가 막는다. */}
                    <nav aria-label={`${roleLabel} 메뉴`}> {/* 접근성 라벨. 아이콘은 aria-hidden. */}
                        {roleNavigation[role].map((item) => ( // 역할 단위 고정. grant를 여기서 보지 않는다.
                            <NavLink item={item} key={item.href} /> /* 경로 강조. 권한 키 없음. */
                        ))}
                    </nav> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                </aside> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
                <main className={styles.adminContent}>{children}</main> {/* page.tsx Screen. 도메인 쿼리는 data.ts. */}
            </div> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
            {session?.user ? <ChatbotWidget role={role} /> : null} {/* 세션이 있을 때만. 프롬프트에 역할 컨텍스트를 실어 원장/교사 답변을 가른다. */}
        </div> {/* 원장·교사·직원 크롬. 메뉴는 권한 키로 안 숨김. */}
    );
}
