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

import type { StudentStatus } from "@/features/students/types"; // ENROLLED/PAUSED/WITHDRAWN. 전이는 actions.
import { formatKstMonthDay } from "@/lib/date-kst"; // 학습기록 월/일. Asia/Seoul.

/**
 * ENROLLED/PAUSED/WITHDRAWN → 재원/휴원/퇴원 칩.
 * tone은 StatusChip에 넘기는 시각 힌트일 뿐 권한과 무관하다.
 */
export const STUDENT_STATUS_METADATA: Record< // Screen 칩. lifecycle이 상태를 바꾼다.
    StudentStatus, // 세 값만.
    { label: string; tone: "neutral" | "success" | "warning" | "danger" } // StatusChip tone. 권한과 무관.
> = { // 수강 추가·학부모 연결 가능 여부의 힌트.
    ENROLLED: { label: "재원", tone: "success" }, // 수강 추가 가능. 학부모 연결 후보.
    PAUSED: { label: "휴원", tone: "warning" }, // 수강은 유지 가능. 신규 학부모 연결은 안 함.
    WITHDRAWN: { label: "퇴원", tone: "neutral" }, // 수강 추가 거절. 당일 로그인 유예는 lifecycle.
};

/** LearningRecord.type enum → 한글. 키에 없는 값은 화면이 raw를 보여 줄 수 있다. */
export const LEARNING_RECORD_TYPE_LABELS: Record<string, string> = { // 상담 메모와 다른 테이블.
    CLASS_NOTE: "수업 기록", // createLearningRecord 타입.
    HOMEWORK: "숙제", // createLearningRecord 타입.
    LIFE_RECORD: "생활 기록", // editLifeCounseling과 별개. 학습기록 create만.
};

/**
 * 학교명과 학년을 `학교 · n학년`으로 붙인다.
 *
 * @param schoolName Student.schoolName. 비어 있으면 학년만.
 * @param grade Student.grade. 비어 있으면 학교만.
 * @param emptyLabel 둘 다 없을 때. 기본 "미입력", 옵션 라벨에서는 "".
 */
export function formatStudentSchool( // Screen 라벨. DB를 쓰지 않는다.
    schoolName: string | null, // 온보딩·카드 학교.
    grade: string | null, // 1~12 문자열.
    emptyLabel = "미입력", // 옵션 라벨은 ""를 넘겨 빈 ` · `를 막는다.
) { // 둘 다 없으면 emptyLabel.
    if (!schoolName && !grade) return emptyLabel; // 옵션 라벨은 ""를 넘겨 빈 ` · `를 막는다.
    if (!schoolName) return `${grade}학년`; // 학년만.
    if (!grade) return schoolName; // 학교만.
    return `${schoolName} · ${grade}학년`; // 학교 · n학년.
}

/**
 * select option용 `이름 · 학교 · n학년`.
 * 학교 정보가 없으면 이름만 남겨 빈 ` · `를 만들지 않는다.
 */
export function formatStudentOptionLabel(student: { // 연결 폼·역할 부여 select.
    name: string; // 원생 이름.
    schoolName: string | null; // 없으면 이름만.
    grade: string | null; // 없으면 학교만 또는 이름만.
}) { // 빈 ` · `를 만들지 않는다.
    const school = formatStudentSchool(student.schoolName, student.grade, ""); // 빈 학교면 이름만.
    return `${student.name}${school ? ` · ${school}` : ""}`; // 학교 없으면 이름만.
}

/**
 * 학습 기록 날짜를 KST 월/일로 표시한다.
 *
 * @param isoDate ISO 시각. `formatKstMonthDay`가 Asia/Seoul을 적용한다.
 */
export function formatStudentRecordDate(isoDate: string) { // 브라우저 로캘이 아니라 학원 표준시.
    return formatKstMonthDay(isoDate); // Asia/Seoul 월/일. 학습 기록 목록용.
}

/**
 * 수강 해제 시각을 짧은 로캘 날짜로. 연도는 생략한다.
 */
export function formatEnrollmentChangeDate(isoDate: string) { // 서버 KST 변환이 아니라 브라우저 로캘.
    return new Date(isoDate).toLocaleDateString("ko-KR", { // recentChanges 짧은 날짜.
        month: "numeric", // 연도 생략.
        day: "numeric", // 연도 생략. 서버 KST 변환이 아니라 브라우저 로캘.
    });
}

/**
 * `<input type="date">` 기본값 YYYY-MM-DD.
 * 서버 KST가 아니라 브라우저 로컬 오늘이다. 학습기록 폼 전용.
 */
export function getTodayDateInput() { // 회차 Instant(+09:00)와 혼동하지 않는다.
    const today = new Date(); // 브라우저 로컬. 회차 Instant(+09:00)와 혼동하지 않는다.
    const pad = (value: number) => String(value).padStart(2, "0"); // MM/DD 두 자리.

    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`; // date input value.
}
