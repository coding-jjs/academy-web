/**
 * 성적 평가일·점수 변화량을 화면 문구로 바꾼다.
 *
 * 호출: 입력 패널과 학부모/학생 성적 화면.
 * 날짜는 KST로 맞춰 입력 화면의 maxAssessedDate(오늘 KST)와 어긋나지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - Prisma Decimal을 UI가 직접 다루지 않음. 조회 쪽에서 number로 내려준다.
 * - 퍼센트 계산은 `viewer-data.ts`의 mapGradeRecord가 한다.
 *
 * 관련: `@/lib/date-kst`.
 */

import { formatKstYearMonthDay } from "@/lib/date-kst";

/** ISO 평가일을 KST 연·월·일로 표시. */
export function formatGradeDate(isoDate: string) {
    return formatKstYearMonthDay(isoDate);
}

/**
 * 직전 점수 대비 변화. 비교 대상이 없으면 "비교 없음".
 * 음수는 이미 부호가 있어 `이전 대비 ${delta}`로만 붙인다.
 */
export function formatGradeDelta(delta: number | null) {
    if (delta == null) return "비교 없음";
    if (delta > 0) return `이전 대비 +${delta}`;
    if (delta < 0) return `이전 대비 ${delta}`;
    return "이전과 동일";
}
