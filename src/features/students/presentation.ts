/**
 * 원생 상태·학습기록 라벨과 학교/날짜 표시 포맷터.
 *
 * 호출: 원장 원생/학부모/사용자 화면, 교사 원생·리포트, 학습기록 폼 등
 * DB enum을 화면에 그대로 쓰지 않고 UI 문구와 KST 날짜 문자열만 만든다.
 *
 * 의도적으로 하지 않는 일:
 * - 상태를 바꾸지 않는다 → `director-actions.updateStudentStatus`.
 * - 타임존 변환의 소스는 `@/lib/date-kst`. 여기 `formatEnrollmentChangeDate`만
 *   브라우저 로캘 `ko-KR`을 쓴다(수강 변경 짧은 날짜).
 *
 * 관련: `features/students/types.ts`, `lib/date-kst.ts`.
 */

import type { StudentStatus } from "@/features/students/types";
import { formatKstMonthDay } from "@/lib/date-kst";

/**
 * ENROLLED/PAUSED/WITHDRAWN → 재원/휴원/퇴원 칩.
 * tone은 StatusChip에 넘기는 시각 힌트일 뿐 권한과 무관하다.
 */
export const STUDENT_STATUS_METADATA: Record<
    StudentStatus,
    { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
    ENROLLED: { label: "재원", tone: "success" },
    PAUSED: { label: "휴원", tone: "warning" },
    WITHDRAWN: { label: "퇴원", tone: "neutral" },
};

/** LearningRecord.type enum → 한글. 키에 없는 값은 화면이 raw를 보여 줄 수 있다. */
export const LEARNING_RECORD_TYPE_LABELS: Record<string, string> = {
    CLASS_NOTE: "수업 기록",
    HOMEWORK: "숙제",
    LIFE_RECORD: "생활 기록",
};

/**
 * 학교명과 학년을 `학교 · n학년`으로 붙인다.
 *
 * @param schoolName Student.schoolName. 비어 있으면 학년만.
 * @param grade Student.grade. 비어 있으면 학교만.
 * @param emptyLabel 둘 다 없을 때. 기본 "미입력", 옵션 라벨에서는 "".
 */
export function formatStudentSchool(
    schoolName: string | null,
    grade: string | null,
    emptyLabel = "미입력",
) {
    if (!schoolName && !grade) return emptyLabel;
    if (!schoolName) return `${grade}학년`;
    if (!grade) return schoolName;
    return `${schoolName} · ${grade}학년`;
}

/**
 * select option용 `이름 · 학교 · n학년`.
 * 학교 정보가 없으면 이름만 남겨 빈 ` · `를 만들지 않는다.
 */
export function formatStudentOptionLabel(student: {
    name: string;
    schoolName: string | null;
    grade: string | null;
}) {
    const school = formatStudentSchool(student.schoolName, student.grade, "");
    return `${student.name}${school ? ` · ${school}` : ""}`;
}

/**
 * 학습 기록 날짜를 KST 월/일로 표시한다.
 *
 * @param isoDate ISO 시각. `formatKstMonthDay`가 Asia/Seoul을 적용한다.
 */
export function formatStudentRecordDate(isoDate: string) {
    return formatKstMonthDay(isoDate);
}

/**
 * 수강 해제 시각을 짧은 로캘 날짜로. 연도는 생략한다.
 */
export function formatEnrollmentChangeDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
    });
}

/**
 * `<input type="date">` 기본값 YYYY-MM-DD.
 * 서버 KST가 아니라 브라우저 로컬 오늘이다. 학습기록 폼 전용.
 */
export function getTodayDateInput() {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");

    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}
