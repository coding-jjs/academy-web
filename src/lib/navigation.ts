/**
 * 역할별 사이드바 링크 목록.
 * AdminShell/MemberShell이 메뉴를 하드코딩하지 않게 한다.
 *
 * 호출: `AdminShell` (director/teacher/employee), `MemberShell` (parent/student/guest).
 * 권한 키로 항목을 숨기지는 않는다 — 메뉴는 역할 단위로 고정이고,
 * 페이지 진입 시 `userHasPermission`이 billing 등을 막는다.
 *
 * 읽기 전용. 클라이언트(NavLink)와 서버 셸이 같이 import한다.
 *
 * 의도적으로 하지 않는 일:
 * - 로그인 여부·권한 grant를 보지 않는다.
 * - 홈 URL 매핑은 두지 않는다 → `getRoleHomePath`.
 * - guest의 `/#programs`는 해시 링크. 별도 페이지가 아니다.
 *
 * 관련: `role-routes.ts`, `types/roles.ts`, `components/layout/*Shell.tsx`.
 */

import type { NavItem, RolePrefix } from "@/types/roles";

/**
 * URL prefix → 사이드바 항목. href는 해당 역할 그룹 안에서만 연다.
 * 아이콘은 장식이라 aria-hidden. 접근성 라벨은 셸의 nav aria-label + item.label.
 */
export const roleNavigation: Record<RolePrefix, NavItem[]> = {
    director: [
        { href: "/director/dashboard", label: "대시보드", icon: "▦" },
        { href: "/director/churn", label: "이탈 위험", icon: "△" },
        { href: "/director/reports", label: "AI 리포트", icon: "▤" },
        { href: "/director/grades", label: "성적·오답", icon: "▤" },
        { href: "/director/billing", label: "청구·수납", icon: "▰" },
        { href: "/director/classes", label: "반·수업", icon: "▣" },
        { href: "/director/students", label: "학생", icon: "◉" },
        { href: "/director/parents", label: "학부모", icon: "◎" },
        { href: "/director/messages", label: "쪽지", icon: "□" },
        { href: "/director/permissions", label: "권한", icon: "◇" },
        { href: "/director/users", label: "가입 사용자", icon: "＋" },
    ],
    teacher: [
        { href: "/teacher/dashboard", label: "내 수업", icon: "▦" },
        { href: "/teacher/attendance", label: "출석 체크", icon: "✓" },
        { href: "/teacher/reports", label: "AI 리포트", icon: "▤" },
        { href: "/teacher/grades", label: "성적·오답", icon: "▤" },
        { href: "/teacher/students", label: "담당 학생", icon: "◉" },
        { href: "/teacher/messages", label: "쪽지", icon: "□" },
        { href: "/teacher/counseling", label: "상담 관리", icon: "◎" },
    ],
    employee: [
        { href: "/employee/dashboard", label: "업무 홈", icon: "▦" },
        { href: "/employee/billing", label: "청구·수납", icon: "▰" },
        { href: "/employee/students", label: "학생", icon: "◉" },
        { href: "/employee/counseling", label: "상담", icon: "◎" },
        { href: "/employee/messages", label: "쪽지", icon: "□" },
    ],
    parent: [
        { href: "/parent/dashboard", label: "자녀 홈", icon: "⌂" },
        { href: "/parent/attendance", label: "출결·수업", icon: "▣" },
        { href: "/parent/reports", label: "AI 리포트", icon: "▤" },
        { href: "/parent/payments", label: "결제", icon: "▰" },
        { href: "/parent/inbox", label: "쪽지함", icon: "□" },
        { href: "/parent/timetable", label: "시간표", icon: "▣" },
        { href: "/parent/grades", label: "성적·오답", icon: "▤" },
        { href: "/parent/news", label: "체험 소식", icon: "✦" },
    ],
    student: [
        { href: "/student/dashboard", label: "내 홈", icon: "⌂" },
        { href: "/student/timetable", label: "시간표", icon: "▣" },
        { href: "/student/grades", label: "성적·오답", icon: "▤" },
        { href: "/student/news", label: "체험 소식", icon: "✦" },
        { href: "/student/inbox", label: "쪽지", icon: "□" },
    ],
    guest: [
        { href: "/", label: "학원 소개", icon: "⌂" },
        { href: "/#programs", label: "프로그램", icon: "✦" },
        { href: "/guest/inquiry", label: "상담 문의", icon: "◎" },
    ],
};
