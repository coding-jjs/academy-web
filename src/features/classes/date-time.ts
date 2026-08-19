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
export function toKstDateTimeInput(isoDate: string) { // 브라우저 local이 아니라 학원 표준시 문자열.
    const dateParts = new Intl.DateTimeFormat("en-CA", { // YYYY-MM-DD 부품. ko-KR은 순서가 다르다.
        timeZone: "Asia/Seoul", // 브라우저 local이 아니라 학원 표준시.
        year: "numeric", // YYYY.
        month: "2-digit", // MM.
        day: "2-digit", // DD.
        hour: "2-digit", // HH.
        minute: "2-digit", // mm.
        hour12: false, // 24시. datetime-local과 맞춘다.
    }).formatToParts(new Date(isoDate)); // Instant → 서울 부품.
    const getPart = (type: string) => // 없는 부품은 00.
        dateParts.find((part) => part.type === type)?.value ?? "00"; // year/month/day/hour/minute.

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`; // datetime-local. 서버가 +09:00을 붙인다.
}

/**
 * 새 수업 폼 기본 구간: 다음 정시 ~ +1시간.
 * `setHours`는 브라우저 로컬이지만 곧 `toKstDateTimeInput`이 서울 문자열로 바꾼다.
 */
export function getDefaultClassSessionRange() { // DB에 Date를 쓰지 않는다. 문자열만 왕복.
    const startsAt = new Date(); // 지금.
    startsAt.setMinutes(0, 0, 0); // 정시로 내림.
    startsAt.setHours(startsAt.getHours() + 1); // 다음 정시. 로컬이지만 곧 서울 문자열로 바꾼다.

    const endsAt = new Date(startsAt); // 시작 복사.
    endsAt.setHours(endsAt.getHours() + 1); // 기본 수업 길이 1시간.

    return { // ClassEditor sessionRange 초기값.
        startsAt: toKstDateTimeInput(startsAt.toISOString()), // YYYY-MM-DDTHH:mm 서울.
        endsAt: toKstDateTimeInput(endsAt.toISOString()), // +1시간 서울.
    };
}

/**
 * 회차 목록에 쓰는 `MM.DD (요일) HH:mm ~ ...` KST 구간.
 *
 * @param startIso / endIso Attendance·시간표와 같은 ISO 저장값.
 */
export function formatClassSessionRange(startIso: string, endIso: string) { // 출석·시간표와 같은 학원 시각.
    const formatter = new Intl.DateTimeFormat("ko-KR", { // 목록 라벨. datetime-local이 아니다.
        timeZone: "Asia/Seoul", // 출석·시간표와 같은 학원 시각.
        month: "2-digit", // MM.
        day: "2-digit", // DD.
        weekday: "short", // (요일).
        hour: "2-digit", // HH.
        minute: "2-digit", // mm.
    });

    return `${formatter.format(new Date(startIso))} ~ ${formatter.format(new Date(endIso))}`; // 편집기 회차 한 줄.
}
