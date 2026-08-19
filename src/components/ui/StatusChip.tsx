/**
 * 상태 뱃지 UI.
 * 출석·리포트·문의 등 한글 라벨+색을 화면마다 다시 짜지 않게 한다.
 *
 * 호출: 대시보드·성적·청구·쪽지 등 다수 Screen. 의미(출석 PRESENT)는 호출부가
 * 한글로 넣고, 이 컴포넌트는 tone만 칠한다.
 *
 * 서버/클라이언트 모두 가능 (hooks 없음). 쓰기는 없음.
 *
 * 의도적으로 하지 않는 일:
 * - Prisma enum을 여기서 매핑하지 않는다. 화면별 `STATUS_METADATA`가 tone+label을 고른다.
 * - 클릭/필터를 겸하지 않는다. 배지일 뿐 버튼이 아니다.
 *
 * 관련: `StatusChip.module.css`, 각 feature의 presentation 맵.
 */

import type { ReactNode } from "react"; // children. Prisma enum 매핑은 호출부.
import styles from "./StatusChip.module.css"; // tone 색. 클릭 필터가 아니다.

/**
 * @param tone CSS `data-tone`. 기본 neutral — 건수 칩처럼 색이 의미 없을 때.
 */
export default function StatusChip({ // tone만. Prisma enum 매핑은 Screen.
    tone = "neutral", // 건수 칩처럼 색이 의미 없을 때. Prisma enum은 여기 없다.
    children, // 호출부가 한글 라벨을 넣는다. 출석 PRESENT 매핑은 Screen.
}: { // tone만. Prisma enum 매핑은 Screen.
    tone?: "neutral" | "success" | "warning" | "danger"; // CSS data-tone. 클릭/필터를 겸하지 않는다.
    children: ReactNode; // 화면별 STATUS_METADATA가 tone+label을 고른다.
}) { // 배지일 뿐 버튼이 아니다. 필터는 Screen.
    return ( // tone으로 색만 칠한다.
        <span className={styles.chip} data-tone={tone}> {/* tone으로 색만 칠한다. Prisma enum 매핑·클릭 필터가 아니다. */}
            {children} {/* 호출부 한글. ENROLLED/PAUSED/WITHDRAWN 매핑은 Screen. */}
        </span> {/* tone만. Prisma enum 매핑은 Screen. */}
    );
}
