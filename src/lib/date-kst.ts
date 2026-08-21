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
export function getKstDayRange(now = new Date()) {
    const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    const startOfToday = new Date(`${day}T00:00:00+09:00`);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    return { day, startOfToday, endOfToday };
}

/**
 * 퇴원 당일 KST 자정(다음날 00:00)까지 조회 유예.
 * 오전에 퇴원해도 그날 저녁까지 학부모/학생이 출석·리포트를 볼 수 있게 한다.
 * 유예가 끝나면 `finalizeExpiredWithdrawalsForUser`가 User를 WITHDRAWN으로 확정한다.
 */
export function getWithdrawalAccessUntil(withdrawnAt: Date) {
    return getKstDayRange(withdrawnAt).endOfToday;
}

/**
 * 유예가 지났으면 true. withdrawnAt이 없으면 false (아직 퇴원 전).
 * `now >= endOfToday` — 다음날 00:00 KST부터 만료.
 */
export function isPastWithdrawalGrace(
    withdrawnAt: Date | null | undefined,
    now = new Date(),
) {
    if (!withdrawnAt) return false;
    return now.getTime() >= getWithdrawalAccessUntil(withdrawnAt).getTime();
}

/**
 * 오늘 끝과 "오늘 시작에서 daysBack일 전" 시작.
 * 담당 학생 목록의 최근 출석 구간처럼, 달력일 N일을 UTC 시차로 밀지 않기 위함.
 */
export function getKstRecentRange(daysBack: number, now = new Date()) {
    const { startOfToday, endOfToday } = getKstDayRange(now);
    const startRecent = new Date(startOfToday);
    startRecent.setDate(startRecent.getDate() - daysBack);
    return { startOfToday, endOfToday, startRecent };
}

/**
 * KST 월요일 00:00 ~ 다음 월요일 00:00.
 * JS `getDay()`는 일=0이라 일요일이면 -6으로 이번 주 월요일로 되돌린다
 * (주간 시간표가 일요일을 다음 주가 아니라 이번 주 끝으로 넣지 않게).
 */
export function getKstWeekRange(now = new Date()) {
    const { startOfToday } = getKstDayRange(now);

    const jsDay = startOfToday.getDay();
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() + mondayOffset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return { startOfToday, startOfWeek, endOfWeek };
}

type DateInput = Date | string;

function toDate(date: DateInput) {
    return typeof date === "string" ? new Date(date) : date;
}

/** 화면용 `HH:mm` (24시간, KST). 출석 회차 시각. */
export function formatKstTime(date: DateInput) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(toDate(date));
}

/** 화면용 `MM. DD.` 쪽지·대시보드 상대적 날짜. */
export function formatKstMonthDay(date: DateInput) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
    }).format(toDate(date));
}

/** 화면용 연-월-일. 성적 assessedAt 등. */
export function formatKstYearMonthDay(date: DateInput) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(toDate(date));
}

/** 화면용 날짜+시각. 상담 메모 작성 시각. */
export function formatKstDateTime(date: DateInput) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(toDate(date));
}

/** 회차 시작~끝 `16:00~17:30`. 대시보드 오늘 수업 한 줄. */
export function formatKstSessionTime(session: {
    startsAt: Date;
    endsAt: Date;
}) {
    return `${formatKstTime(session.startsAt)}~${formatKstTime(session.endsAt)}`;
}
