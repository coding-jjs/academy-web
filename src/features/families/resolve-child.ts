export function resolveChild(
    childIds: string[],
    requested: string | null | undefined,
): string {
    if (requested && childIds.includes(requested)) {
        return requested;
    }
    return childIds[0] ?? "";
}
