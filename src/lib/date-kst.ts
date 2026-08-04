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

export function getKstRecentRange(daysBack: number, now = new Date()) {
    const { startOfToday, endOfToday } = getKstDayRange(now);
    const startRecent = new Date(startOfToday);
    startRecent.setDate(startRecent.getDate() - daysBack);
    return { startOfToday, endOfToday, startRecent };
}

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

export function formatKstTime(date: Date) {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}