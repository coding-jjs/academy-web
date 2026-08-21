/**
 * 버튼·표면·타이포 className 조각 모음.
 * CSS 모듈을 Screen들이 공유해 톤이 갈라지지 않게 한다.
 *
 * 호출: 거의 모든 Screen/Panel. `import { buttonStyles, cx } from "@/components/ui/shared-styles"`.
 * 런타임 로직 없음. 클라이언트·서버 컴포넌트 모두 import 가능.
 *
 * 의도적으로 하지 않는 일:
 * - Tailwind/`cn`(clsx+twMerge)를 쓰지 않는다. 이 앱은 CSS 모듈 토큰.
 * - 셸 레이아웃 클래스(`Shells.module.css`)는 여기 없다 — 업무 크롬과 화면 토큰을 분리.
 *
 * 관련: 같은 폴더의 `*.module.css`.
 */

export { default as screenStyles } from "./screen.module.css"; // 화면 뼈대. 셸 CSS는 여기 없다.
export { default as pageHeadingStyles } from "./pageHeading.module.css"; // 페이지 제목. Screen 헤더.
export { default as buttonStyles } from "./button.module.css"; // 저장·승인 버튼. actions.ts 제출.
export { default as fieldStyles } from "./field.module.css"; // 폼 필드. Server Action FormData.
export { default as surfaceStyles } from "./surface.module.css"; // 카드 표면.
export { default as typographyStyles } from "./typography.module.css"; // 본문 타이포.
export { default as emptyStateStyles } from "./emptyState.module.css"; // 스코프·검색 0건 안내.
export { default as panelStyles } from "./panel.module.css"; // 목록/상세 패널.
export { default as dialogStyles } from "./dialog.module.css"; // 작성·확인 다이얼로그.
export { default as skeletonStyles } from "./skeleton.module.css"; // loading.tsx 자리.
export { default as a11yStyles } from "./a11y.module.css"; // 스크린리더 전용.
export { default as spinnerStyles } from "./spinner.module.css"; // pending 표시.

/**
 * falsy 클래스를 빼고 이어 붙인다. `className={cx(buttonStyles.primary, pending && styles.wait)}`.
 * 빈 문자열/false가 CSS 모듈에 `"false"`로 들어가지 않게 한다.
 */
export function cx(...classes: Array<string | false | null | undefined>) { // Tailwind cn이 아니다. CSS 모듈 토큰만.
    return classes.filter(Boolean).join(" "); // false가 CSS 모듈에 "false"로 들어가지 않게. Tailwind cn이 아니다.
}
