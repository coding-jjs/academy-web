import type { WrongNoteStatus } from "@/features/grades/types";

export const WRONG_NOTE_STATUS_METADATA: Record<
    WrongNoteStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    OPEN: { label: "복습 필요", tone: "warning" },
    REVIEWED: { label: "복습함", tone: "neutral" },
    MASTERED: { label: "완료", tone: "success" },
};
