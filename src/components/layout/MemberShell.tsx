import Link from "next/link";
import type { ReactNode } from "react";
import { roleNavigation } from "@/lib/navigation";
import type { RolePrefix } from "@/types/roles";
import NavLink from "./NavLink";
import styles from "./Shells.module.css";

export default function MemberShell({
    role,
    userName,
    children,
}: {
    role: Extract<RolePrefix, "parent" | "student" | "guest">;
    userName: string | null | undefined;
    children: ReactNode;
}) {
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
                    {roleNavigation[role].map((item) => (
                        <NavLink item={item} compact key={item.href} />
                    ))}
                </nav>
                <span className={styles.userName}>
                    {userName ?? memberLabel(role)}
                </span>
            </header>
            <main className={styles.memberContent}>{children}</main>
            <nav className={styles.mobileNav} aria-label="하단 메뉴">
                {roleNavigation[role].map((item) => (
                    <NavLink item={item} compact key={item.href} />
                ))}
            </nav>
        </div>
    );
}

function memberLabel(role: "parent" | "student" | "guest") {
    if (role === "parent") return "학부모";
    if (role === "student") return "학생";
    return "학원 안내";
}
