/**
 * App Router `template.tsx`. 매 라우트 전환마다 다시 마운트된다.
 *
 * `route-transition-shell` 클래스로 페이지 이동 페이드만 건다.
 * 권한·데이터·셸은 건드리지 않는다. layout이 유지하는 내비와 달리
 * 여기서는 children을 감싼 div만 교체한다.
 */

/** 전환 애니메이션 래퍼. 역할 가드를 하지 않는다. */
export default function Template({ children }: { children: React.ReactNode }) { // 라우트마다 다시 마운트. 가드는 layout.
    return <div className="route-transition-shell">{children}</div>; // 페이드만. 권한·데이터는 layout/page 몫.
} // 블록 끝.
