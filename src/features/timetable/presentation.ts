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

import type { WeekDayKey } from "@/features/timetable/types"; // 그리드 열. getDay() 일=0과 순서가 다르다.

/**
 * 주간 그리드 열 제목. `data.ts` DAY_KEYS 순서(월 시작)와 맞춘다.
 * JS `Date.getDay()`는 일=0이라 session map은 sun부터인 별도 배열을 쓴다.
 */
export const WEEK_DAY_LABELS: Record<WeekDayKey, string> = { // Screen 헤더. Date 포맷이 아니다.
    mon: "월", // 그리드 첫 열. getDay() 월=1과 맞추려면 session map이 sun부터.
    tue: "화", // 화요일 열.
    wed: "수", // 수요일 열.
    thu: "목", // 목요일 열.
    fri: "금", // 금요일 열.
    sat: "토", // 토요일 열.
    sun: "일", // 마지막 열. getDay() 일=0과 키가 같다.
};
