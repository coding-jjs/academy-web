/**
 * `/guest` GUEST 진입점.
 *
 * `(guest)` layout이 이미 `requireRole("GUEST")`를 건다.
 * 상담 문의로 보내지 않고 공개 홈 `/`로 redirect한다.
 * 문의는 별도 경로 `/guest/inquiry`.
 *
 * 의도적으로 하지 않는 일:
 * - Guest 전용 대시보드 Screen을 두지 않는다.
 * - 원장 역할 부여를 기다리지 말고 홈·문의만 쓰게 한다.
 */

import { redirect } from "next/navigation"; // UI를 그리지 않는다. 공개 홈으로만.

/** 게스트 루트는 공개 홈으로만 보낸다. */
export default function GuestPage() { // 게스트 루트. 게스트 대시보드는 없다.
    redirect("/"); // 게스트 홈은 공개 /. 문의는 /guest/inquiry.
} // 블록 끝.
