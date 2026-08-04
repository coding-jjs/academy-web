import type { NavItem, RolePrefix } from "@/types/roles";

export const roleNavigation: Record<RolePrefix, NavItem[]> = {
    director: [
        { href: "/director/dashboard", label: "대시보드", icon: "▦" },
        { href: "/director/churn", label: "이탈 위험", icon: "△" },
        { href: "/director/reports", label: "AI 리포트", icon: "▤" },
        { href: "/director/grades", label: "성적·오답", icon: "▤" },    // 성적 입력
        { href: "/director/billing", label: "청구·수납", icon: "▰" },  // 학부모 에게 청구 요청
        { href: "/director/classes", label: "반·수업", icon: "▣" },    // 반, 수업 설정
        { href: "/director/students", label: "학생", icon: "◉" },
        { href: "/director/parents", label: "학부모", icon: "◎" },
        { href: "/director/messages", label: "쪽지", icon: "□" },   /// 쪽지 추가
        { href: "/director/permissions", label: "권한", icon: "◇" },
        { href: "/director/users", label: "가입 사용자", icon: "＋" },
    ],
    staff: [
        { href: "/staff/dashboard", label: "내 수업", icon: "▦" },
        { href: "/staff/attendance", label: "출석 체크", icon: "✓" },
        { href: "/staff/reports", label: "AI 리포트", icon: "▤" },
        { href: "/staff/grades", label: "성적·오답", icon: "▤" },   // 성적 입력
        { href: "/staff/billing", label: "청구·수납", icon: "▰" },  // 학부모에게 청구 요청
        { href: "/staff/students", label: "담당 학생", icon: "◉" },
        { href: "/staff/messages", label: "쪽지", icon: "□" },   /// 쪽지 추가
        { href: "/staff/counseling", label: "상담 관리", icon: "◎" },
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
        {
            href: "/parent/student-inbox",
            label: "학생 공지",
            icon: "□",
        },
    ],
    student: [
        { href: "/student/dashboard", label: "내 홈", icon: "⌂" },
        { href: "/student/timetable", label: "시간표", icon: "▣" },
        { href: "/student/grades", label: "성적·오답", icon: "▤" },
        { href: "/student/news", label: "체험 소식", icon: "✦" },
        { href: "/student/inbox", label: "공지·쪽지", icon: "□" },
    ],
    guest: [
        { href: "/guest/waiting", label: "학원 소개", icon: "⌂" },
        { href: "/about", label: "프로그램", icon: "✦" },
        { href: "/guest/inquiry", label: "상담 문의", icon: "◎" },
    ],
};

export const previewMetrics = [
    { label: "오늘 출석", value: "94%", detail: "전체 128명 기준" },
    { label: "확인할 리포트", value: "12", detail: "승인 대기" },
    { label: "신규 문의", value: "7", detail: "오늘 접수" },
];
