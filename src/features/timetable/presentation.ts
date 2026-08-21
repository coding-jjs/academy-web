/**
 * 주간 시간표 요일 키(mon~sun)의 한글 한 글자 라벨.
 *
 * 호출: `ParentTimetableScreen`, `StudentTimetableScreen`이 그리드 헤더에 쓴다.
 * 날짜 계산·오늘 표시는 `data.ts`의 KST 주 구간(`getKstWeekRange`)이 담당한다.
 *
 * 의도적으로 하지 않는 일:
 * - Date를 포맷하지 않는다. 키→글자 맵만.
 * - 영문 요일을 쓰지 않는다. UI는 월~일.
 *
 * 관련: `features/timetable/types.ts`의 `WeekDayKey`.
 */

import type { WeekDayKey } from "@/features/timetable/types";

/**
 * 주간 그리드 열 제목. `data.ts` DAY_KEYS 순서(월 시작)와 맞춘다.
 * JS `Date.getDay()`는 일=0이라 session map은 sun부터인 별도 배열을 쓴다.
 */
export const WEEK_DAY_LABELS: Record<WeekDayKey, string> = {
    mon: "월",
    tue: "화",
    wed: "수",
    thu: "목",
    fri: "금",
    sat: "토",
    sun: "일",
};
