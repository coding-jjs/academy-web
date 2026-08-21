/**
 * 반 수업 일정의 datetime-local 기본 구간과 KST 표시 포맷.
 *
 * 호출: `ClassEditor`가 새 회차 기본값·목록 라벨에 쓴다.
 * 기본값은 다음 정시부터 1시간이며, 입력 값은 브라우저 local이 아니라
 * Asia/Seoul 문자열(`YYYY-MM-DDTHH:mm`)로 다룬다.
 * 서버 저장은 `classes/actions.parseKstDateTime`이 `+09:00`을 붙인다.
 *
 * 의도적으로 하지 않는 일:
 * - Date를 파싱해 DB에 쓰지 않는다. 문자열만 왕복한다.
 *
 * 관련: `features/classes/actions.ts`, `lib/date-kst.ts`.
 */

/**
 * ISO Instant를 서울 타임존 datetime-local 값으로 변환한다.
 * `en-CA`는 YYYY-MM-DD 부품을 안정적으로 얻기 위한 locale이다.
 *
 * @param isoDate UTC ISO. 빈 값이면 Invalid Date가 될 수 있다(호출 측 보장).
 */
export function toKstDateTimeInput(isoDate: string) {
    const dateParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date(isoDate));
    const getPart = (type: string) =>
        dateParts.find((part) => part.type === type)?.value ?? "00";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}

/**
 * 새 수업 폼 기본 구간: 다음 정시 ~ +1시간.
 * `setHours`는 브라우저 로컬이지만 곧 `toKstDateTimeInput`이 서울 문자열로 바꾼다.
 */
export function getDefaultClassSessionRange() {
    const startsAt = new Date();
    startsAt.setMinutes(0, 0, 0);
    startsAt.setHours(startsAt.getHours() + 1);

    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + 1);

    return {
        startsAt: toKstDateTimeInput(startsAt.toISOString()),
        endsAt: toKstDateTimeInput(endsAt.toISOString()),
    };
}

/**
 * 회차 목록에 쓰는 `MM.DD (요일) HH:mm ~ ...` KST 구간.
 *
 * @param startIso / endIso Attendance·시간표와 같은 ISO 저장값.
 */
export function formatClassSessionRange(startIso: string, endIso: string) {
    const formatter = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

    return `${formatter.format(new Date(startIso))} ~ ${formatter.format(new Date(endIso))}`;
}
