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

import Link from "next/link"; // 운영 입구 카드. Screen을 여기서 열지 않는다.
import { requireRole } from "@/lib/auth-guard"; // 직원만. StaffDashboardScreen은 교사 라우트 전용이라 쓰지 않는다.
import styles from "./EmployeeDashboardScreen.module.css"; // 업무 홈 스타일. 교사 대시보드 CSS가 아니다.

export const dynamic = "force-dynamic"; // 세션 이름이 캐시에 안 남게.

const links = [ // 운영 입구만. 출석/성적/리포트 URL이 없다.
    { // 청구 자리. Toss 정산이 아니다.
        href: "/employee/billing", // 준비 중 page. 수납 목록이 아직 없다.
        title: "청구·수납", // 카드 제목.
        detail: "청구서 발행과 납부 현황을 관리합니다.", // 안내 카피. 실제 목록은 준비 중.
    }, // 객체/호출 끝.
    { // 학생 명단. 원장 상태 전이가 아니다.
        href: "/employee/students", // 교사 StaffStudentsScreen 재사용.
        title: "학생", // 카드 제목.
        detail: "학생 정보와 학부모 연락을 확인합니다.", // 안내.
    }, // 객체/호출 끝.
    { // 상담. includeInquiries true.
        href: "/employee/counseling", // 이탈 케어+게스트 문의. 교사 counseling은 문의 없음.
        title: "상담", // 카드 제목. 팀원 PR에서 문의 전용 카피를 케어 포함으로 바꿈.
        detail: "이탈 케어와 상담 문의, 메모를 처리합니다.", // 배정 케어 + /guest/inquiry.
    }, // 객체/호출 끝.
    { // 쪽지. features MessagesScreen.
        href: "/employee/messages", // sendMessage 권한 page.
        title: "쪽지", // 카드 제목.
        detail: "학부모·학생에게 안내 쪽지를 보냅니다.", // 방송은 승인 요청.
    }, // 객체/호출 끝.
]; // links 끝.

/** 운영 업무 바로가기 그리드만 그린다. */
export default async function EmployeeDashboardPage() { // proxy→layout→page. StaffDashboardScreen 미사용.
    const session = await requireRole("STAFF"); // 직원만. StaffDashboardScreen은 교사 라우트 전용이라 쓰지 않는다.
    const name = session.user.name ?? "직원"; // 인사에만 쓴다. 수업 지표를 읽지 않는다.

    return ( // 청구·학생·상담·쪽지 바로가기만. 출석 대시보드 아님.
        <section className={styles.page}>{/* 직원 업무 홈. 교사 StaffDashboardScreen이 아니다. */}
            <header className={styles.heading}>{/* 업무 홈 인사. */}
                <div>{/* 제목 블록. */}
                    <span>EMPLOYEE</span>{/* 영문 eyebrow. 교사 대시보드가 아니다. */}
                    <h1>업무 홈</h1>{/* 운영 입구 제목. 오늘 수업 홈이 아니다. */}
                    <p>{name}님, 오늘 처리할 학원 운영 업무를 확인하세요.</p>{/* 인사. 출석 지표가 아니다. */}
                </div>{/* 제목 블록 끝. */}
            </header>{/* header 끝. */}
            <div className={styles.grid}>{/* 운영 입구 카드. 청구는 준비 중 page로 간다. */}
                {links.map((link) => ( // /employee/* 만. /teacher/* 바로가기가 아니다.
                    <Link key={link.href} href={link.href} className={styles.card}>{/* 해당 업무 URL. Screen을 여기서 열지 않는다. */}
                        <strong>{link.title}</strong>{/* 카드 제목. */}
                        <span>{link.detail}</span>{/* 카드 설명. */}
                    </Link> // Link 끝.
                ))}{/* 구문 끝. */}
            </div>{/* grid 끝. */}
        </section> // section 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
