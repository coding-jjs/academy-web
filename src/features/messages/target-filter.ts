/**
 * Message.targetFilter Json을 안전한 객체로 파싱한다.
 *
 * 호출: 승인 시 `actions.ts`가 저장된 필터를 다시 읽고, `data.ts`가 목록 요약을 만든다.
 * 잘못된 형태는 null로 버려 승인 시 전원 발송이 되지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - DB에 쓰지 않음. 파싱만 한다.
 * - 알 수 없는 키를 통과시키지 않음. studentIds / parentUserIds / broadcast만.
 *
 * 관련: `types.ts`의 MessageTargetFilter.
 */

import type { MessageTargetFilter } from "@/features/messages/types";

/**
 * Prisma Json 값을 대상 필터로 바꾼다.
 * 배열이 비고 broadcast도 아니면 null — 빈 객체로 전원 발송하는 길을 막는다.
 */
export function parseTargetFilter(value: unknown): MessageTargetFilter | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const studentIds = Array.isArray(record.studentIds)
        ? record.studentIds.filter(
              (id): id is string => typeof id === "string" && id.trim().length > 0,
          )
        : undefined;
    const parentUserIds = Array.isArray(record.parentUserIds)
        ? record.parentUserIds.filter(
              (id): id is string =>
                  typeof id === "string" && id.trim().length > 0,
          )
        : undefined;
    const broadcast = record.broadcast === true;

    if (!studentIds?.length && !parentUserIds?.length && !broadcast) {
        return null;
    }

    return {
        ...(studentIds?.length ? { studentIds } : {}),
        ...(parentUserIds?.length ? { parentUserIds } : {}),
        ...(broadcast ? { broadcast: true } : {}),
    };
}

/** 목록 요약용 이름 나열. 비어 있으면 "대상 없음". */
export function formatTargetNames(names: string[]) {
    if (names.length === 0) return "대상 없음";
    return names.join(", ");
}
