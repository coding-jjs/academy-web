/**
 * 공개 홈에 넘기는 로그인 뷰어(이름·역할 라벨·대시보드 경로)다.
 *
 * 호출: `app/page.tsx`가 세션에서 만들고 `HomeHeader`가 읽는다.
 * 비로그인이면 null이라, 헤더가 로그인/가입과 대시보드를 갈라 그린다.
 *
 * 의도적으로 하지 않는 일:
 * - 역할 홈 지표. 이 타입은 마케팅 페이지 헤더용이다.
 * - 권한 검사. 경로만 `getRoleHomePath`로 붙인다.
 *
 * 관련: `HomeScreen.tsx`, `app/page.tsx`.
 */

/** 로그인한 방문자의 헤더 요약. 대시보드는 역할 홈으로만 링크한다. */
export type HomeViewer = {
    name: string;
    roleLabel: string;
    dashboardHref: string;
};
