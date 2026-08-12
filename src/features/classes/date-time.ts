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
