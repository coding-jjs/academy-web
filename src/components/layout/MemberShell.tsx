/**
 * 학부모·학생 공통 크롬 (게스트는 상단·하단 내비, 사이드바 없음).
 * 멤버 내비와 챗봇을 씌워 보호자/원생 화면이 같은 골격을 쓰게 한다.
 *
 * 호출: `(parent|student|guest)/layout.tsx`. 레이아웃이 `requireRole` 후 userName을 넘긴다.
 * 서버 컴포넌트. AdminShell과 달리 `auth()`를 다시 치지 않고 이름을 props로 받는다
 * (게스트 소개 페이지가 셸만 재사용할 수 있게).
 *
 * 읽기 전용 UI. parent/student는 AdminShell과 같은 사이드바 레이아웃,
 * guest는 마케팅형 상단+모바일 하단 내비 — 업무 메뉴를 소개 페이지에 붙이지 않기 위함.
 *
 * 의도적으로 하지 않는 일:
 * - 게스트에게 ChatbotWidget을 붙이지 않는다. 상담은 `/guest/inquiry`.
 * - 로그아웃을 게스트만 숨기지 않는다. 온보딩 전 GUEST도 세션을 끊을 수 있어야 한다.
 *
 * 관련: `AdminShell.tsx`, `navigation.ts`, `ChatbotWidget`.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { roleNavigation } from "@/lib/navigation";
import type { RolePrefix } from "@/types/roles";
import LogoutButton from "@/components/auth/LogoutButton";
import NavLink from "./NavLink";
import styles from "./Shells.module.css";
import ChatbotWidget from "@/features/chatbot/ChatbotWidget";

/**
 * 학부모/학생/게스트 레이아웃 뼈대.
 *
 * @param userName 세션 이름. 없으면 역할 라벨로 헤더를 채운다.
 */
export default function MemberShell({
    role,
    userName,
    children,
}: {
    role: Extract<RolePrefix, "parent" | "student" | "guest">;
    userName: string | null | undefined;
    children: ReactNode;
}) {
    if (role === "parent" || role === "student") {
        const roleLabel = memberLabel(role);

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
                        <span className={styles.userName}>
                            {userName ?? roleLabel} {roleLabel}
                        </span>
                        <LogoutButton className={styles.logoutButton} />
                    </div>
                </header>
                <div className={styles.adminBody}>
                    <aside className={styles.sidebar}>
                        <nav aria-label={`${roleLabel} 메뉴`}>
                            {roleNavigation[role].map(
                                (
                                    item,
                                ) => (
                                    <NavLink
                                        item={item}
                                        key={item.href}
                                    />
                                ),
                            )}
                        </nav>
                    </aside>
                    <main className={styles.adminContent}>{children}</main>
                </div>
                <ChatbotWidget role={role} />
            </div>
        );
    }

    return (
        <div className={styles.memberPage}>
            <header className={styles.memberHeader}>
                <Link href="/" className={styles.brand}>
                    <span>A</span>
                    <div>
                        <strong>A학원</strong>
                        <small>{memberLabel(role)}</small>
                    </div>
                </Link>
                <nav className={styles.desktopNav} aria-label="상단 메뉴">
                    {roleNavigation[role].map(
                        (
                            item,
                        ) => (
                            <NavLink
                                item={item}
                                compact
                                key={item.href}
                            />
                        ),
                    )}
                </nav>
                <div className={styles.memberTools}>
                    <span className={styles.userName}>
                        {userName ?? memberLabel(role)}
                    </span>
                    <LogoutButton className={styles.logoutButton} />
                </div>
            </header>
            <main className={styles.memberContent}>{children}</main>
            <nav className={styles.mobileNav} aria-label="하단 메뉴">
                {roleNavigation[role].map(
                    (
                        item,
                    ) => (
                        <NavLink
                            item={item}
                            compact
                            key={item.href}
                        />
                    ),
                )}
            </nav>
        </div>
    );
}

/** 헤더 작은 글씨. guest는 "게스트"가 아니라 소개 페이지 톤으로 "학원 안내". */
function memberLabel(role: "parent" | "student" | "guest") {
    if (role === "parent") return "학부모";
    if (role === "student") return "학생";
    return "학원 안내";
}
