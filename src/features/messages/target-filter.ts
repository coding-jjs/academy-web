import type { MessageTargetFilter } from "@/features/messages/types";

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

export function formatTargetNames(names: string[]) {
    if (names.length === 0) return "대상 없음";
    return names.join(", ");
}
