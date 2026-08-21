/**
 * 로그인 전후 모두 쓰는 공개 마케팅 홈 레이아웃이다.
 *
 * 호출: `app/page.tsx`가 viewer·공지 3개를 넘긴다.
 * 역할 대시보드(`/director/dashboard` 등)가 아니다. 헤더에만 대시보드 링크를 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 출결·리포트 집계. 그건 `features/dashboard`.
 * - 공지 조회. 페이지가 `getHomeNotices`로 가져와 props로 준다.
 *
 * 관련: `HomeHeader`, `HomeShowcase`, `HomeInformationSections`.
 */

import HomeHeader from "@/features/home/components/HomeHeader"; // 브랜드·로그인/대시보드 링크.
import HomeInformationSections from "@/features/home/components/HomeInformationSections"; // 과정·여정·오시는 길.
import HomeShowcase from "@/features/home/components/HomeShowcase"; // 공지 바·히어로 배너.
import type { HomeViewer } from "@/features/home/types"; // 비로그인이면 null.
import type { Notice } from "@/features/notices/types"; // getHomeNotices 3건.
import styles from "./HomeScreen.module.css"; // 공개 홈 레이아웃.

/**
 * 헤더·쇼케이스·안내 섹션만 조립한다.
 * viewer가 null이면 비로그인 헤더(로그인/가입).
 */
export default function HomeScreen({ // 역할 대시보드가 아니다. `/` 마케팅 홈.
    viewer, // null이면 로그인/가입. 지표 카드 없음.
    notices, // 공개 공지 3건. page가 조회한다.
}: { // props. 출결 집계 없음.
    viewer: HomeViewer | null; // 세션 헤더 요약.
    notices: Notice[]; // 홈 미리보기.
}) { // HomeScreen.
    return ( // 공개 마케팅 홈. 역할 대시보드(`/director/dashboard` 등)가 아니다.
        <main className={styles.page}> // 헤더+쇼케이스+안내만.
            <HomeHeader viewer={viewer} /> // 브랜드·앵커 내비·로그인/대시보드 링크.
            <HomeShowcase notices={notices} /> // 공지 바·히어로·순환 배너.
            <HomeInformationSections /> // 과정·여정·오시는 길·푸터. 정적 안내만.
        </main> // 공개 홈 끝.
    );
}
