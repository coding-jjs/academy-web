/**
 * 학부모가 선택한 자녀 id를 `parent_child_id` 쿠키로 읽고 쓴다.
 *
 * 호출:
 * - 읽기: parent dashboard/grades/reports/attendance/timetable `page.tsx`
 * - 쓰기: 각 Parent*Screen이 자녀 전환 시 `writeParentChildCookie`
 *
 * 대시보드 전환을 서버 왕복 없이 기억한다.
 * 쿠키 값의 권한 검증은 하지 않는다 → `resolve-child.ts`가 링크 목록과 대조한다.
 *
 * 의도적으로 하지 않는 일:
 * - httpOnly/secure 서버 쿠키를 쓰지 않는다. 클라이언트 Path=/ SameSite=Lax.
 * - 타인 원생 id를 걸러 내지 않는다. 위조된 쿠키는 resolveChild가 첫 자녀로 떨어뜨린다.
 *
 * 관련: `features/families/resolve-child.ts`.
 * 파일명 cooke는 cookie 오타이나 기존 import 경로를 유지한다.
 */

/** 학부모 화면이 공유하는 선택 자녀 쿠키 이름. */
export const PARENT_CHILD_COOKIE = "parent_child_id";

/**
 * Next cookies() 스토어에서 선택 자녀 id를 읽는다.
 *
 * @param cookieStore `cookies()`와 같이 `.get(name)`만 있는 객체.
 * @returns 쿠키 값 또는 undefined. 디코드하지 않는다(쓰기가 encodeURIComponent).
 */
export function readParentChildCookie(cookieStore: {
    get: (name: string) => { value: string } | undefined;
}): string | undefined {
    return cookieStore.get(PARENT_CHILD_COOKIE)?.value;
}

/**
 * 브라우저에서 선택 자녀를 1년 동안 기억한다.
 *
 * @param childId 링크된 자녀 Student.id. 호출 측이 목록에 있는 id만 넘긴다.
 * @sideEffects `document.cookie` 기록. 서버 액션이 아니다.
 */
export function writeParentChildCookie(childId: string) {
    document.cookie = `${PARENT_CHILD_COOKIE}=${encodeURIComponent(childId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
