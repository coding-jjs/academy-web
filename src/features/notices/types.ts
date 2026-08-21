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
export type Notice = { // 공개 /notices. 역할 피드 NewsItem과 DTO를 나눈다.
    id: string; // NewsItem id. kind=NOTICE 행만.
    audience: string; // 한글 라벨. 화면이 DB enum을 모르게.
    title: string; // 80자. 카드 한 줄.
    date: string; // MM.DD(KST). formatNoticeListDate.
    body: string; // 공개 목록은 공백이면 "내용이 없습니다."
    imageUrl: string | null; // 버킷 notices 공개 URL. MIME/5MB는 업로드 쪽.
};

/** 무한 스크롤 한 번에 붙이는 카드 수. */
export const NOTICE_PAGE_SIZE = 8; // 서버를 다시 치지 않고 이미 받은 목록을 자른다.

/** DB audience → 카드에 찍는 한글. 모르는 코드는 data.ts가 "전체"로 떨어뜨린다. */
export const NOTICE_AUDIENCE_LABELS: Record<string, string> = { // 공개 카드 라벨. 피드 카테고리 칩이 아니다.
    ALL: "전체", // 공개 /notices where audience=ALL.
    PARENT: "학부모", // 공개 목록 쿼리에는 안 넣는다.
    STUDENT: "학생", // 공개 목록 쿼리에는 안 넣는다.
};

/**
 * 제목 부분 일치(대소문자 무시). 서버를 다시 치지 않고 이미 받은 목록을 걸른다.
 */
export function filterNoticesByTitle(notices: Notice[], query: string) { // 클라이언트 제목 검색. 본문은 안 본다.
    const normalized = query.trim().toLowerCase(); // 앞뒤 공백 무시. 서버를 다시 치지 않는다.
    if (!normalized) return notices; // 빈 검색은 전체 공개 목록.
    return notices.filter((notice) => // 이미 받은 목록만. kind=NOTICE 공개 카드.
        notice.title.toLowerCase().includes(normalized), // 제목 부분 일치. 본문은 안 본다.
    );
}

/**
 * 목록용 월.일(KST). en-CA 파트로 잘라 로케일 숫자 차이를 피한다.
 */
export function formatNoticeListDate(date: Date | string) { // 공개 카드 MM.DD. 피드 ISO와 형식이 다르다.
    const parts = new Intl.DateTimeFormat("en-CA", { // en-CA 숫자. 로케일 월 이름을 피한다.
        timeZone: "Asia/Seoul", // UTC 자정으로 자르면 저녁 공지가 전날이 된다.
        month: "2-digit", // 월 숫자.
        day: "2-digit", // 일 숫자.
    }).formatToParts(typeof date === "string" ? new Date(date) : date); // ISO 문자열·Date 둘 다.

    const month = parts.find((part) => part.type === "month")?.value ?? "01"; // en-CA 숫자. 로케일 월 이름을 피한다.
    const day = parts.find((part) => part.type === "day")?.value ?? "01"; // 파트가 없으면 01.
    return `${month}.${day}`; // 공개 카드용 MM.DD.
}
