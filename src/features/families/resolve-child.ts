/**
 * 학부모 화면의 childId를 링크된 자녀 목록 안에서만 고른다.
 *
 * 호출: parent dashboard/grades/reports/attendance/timetable `page.tsx`가
 * 쿠키·쿼리의 요청 id와 링크된 `childIds`를 넘긴다.
 *
 * 쿠키/쿼리에 없는 id가 오면 목록의 첫 자녀로 떨어뜨려 타인 원생 조회를 막는다.
 * 목록이 비면 빈 문자열을 돌려 화면이 "연결된 자녀 없음"을 그리게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - DB를 치지 않는다. 이미 가져온 링크 id 배열만 본다.
 * - 쿠키를 고치지 않는다. 잘못된 값은 이번 요청에서만 무시한다.
 *
 * 관련: `features/families/parent-child-cooke.ts`, `features/families/actions.ts`.
 */

/**
 * 요청된 자녀 id가 링크 목록에 있을 때만 채택한다.
 *
 * @param childIds 현재 학부모의 활성 ParentStudentLink studentId 목록.
 * @param requested 쿠키 또는 searchParam. 없거나 목록 밖이면 무시.
 * @returns 허용된 id, 없으면 `childIds[0]`, 자녀가 없으면 `""`.
 */
export function resolveChild(
    childIds: string[],
    requested: string | null | undefined,
): string {
    if (requested && childIds.includes(requested)) {
        return requested;
    }
    return childIds[0] ?? "";
}
