"use client"; // usePathname. 셸은 서버, 링크만 클라이언트.

/**
 * 현재 경로를 강조하는 사이드바/상단 링크.
 * 정확한 prefix 매칭으로 형제 메뉴가 동시에 켜지지 않게 한다.
 *
 * 호출: `AdminShell` (기본), `MemberShell` (게스트는 `compact`).
 * 클라이언트 전용 — `usePathname`이 필요해서 셸은 서버, 링크만 클라이언트.
 *
 * 읽기 전용 UI. 권한·세션을 보지 않는다. href는 `roleNavigation`이 역할 안에서만 준다.
 *
 * 의도적으로 하지 않는 일:
 * - `pathname.startsWith(item.href)`만 쓰지 않는다. `/director/reports`가
 *   `/director/report` 같은 짧은 href에 먹히지 않게 `href/` 경계를 요구한다.
 * - 게스트 해시(`/#programs`)는 pathname이 `/`일 때만 exact match.
 *
 * 관련: `navigation.ts`, `Shells.module.css`.
 */

import Link from "next/link"; // 역할 그룹 안 href. proxy가 prefix로 1차 가드.
import { usePathname } from "next/navigation"; // 클라이언트만. 셸은 서버라 링크만 여기.
import type { NavItem } from "@/types/roles"; // href/label/icon. 권한 키는 보지 않는다.
import styles from "./Shells.module.css"; // navActive / navLink. 권한 grant로 숨기지 않는다.

/**
 * @param compact 게스트 상단/하단처럼 아이콘+짧은 라벨. 사이드바는 false.
 */
export default function NavLink({ // 경로 강조. href/ 경계. 권한 키 없음.
    item, // roleNavigation 한 줄. 권한 키로 숨기지 않는다.
    compact = false, // 게스트 상단/하단만 true. 사이드바는 false.
}: { // 경로 강조. href/ 경계. 권한 키 없음.
    item: NavItem; // href는 역할 URL 그룹 안.
    compact?: boolean; // 게스트 compact. 업무 사이드바는 기본.
}) { // 읽기 전용. 세션을 보지 않는다.
    const pathname = usePathname(); // 클라이언트만. 셸은 서버라 링크만 여기.

    const active = // 경로 강조. href/ 경계. 권한 키 없음.
        pathname === item.href || pathname.startsWith(`${item.href}/`); // exact 또는 href/ 경계. /director/reports가 짧은 href에 먹히지 않게.

    return ( // 권한 키는 보지 않는다. billing이 꺼져도 링크는 보이고 페이지가 막는다.
        <Link // 경로 강조. href/ 경계. 권한 키 없음.
            href={item.href} // roleNavigation이 역할 그룹 안에서만 준다. 권한 키는 보지 않는다.
            className={active ? styles.navActive : styles.navLink} // 형제 메뉴가 동시에 켜지지 않게 prefix 경계.
            aria-current={active ? "page" : undefined} // 현재 페이지만. 게스트 해시는 `/` exact.
            data-compact={compact || undefined} // 게스트 상단/하단만 compact.
        > {/* 경로 강조. href/ 경계. 권한 키 없음. */}
            <span aria-hidden="true">{item.icon}</span> {/* 장식. 실제 이름은 label. */}
            <strong>{item.label}</strong> {/* 화면 이름. 권한 키로 바꾸지 않는다. */}
        </Link> {/* 경로 강조. href/ 경계. 권한 키 없음. */}
    );
}
