/**
 * 공개 홈 `/`.
 *
 * 누구나 연다. `requireRole` 없음. `src/proxy.ts` matcher 밖이라
 * 미로그인도 통과한다. GUEST `/guest`도 여기로 redirect된다.
 *
 * 흐름: `auth()` + `getHomeNotices()` → `HomeScreen`.
 * 세션이 있으면 역할 홈 링크(`getRoleHomePath`)를 viewer로 넘긴다.
 *
 * 의도적으로 하지 않는 일:
 * - 공지 작성 UI를 열지 않는다 → `/notices` + 원장 `canWrite`.
 * - 상담 문의 폼을 두지 않는다 → `/guest/inquiry`.
 */

import type { Metadata } from "next"; // 공개 랜딩 메타. 역할 홈 메타가 아니다.
import HomeScreen from "@/features/home/HomeScreen"; // 공개 랜딩 UI. 업무 Screen이 아니다.
import { getHomeNotices } from "@/features/notices/data"; // 게시된 공지 일부. 작성 UI는 /notices.
import { auth } from "@/lib/auth"; // JWT만. requireRole이 아니라 역할 홈 링크용.
import { getRoleHomePath, roleLabels } from "@/lib/role-routes"; // 로그인 시 역할 홈 링크. GUEST는 /.

export const metadata: Metadata = { // 공개 랜딩 제목. 역할 홈이 아니다.
    title: "A학원 · 배움의 흐름을 함께", // 브라우저 탭. /director 제목이 아니다.
    description: // 공개 소개. 문의 폼 카피가 아니다.
        "수업, 기록, 상담을 연결해 학생의 성장을 함께 만드는 A학원입니다.", // 랜딩 메타 문장.
}; // 블록 끝.

/**
 * 공개 랜딩. 로그인 여부에 따라 역할 홈 링크만 붙인다.
 */
export default async function HomePage() { // 공개 `/`. proxy matcher 밖. requireRole 없음.
    const [session, notices] = await Promise.all([auth(), getHomeNotices()]); // 세션(역할 홈 링크용) + 공개 공지. requireRole 없음.
    const user = session?.user?.id ? session.user : null; // 미로그인이면 null. GUEST 홈도 여기다 — /guest는 / 로 보낸다.

    return ( // HomeScreen에 viewer/notices만. 문의 폼은 /guest/inquiry.
        <HomeScreen // 공개 랜딩. 공지 작성 UI는 /notices.
            viewer={ // 로그인 시 역할 홈 링크. 미로그인이면 null.
                user // 세션 사용자. 없으면 게스트 카피만.
                    ? { // 로그인 시 역할 홈 링크만. 업무 Screen이 아니다.
                          name: user.name?.trim() || user.email || "사용자", // 표시 이름. 역할 부여용이 아니다.
                          roleLabel: roleLabels[user.role], // 한글 역할 라벨. JWT role을 그대로 쓴다.
                          dashboardHref: getRoleHomePath(user.role), // GUEST는 /. /guest로 보내지 않는다.
                      } // 블록 끝.
                    : null // 미로그인. 역할 홈 링크 없음.
            } // 블록 끝.
            notices={notices} // 공개 공지. 작성은 /notices + 원장 canWrite.
        /> // HomeScreen 끝.
    ); // 호출/그룹 끝.
} // 블록 끝.
