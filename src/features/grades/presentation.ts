/**
 * 오답 상태 라벨·톤.
 *
 * 호출: 입력 패널과 학부모/학생 뷰어가 상태 칩을 그릴 때 쓴다.
 * 화면이 OPEN/REVIEWED/MASTERED를 직접 해석하지 않도록 한곳에 둔다.
 *
 * 의도적으로 하지 않는 일:
 * - 상태 전환 규칙을 여기서 강제하지 않음 → `actions.ts`가 허용 값을 검사한다.
 *
 * 관련: `types.ts`의 WrongNoteStatus.
 */

import type { WrongNoteStatus } from "@/features/grades/types"; // 칩 라벨용. 전환 허용 값은 actions.ts.

/** 오답 복습 단계 → 화면 문구·칩 색. */
export const WRONG_NOTE_STATUS_METADATA: Record< // OPEN만 미복습 카운트. 칩 색만 여기.
    WrongNoteStatus, // 입력 패널·뷰어가 같은 맵을 쓴다.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // 화면 칩. 서버 enum이 아니다.
> = { // 상태 코드를 화면이 직접 해석하지 않게.
    OPEN: { label: "복습 필요", tone: "warning" }, // 미복습. 하이라이트 카운트에만 들어간다.
    REVIEWED: { label: "복습함", tone: "neutral" }, // 카운트에서 뺀다. 전환은 actions.ts.
    MASTERED: { label: "완료", tone: "success" }, // 카운트에서 뺀다. 삭제는 없다.
};
