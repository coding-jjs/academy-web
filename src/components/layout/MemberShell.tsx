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

import Link from "next/link"; // 브랜드 `/`. 게스트 소개와 같음.
import type { ReactNode } from "react"; // page.tsx Screen.
import { roleNavigation } from "@/lib/navigation"; // parent/student/guest. 권한 키 없음.
import type { RolePrefix } from "@/types/roles"; // parent | student | guest.
import LogoutButton from "@/components/auth/LogoutButton"; // 온보딩 전 GUEST도 세션을 끊을 수 있게.
import NavLink from "./NavLink"; // 게스트는 compact.
import styles from "./Shells.module.css"; // adminPage 또는 memberPage.
import ChatbotWidget from "@/features/chatbot/ChatbotWidget"; // 보호자/원생만. 게스트는 inquiry.

/**
 * 학부모/학생/게스트 레이아웃 뼈대.
 *
 * @param userName 세션 이름. 없으면 역할 라벨로 헤더를 채운다.
 */
export default function MemberShell({ // 학부모·학생 사이드바, 게스트는 소개 내비.
    role, // parent/student/guest. AdminShell과 겸하지 않는다.
    userName, // layout이 requireRole 후 넘긴다. auth()를 다시 치지 않는다.
    children, // page.tsx Screen. 자녀/본인 범위는 data.ts.
}: { // 학부모·학생 사이드바, 게스트는 소개 내비.
    role: Extract<RolePrefix, "parent" | "student" | "guest">; // 업무 셸은 AdminShell.
    userName: string | null | undefined; // 없으면 역할 라벨.
    children: ReactNode; // Screen.
}) { // 게스트 소개 페이지가 셸만 재사용할 수 있게 auth()를 다시 치지 않는다.
    if (role === "parent" || role === "student") { // 학부모/학생은 업무형 사이드바, 게스트는 마케팅형 상단+하단 내비.
        const roleLabel = memberLabel(role); // 헤더 작은 글씨. 권한 키가 아니라 역할 라벨.

        return ( // 사이드바 + 챗봇. 게스트는 이 분기를 타지 않는다.
            <div className={styles.adminPage}> {/* 업무형 크롬. AdminShell과 같은 뼈대. */}
                <header className={styles.adminHeader}> {/* 브랜드 + 이름 + 로그아웃. 온보딩 전에도 세션을 끊을 수 있게. */}
                    <Link href="/" className={styles.brand}> {/* 소개 홈. */}
                        <span>A</span> {/* 브랜드 마크. */}
                        <div> {/* 학원명 + 역할. */}
                            <strong>A학원</strong> {/* 브랜드. */}
                            <small>{roleLabel} 페이지</small> {/* 학부모/학생. */}
                        </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                    </Link> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                    <div className={styles.headerTools}> {/* 이름·로그아웃. */}
                        <span className={styles.userName}> {/* layout이 넘긴 이름. */}
                            {userName ?? roleLabel} {roleLabel} {/* 없으면 역할 라벨. */}
                        </span> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                        <LogoutButton className={styles.logoutButton} /> {/* 학원 PC 공유를 빨리 끊는다. */}
                    </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                </header> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                <div className={styles.adminBody}> {/* 사이드바 + 본문. */}
                    <aside className={styles.sidebar}> {/* roleNavigation만. 권한 키로 항목을 숨기지 않는다. */}
                        <nav aria-label={`${roleLabel} 메뉴`}> {/* 접근성. 아이콘은 aria-hidden. */}
                            {roleNavigation[role].map((item) => ( // 역할 단위 고정. grant 없음.
                                <NavLink item={item} key={item.href} /> /* 경로 강조. */
                            ))}
                        </nav> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                    </aside> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                    <main className={styles.adminContent}>{children}</main> {/* page.tsx Screen. 자녀/본인 범위는 data.ts. */}
                </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                <ChatbotWidget role={role} /> {/* 보호자/원생만. 게스트 상담은 /guest/inquiry. */}
            </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
        );
    }

    return ( // 게스트 마케팅형. 사이드바·챗봇 없음.
        <div className={styles.memberPage}> {/* 소개 페이지 톤. 업무 메뉴를 붙이지 않는다. */}
            <header className={styles.memberHeader}> {/* 소개 페이지 톤. 사이드바 대신 상단 compact 내비. */}
                <Link href="/" className={styles.brand}> {/* 공개 홈. proxy matcher 밖. */}
                    <span>A</span> {/* 브랜드 마크. */}
                    <div> {/* 학원명 + 학원 안내. */}
                        <strong>A학원</strong> {/* 브랜드. */}
                        <small>{memberLabel(role)}</small> {/* 학원 안내. "게스트"가 아님. */}
                    </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                </Link> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                <nav className={styles.desktopNav} aria-label="상단 메뉴"> {/* 데스크톱 compact. */}
                    {roleNavigation[role].map((item) => ( // / · /#programs · /guest/inquiry. 업무 메뉴를 소개에 붙이지 않는다.
                        <NavLink item={item} compact key={item.href} /> /* 게스트 compact. */
                    ))}
                </nav> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                <div className={styles.memberTools}> {/* 이름·로그아웃. 온보딩 전도 끊을 수 있게. */}
                    <span className={styles.userName}> {/* layout이 넘긴 이름. */}
                        {userName ?? memberLabel(role)} {/* 없으면 학원 안내. */}
                    </span> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
                    <LogoutButton className={styles.logoutButton} /> {/* 온보딩 전 GUEST도 세션을 끊을 수 있게. */}
                </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
            </header> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
            <main className={styles.memberContent}>{children}</main> {/* 소개 또는 /guest/inquiry. */}
            <nav className={styles.mobileNav} aria-label="하단 메뉴"> {/* 모바일. 데스크톱 상단과 같은 항목. */}
                {roleNavigation[role].map((item) => ( // 같은 guest 내비. 해시 /#programs 포함.
                    <NavLink item={item} compact key={item.href} /> /* compact. */
                ))}
            </nav> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
        </div> {/* 학부모·학생 사이드바, 게스트는 소개 내비. */}
    );
}

/** 헤더 작은 글씨. guest는 "게스트"가 아니라 소개 페이지 톤으로 "학원 안내". */
function memberLabel(role: "parent" | "student" | "guest") { // roleLabels의 "게스트"를 소개 톤으로 바꾼다.
    if (role === "parent") return "학부모"; // MemberShell parent prefix.
    if (role === "student") return "학생"; // MemberShell student prefix.
    return "학원 안내"; // guest. roleLabels의 "게스트"를 소개 톤으로 바꾼다.
}
