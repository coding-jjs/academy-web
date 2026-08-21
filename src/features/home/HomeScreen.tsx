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

import HomeHeader from "@/features/home/components/HomeHeader";
import HomeInformationSections from "@/features/home/components/HomeInformationSections";
import HomeShowcase from "@/features/home/components/HomeShowcase";
import type { HomeViewer } from "@/features/home/types";
import type { Notice } from "@/features/notices/types";
import styles from "./HomeScreen.module.css";

/**
 * 헤더·쇼케이스·안내 섹션만 조립한다.
 * viewer가 null이면 비로그인 헤더(로그인/가입).
 */
export default function HomeScreen({
    viewer,
    notices,
}: {
    viewer: HomeViewer | null;
    notices: Notice[];
}) {
    return (
        <main className={styles.page}>
            <HomeHeader viewer={viewer} />
            <HomeShowcase notices={notices} />
            <HomeInformationSections />
        </main>
    );
}
