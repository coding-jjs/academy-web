/**
 * /notices 공개 목록용 Notice DTO와 제목 검색·날짜 표시.
 *
 * 호출: NoticesScreen, HomeShowcase, notices/data.ts.
 * audience 코드는 한글 라벨로만 내려 화면이 DB enum을 모르게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 피드 NewsItem DTO → `news/types.ts`.
 * - 이미지 업로드 한도 → `@/lib/supabase/notice-storage` (5MB jpeg/png/webp).
 *
 * 관련: `NoticesScreen.tsx`, `data.ts`.
 */

/** 공개 목록 카드. date는 MM.DD(KST), audience는 한글 라벨. */
export type Notice = {
    id: string;
    audience: string;
    title: string;
    date: string;
    body: string;
    imageUrl: string | null;
};

/** 무한 스크롤 한 번에 붙이는 카드 수. */
export const NOTICE_PAGE_SIZE = 8;

/** DB audience → 카드에 찍는 한글. 모르는 코드는 data.ts가 "전체"로 떨어뜨린다. */
export const NOTICE_AUDIENCE_LABELS: Record<string, string> = {
    ALL: "전체",
    PARENT: "학부모",
    STUDENT: "학생",
};

/**
 * 제목 부분 일치(대소문자 무시). 서버를 다시 치지 않고 이미 받은 목록을 걸른다.
 */
export function filterNoticesByTitle(notices: Notice[], query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notices;
    return notices.filter((notice) =>
        notice.title.toLowerCase().includes(normalized),
    );
}

/**
 * 목록용 월.일(KST). en-CA 파트로 잘라 로케일 숫자 차이를 피한다.
 */
export function formatNoticeListDate(date: Date | string) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(typeof date === "string" ? new Date(date) : date);

    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return `${month}.${day}`;
}
