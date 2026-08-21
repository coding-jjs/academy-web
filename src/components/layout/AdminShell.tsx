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

import Link from "next/link";
import type { ReactNode } from "react";
import { roleNavigation } from "@/lib/navigation";
import { adminRoleLabels } from "@/lib/role-routes";
import type { RolePrefix } from "@/types/roles";
import { auth } from "@/lib/auth";
import ChatbotWidget from "@/features/chatbot/ChatbotWidget";
import NavLink from "./NavLink";
import styles from "./Shells.module.css";
import LogoutButton from "../auth/LogoutButton";

/**
 * 업무 역할 레이아웃 뼈대.
 *
 * @param role URL prefix. `employee`여야 STAFF 메뉴가 나온다 (teacher가 아님).
 */
export default async function AdminShell({
    role,
    children,
}: {
    role: Extract<RolePrefix, "director" | "teacher" | "employee">;
    children: ReactNode;
}) {
    const session = await auth();
    const roleLabel = adminRoleLabels[role];
    const userName = session?.user?.name ?? roleLabel;

    return (
        <div className={styles.adminPage}>
            <header className={styles.adminHeader}>
                <Link href="/" className={styles.brand}>
                    <span>A</span>
                    <div>
                        <strong>A학원</strong>
                        <small>{roleLabel} 페이지</small>
                    </div>
                </Link>
                <div className={styles.headerTools}>
                    {session?.user ? (
                        <>
                            <span className={styles.userName}>
                                {userName} {roleLabel}
                            </span>
                            <LogoutButton className={styles.logoutButton} />
                        </>
                    ) : (
                        <Link href="/login" className={styles.sessionLink}>
                            로그인
                        </Link>
                    )}
                </div>
            </header>
            <div className={styles.adminBody}>
                <aside className={styles.sidebar}>
                    <nav aria-label={`${roleLabel} 메뉴`}>
                        {roleNavigation[role].map((item) => (
                            <NavLink item={item} key={item.href} />
                        ))}
                    </nav>
                </aside>
                <main className={styles.adminContent}>{children}</main>
            </div>
            {session?.user ? <ChatbotWidget role={role} /> : null}
        </div>
    );
}
