/**
 * `/employee/dashboard` 직원 업무 홈.
 *
 * 연 사람: STAFF. layout 가드 + page `requireRole("STAFF")`.
 * `StaffDashboardScreen`을 재사용하지 않는다. 그 Screen은 교사 라우트 전용이며
 * 바로가기가 `/teacher/*`로 고정돼 있다.
 *
 * 이 page는 data 로더 없이 청구·학생·상담·쪽지 링크 카드만 둔다.
 * 수업 출석 대시보드가 아니라 학원 운영 입구라는 의도다.
 */

import Link from "next/link";
import { requireRole } from "@/lib/auth-guard";
import styles from "./EmployeeDashboardScreen.module.css";

export const dynamic = "force-dynamic";

const links = [
    {
        href: "/employee/billing",
        title: "청구·수납",
        detail: "청구서 발행과 납부 현황을 관리합니다.",
    },
    {
        href: "/employee/students",
        title: "학생",
        detail: "학생 정보와 학부모 연락을 확인합니다.",
    },
    {
        href: "/employee/counseling",
        title: "상담",
        detail: "이탈 케어와 상담 문의, 메모를 처리합니다.",
    },
    {
        href: "/employee/messages",
        title: "쪽지",
        detail: "학부모·학생에게 안내 쪽지를 보냅니다.",
    },
];

/** 운영 업무 바로가기 그리드만 그린다. */
export default async function EmployeeDashboardPage() {
    const session = await requireRole("STAFF");
    const name = session.user.name ?? "직원";

    return (
        <section className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <span>EMPLOYEE</span>
                    <h1>업무 홈</h1>
                    <p>{name}님, 오늘 처리할 학원 운영 업무를 확인하세요.</p>
                </div>
            </header>
            <div className={styles.grid}>
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className={styles.card}>
                        <strong>{link.title}</strong>
                        <span>{link.detail}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
