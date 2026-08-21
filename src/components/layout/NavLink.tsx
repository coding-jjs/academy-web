"use client";

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

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types/roles";
import styles from "./Shells.module.css";

/**
 * @param compact 게스트 상단/하단처럼 아이콘+짧은 라벨. 사이드바는 false.
 */
export default function NavLink({
    item,
    compact = false,
}: {
    item: NavItem;
    compact?: boolean;
}) {
    const pathname = usePathname();

    const active =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
        <Link
            href={item.href}
            className={active ? styles.navActive : styles.navLink}
            aria-current={active ? "page" : undefined}
            data-compact={compact || undefined}
        >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
        </Link>
    );
}
