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

import type { WrongNoteStatus } from "@/features/grades/types";

/** 오답 복습 단계 → 화면 문구·칩 색. */
export const WRONG_NOTE_STATUS_METADATA: Record<
    WrongNoteStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    OPEN: { label: "복습 필요", tone: "warning" },
    REVIEWED: { label: "복습함", tone: "neutral" },
    MASTERED: { label: "완료", tone: "success" },
};
