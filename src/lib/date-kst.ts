/**
 * KST 기준 오늘/주/최근 N일·퇴원 유예 끝·화면 포맷.
 * 서버 시각은 UTC인데 학원 업무일은 한국 날짜라, `new Date()` 자정으로 자르면
 * 저녁 출석이 전날로 떨어지거나 유예가 9시간 일찍 끝난다.
 *
 * 호출: 대시보드·출석·성적 페이지, `student-lifecycle` 유예 판정, 화면 포맷터.
 * 읽기 전용 순수 함수. 클라이언트 포맷(`formatKst*`)과 서버 범위 계산이 같이 import한다.
 *
 * 의도적으로 하지 않는 일:
 * - DB에 KST 문자열을 저장하지 않는다. 비교는 항상 `Date`(UTC 인스턴트)로 한다.
 * - 학원 타임존을 설정 가능하게 하지 않는다. Asia/Seoul 고정.
 *
 * 관련: `student-lifecycle.ts`, `churn-detect.ts`.
 */

/**
 * 지금 시각이 속한 KST 달력일을 `[startOfToday, endOfToday)`로 돌려준다.
 * `en-CA`는 `YYYY-MM-DD`라 `T00:00:00+09:00`에 붙이기 쉽다.
 * end는 다음날 00:00(포함 안 함) — `lt: endOfToday` 쿼리용.
 */
export function getKstDayRange(now = new Date()) { // UTC 인스턴트 → KST 달력일. 서버 자정으로 자르면 저녁 출석이 전날이 된다.
    const day = new Intl.DateTimeFormat("en-CA", { // YYYY-MM-DD. T00:00:00+09:00에 붙이기 쉽다.
        timeZone: "Asia/Seoul", // 학원 업무일 고정. 설정 가능하게 하지 않는다.
        year: "numeric", // 4자리.
        month: "2-digit", // 01-12.
        day: "2-digit", // 01-31.
    }).format(now); // KST 달력 문자열. DB에는 저장하지 않는다.

    const startOfToday = new Date(`${day}T00:00:00+09:00`); // 학원 업무일 시작. DB에는 UTC 인스턴트로 비교.
    const endOfToday = new Date(startOfToday); // 다음날 00:00 미포함용 복사.
    endOfToday.setDate(endOfToday.getDate() + 1); // 다음날 00:00 미포함. lt: endOfToday 쿼리용.

    return { day, startOfToday, endOfToday }; // churn·출석·유예가 같은 창을 쓰게.
}

/**
 * 퇴원 당일 KST 자정(다음날 00:00)까지 조회 유예.
 * 오전에 퇴원해도 그날 저녁까지 학부모/학생이 출석·리포트를 볼 수 있게 한다.
 * 유예가 끝나면 `finalizeExpiredWithdrawalsForUser`가 User를 WITHDRAWN으로 확정한다.
 */
export function getWithdrawalAccessUntil(withdrawnAt: Date) { // 퇴원 당일 끝. 원장·교사·직원 로그인은 원생 퇴원과 안 묶는다.
    return getKstDayRange(withdrawnAt).endOfToday; // 퇴원 당일 KST 다음날 00:00. 오전에 퇴원해도 그날 저녁까지 조회 가능.
}

/**
 * 유예가 지났으면 true. withdrawnAt이 없으면 false (아직 퇴원 전).
 * `now >= endOfToday` — 다음날 00:00 KST부터 만료.
 */
export function isPastWithdrawalGrace( // Asia/Seoul 달력일. DB에는 UTC 인스턴트.
    withdrawnAt: Date | null | undefined, // 없으면 유예 대상이 아님. PAUSED는 여기 안 온다.
    now = new Date(), // 로그인 가드가 매 요청 넘긴다. 배치를 기다리지 않는다.
) { // 다음날 00:00 KST부터 확정. JWT가 살아 있어도 getUsableAccount가 막는다.
    if (!withdrawnAt) return false; // 퇴원 시각이 없으면 유예 대상이 아님. PAUSED는 여기 안 온다.
    return now.getTime() >= getWithdrawalAccessUntil(withdrawnAt).getTime(); // 다음날 00:00 KST부터 로그인 가드가 확정한다.
}

/**
 * 오늘 끝과 "오늘 시작에서 daysBack일 전" 시작.
 * 담당 학생 목록의 최근 출석 구간처럼, 달력일 N일을 UTC 시차로 밀지 않기 위함.
 */
export function getKstRecentRange(daysBack: number, now = new Date()) { // 담당 학생 최근 출석. churn 14일 창과 별개.
    const { startOfToday, endOfToday } = getKstDayRange(now); // 오늘 끝과 "오늘 시작에서 daysBack일 전". UTC 시차로 달력일을 밀지 않기 위함.
    const startRecent = new Date(startOfToday); // 복사 후 daysBack을 뺀다.
    startRecent.setDate(startRecent.getDate() - daysBack); // 담당 학생 최근 출석 구간. churn 14일 창과 별개.
    return { startOfToday, endOfToday, startRecent }; // lt: endOfToday 쿼리용.
}

/**
 * KST 월요일 00:00 ~ 다음 월요일 00:00.
 * JS `getDay()`는 일=0이라 일요일이면 -6으로 이번 주 월요일로 되돌린다
 * (주간 시간표가 일요일을 다음 주가 아니라 이번 주 끝으로 넣지 않게).
 */
export function getKstWeekRange(now = new Date()) { // 주간 시간표. 일요일을 다음 주로 밀지 않는다.
    const { startOfToday } = getKstDayRange(now); // KST 오늘 시작. 서버 자정이 아님.

    const jsDay = startOfToday.getDay(); // JS 일=0을 이번 주 월요일로. 일요일을 다음 주로 밀지 않는다.
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay; // 주간 시간표가 일요일을 이번 주 끝으로.

    const startOfWeek = new Date(startOfToday); // 이번 주 월요일 00:00 KST.
    startOfWeek.setDate(startOfToday.getDate() + mondayOffset); // 월요일로 되돌린다.

    const endOfWeek = new Date(startOfWeek); // 다음 월요일 00:00. lt 쿼리용.
    endOfWeek.setDate(startOfWeek.getDate() + 7); // 다음 월요일 00:00. lt 쿼리용.

    return { startOfToday, startOfWeek, endOfWeek }; // 시간표 회차 where.
}

type DateInput = Date | string; // ISO면 Date로. DB에는 KST 문자열을 저장하지 않는다.

function toDate(date: DateInput) { // 화면 포맷터가 Date·ISO 둘 다 받게.
    return typeof date === "string" ? new Date(date) : date; // ISO 문자열이면 Date로. 화면 포맷터가 둘 다 받게. DB에는 KST 문자열을 저장하지 않는다.
}

/** 화면용 `HH:mm` (24시간, KST). 출석 회차 시각. */
export function formatKstTime(date: DateInput) { // 출석 회차. 서버 TZ와 무관.
    return new Intl.DateTimeFormat("ko-KR", { // 24시간. hour12 false.
        timeZone: "Asia/Seoul", // 학원 화면. DB 인스턴트는 UTC.
        hour: "2-digit", // 16:00.
        minute: "2-digit", // 00.
        hour12: false, // 출석 회차. 서버 TZ와 무관.
    }).format(toDate(date)); // HH:mm. 회차 시작~끝에 쓴다.
}

/** 화면용 `MM. DD.` 쪽지·대시보드 상대적 날짜. */
export function formatKstMonthDay(date: DateInput) { // 쪽지·대시보드. 연도는 생략.
    return new Intl.DateTimeFormat("ko-KR", { // MM. DD.
        timeZone: "Asia/Seoul", // 학원 달력일.
        month: "2-digit", // 08.
        day: "2-digit", // 19.
    }).format(toDate(date)); // 상대적 날짜. 성적 assessedAt은 YearMonthDay.
}

/** 화면용 연-월-일. 성적 assessedAt 등. */
export function formatKstYearMonthDay(date: DateInput) { // 성적 일자. Invoice dueDate 화면.
    return new Intl.DateTimeFormat("ko-KR", { // 연-월-일.
        timeZone: "Asia/Seoul", // 학원 달력일.
        year: "numeric", // 2026.
        month: "2-digit", // 08.
        day: "2-digit", // 19.
    }).format(toDate(date)); // 성적 assessedAt 등.
}

/** 화면용 날짜+시각. 상담 메모 작성 시각. */
export function formatKstDateTime(date: DateInput) { // 상담 메모. 초안 생성 시각.
    return new Intl.DateTimeFormat("ko-KR", { // 날짜+시각 24시간.
        timeZone: "Asia/Seoul", // 학원 화면.
        year: "numeric", // 연.
        month: "2-digit", // 월.
        day: "2-digit", // 일.
        hour: "2-digit", // 시.
        minute: "2-digit", // 분.
        hour12: false, // 24시간. 출석 회차와 맞춤.
    }).format(toDate(date)); // 상담 메모 작성 시각.
}

/** 회차 시작~끝 `16:00~17:30`. 대시보드 오늘 수업 한 줄. */
export function formatKstSessionTime(session: { // Asia/Seoul 달력일. DB에는 UTC 인스턴트.
    startsAt: Date; // 회차 시작. UTC 인스턴트.
    endsAt: Date; // 회차 끝. UTC 인스턴트.
}) { // 대시보드 오늘 수업 한 줄.
    return `${formatKstTime(session.startsAt)}~${formatKstTime(session.endsAt)}`; // 대시보드 오늘 수업 한 줄. 시작~끝을 KST 24시간으로.
}
