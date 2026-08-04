import Link from "next/link";
import type { ReactNode } from "react";
import { roleNavigation } from "@/lib/navigation";
import type { RolePrefix } from "@/types/roles";
import { auth } from "@/lib/auth";
import NavLink from "./NavLink";
import styles from "./Shells.module.css";

export default async function AdminShell({
    role,
    children,
}: {
    role: Extract<RolePrefix, "director" | "staff">;
    children: ReactNode;
}) {
    const session = await auth();
    const roleLabel = role === "director" ? "원장" : "교직원";
    const userName = session?.user?.name ?? roleLabel;

    return (
        <div className={styles.adminPage}>
            <header className={styles.adminHeader}>
                <Link href="/" className={styles.brand}>
                    <span>A</span>
                    <div>
                        <strong>A학원</strong>
                        <small>{roleLabel} 관리</small>
                    </div>
                </Link>
                <div className={styles.headerTools}>
                    {session?.user ? (
                        <span className={styles.userName}>
                            {userName} {role === "director" ? "원장" : "교직원"}
                        </span>
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
        </div>
    );
}
