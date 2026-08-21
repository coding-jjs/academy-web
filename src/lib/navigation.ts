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

import type { NavItem, RolePrefix } from "@/types/roles"; // href는 역할 그룹 안. proxy가 prefix로 1차 가드.

/**
 * URL prefix → 사이드바 항목. href는 해당 역할 그룹 안에서만 연다.
 * 아이콘은 장식이라 aria-hidden. 접근성 라벨은 셸의 nav aria-label + item.label.
 */
export const roleNavigation: Record<RolePrefix, NavItem[]> = { // 권한 키로 숨기지 않는다. billing은 페이지가 막는다.
    director: [ // 원장 메뉴. billing이 꺼진 직원과 달리 원장은 키를 보지 않는다.
        { href: "/director/dashboard", label: "대시보드", icon: "▦" }, // director-data.ts 카드.
        { href: "/director/churn", label: "이탈 위험", icon: "△" }, // detectChurnCases 큐. 교사 메뉴에 없음.
        { href: "/director/reports", label: "AI 리포트", icon: "▤" }, // 승인 큐. 교사 작성 화면과 다름.
        { href: "/director/grades", label: "성적·오답", icon: "▤" }, // 전 원생 쓰기. 스코프 없음.
        { href: "/director/billing", label: "청구·수납", icon: "▰" }, // 교사 billing은 항상 false라 여기만 원장/직원.
        { href: "/director/classes", label: "반·수업", icon: "▣" }, // 반 편성. 수강 CANCELLED+endedAt.
        { href: "/director/students", label: "학생", icon: "◉" }, // ENROLLED↔PAUSED↔WITHDRAWN 전이.
        { href: "/director/parents", label: "학부모", icon: "◎" }, // ParentStudentLink. 퇴원 시 링크 종료.
        { href: "/director/messages", label: "쪽지", icon: "□" }, // 즉시 SENT. 직원은 승인 대기.
        { href: "/director/permissions", label: "권한", icon: "◇" }, // TEACHER/STAFF grant. 원장 프리셋 없음.
        { href: "/director/users", label: "가입 사용자", icon: "＋" }, // GUEST에 역할 부여.
    ], // director 메뉴 끝.
    teacher: [ // 교사. 수납·학부모 연결·권한 화면은 두지 않는다.
        { href: "/teacher/dashboard", label: "내 수업", icon: "▦" }, // staff-data. viewAll이면 타반도.
        { href: "/teacher/attendance", label: "출석 체크", icon: "✓" }, // ownClassAttendanceGrade.
        { href: "/teacher/reports", label: "AI 리포트", icon: "▤" }, // 초안·승인요청. 발송은 원장.
        { href: "/teacher/grades", label: "성적·오답", icon: "▤" }, // 담당 반. staff-scope.
        { href: "/teacher/students", label: "담당 학생", icon: "◉" }, // 직원 URL이 이 Screen을 재사용.
        { href: "/teacher/messages", label: "쪽지", icon: "□" }, // sendMessage. 승인은 원장.
        { href: "/teacher/counseling", label: "상담 관리", icon: "◎" }, // 직원 라우트도 같은 Screen.
    ], // teacher 메뉴 끝.
    employee: [ // STAFF. 상담/학생은 교사 Screen을 재사용. 출석·리포트 메뉴는 없음.
        { href: "/employee/dashboard", label: "업무 홈", icon: "▦" }, // 직원 홈. /staff가 아님.
        { href: "/employee/billing", label: "청구·수납", icon: "▰" }, // grant billing. 교사와 달리 프리셋 true.
        { href: "/employee/students", label: "학생", icon: "◉" }, // StaffStudentsScreen 재사용.
        { href: "/employee/counseling", label: "상담", icon: "◎" }, // 이탈 케어+문의. includeInquiries는 직원만 true.
        { href: "/employee/messages", label: "쪽지", icon: "□" }, // PENDING_APPROVAL. 수신 행은 아직 없음.
    ], // employee 메뉴 끝.
    parent: [ // 학부모. 권한 키 없음. 활성 자녀 링크만 data.ts가 건다.
        { href: "/parent/dashboard", label: "자녀 홈", icon: "⌂" }, // endedAt null 링크만.
        { href: "/parent/attendance", label: "출결·수업", icon: "▣" }, // AbsenceRequest만. 출석 행을 쓰지 않는다.
        { href: "/parent/reports", label: "AI 리포트", icon: "▤" }, // SENT만. 초안/반려는 page가 거른다.
        { href: "/parent/payments", label: "결제", icon: "▰" }, // 자녀 청구. 교사 billing과 별개.
        { href: "/parent/inbox", label: "쪽지함", icon: "□" }, // 수신. 작성은 원장/직원.
        { href: "/parent/timetable", label: "시간표", icon: "▣" }, // 자녀 수강 회차.
        { href: "/parent/grades", label: "성적·오답", icon: "▤" }, // 읽기. imageUrls는 학생 뷰어 전용.
        { href: "/parent/news", label: "체험 소식", icon: "✦" }, // PARENT_ADMISSION 포함 가능.
    ], // parent 메뉴 끝.
    student: [ // 학생. 본인 Student.userId만. 결제·리포트 승인 경로는 숨긴다.
        { href: "/student/dashboard", label: "내 홈", icon: "⌂" }, // 본인 프로필만.
        { href: "/student/timetable", label: "시간표", icon: "▣" }, // 본인 수강 회차.
        { href: "/student/grades", label: "성적·오답", icon: "▤" }, // imageUrls 포함. 학부모 뷰어와 다름.
        { href: "/student/news", label: "체험 소식", icon: "✦" }, // PARENT_ADMISSION은 data.ts where에서 제외.
        { href: "/student/inbox", label: "쪽지", icon: "□" }, // /student/ 딥링크만. 학부모 결제 경로 숨김.
    ], // student 메뉴 끝.
    guest: [ // 온보딩 전. /guest/inquiry만 업무. `/`는 소개라 matcher 밖.
        { href: "/", label: "학원 소개", icon: "⌂" }, // 공개 홈. proxy matcher에 없음.
        { href: "/#programs", label: "프로그램", icon: "✦" }, // 해시. 별도 페이지가 아니다.
        { href: "/guest/inquiry", label: "상담 문의", icon: "◎" }, // GUEST만. 제출자 userId를 두지 않는다.
    ], // guest 메뉴 끝.
};
